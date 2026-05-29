import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedTrip } from "./seed";
import { supabase, supabaseEnabled, TRIP_KEY } from "./supabase";

const STORAGE_KEY = "miami-trip-v1";
const TripContext = createContext(null);

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedTrip;
    const parsed = JSON.parse(raw);
    return mergeWithSeed(parsed);
  } catch {
    return seedTrip;
  }
};

const mergeWithSeed = (incoming) => {
  const base = structuredClone(seedTrip);
  for (const key of Object.keys(base)) {
    if (incoming[key] !== undefined) base[key] = incoming[key];
  }
  return base;
};

// Canonical (key-sorted) JSON serialization. Postgres JSONB does NOT
// preserve object key order, so a plain JSON.stringify of the data we
// send won't equal JSON.stringify of the same data when it echoes back
// over realtime. Sorting keys recursively makes the comparison stable.
const canonical = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
};

// 3-way merge at top-level-section granularity (people, expenses, stay,
// itinerary, …). For each section: if WE changed it relative to `base`
// (what we last knew was synced), our version wins; otherwise we keep
// `theirs` (the latest from the DB, which may include another device's
// changes). This is what stops one device's save of section A from
// wiping section B that someone else just edited — the core fix for the
// "expenses keep getting wiped" problem, since the trip is one shared blob.
const threeWayMerge = (base, ours, theirs) => {
  const result = structuredClone(seedTrip);
  for (const key of Object.keys(result)) {
    const ourVal = ours?.[key];
    const theirVal = theirs?.[key];
    if (ourVal === undefined) {
      if (theirVal !== undefined) result[key] = theirVal;
      continue;
    }
    const weChanged = base === null || canonical(ourVal) !== canonical(base?.[key]);
    if (weChanged) {
      result[key] = ourVal;
    } else if (theirVal !== undefined) {
      result[key] = theirVal;
    }
  }
  return result;
};

// How long we keep an unacknowledged write in the pending-echo set before
// giving up. Anything within this window is treated as "ours" if the
// realtime payload matches.
const ECHO_TTL_MS = 60_000;

export const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

// Compact summary of a trip blob's record counts, for diagnostics.
const counts = (t) =>
  t && typeof t === "object"
    ? `people=${t.people?.length ?? "?"} exp=${t.expenses?.length ?? "?"} places=${t.places?.length ?? "?"} polls=${t.polls?.length ?? "?"}`
    : "none";

// Logs to the console AND a capped in-memory ring buffer reachable from the
// devtools console as `window.__miamiSync` — so we can inspect exactly what
// each device fetched/wrote when the DB looks wiped.
const log = (...args) => {
  try {
    // eslint-disable-next-line no-console
    console.log("[miami-sync]", ...args);
    const buf = (window.__miamiSync = window.__miamiSync || []);
    buf.push(`${new Date().toISOString().slice(11, 23)} ${args.join(" ")}`);
    if (buf.length > 300) buf.shift();
  } catch {
    /* ignore */
  }
};

// True only if the blob actually carries usable trip data (not null/{}).
const hasRealData = (d) => !!d && typeof d === "object" && Object.keys(d).length > 0;

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(loadLocal);
  const [syncState, setSyncState] = useState(supabaseEnabled ? "connecting" : "local");
  // False until the very first fetch from Supabase has resolved. We must
  // NOT write to the DB before this, otherwise a fresh client (whose state
  // is just the seed) or a client with stale localStorage would push its
  // data up and wipe everyone else's real edits before ever reading them.
  const [initialized, setInitialized] = useState(false);
  // Canonical JSON of the last state we know is in sync with the DB.
  const lastSyncedJson = useRef("");
  // Object form of the same, used as the `base` for 3-way merges.
  const lastSyncedData = useRef(null);
  // Every JSON snapshot we've written that we haven't yet seen echo back.
  // Map<json, expiresAtMs>
  const pendingEchoes = useRef(new Map());
  const saveTimer = useRef(null);
  // A live mirror of `trip` so async paths read the current value without
  // going through a stale closure.
  const tripRef = useRef(trip);

  useEffect(() => {
    tripRef.current = trip;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  // Supabase: initial fetch + realtime subscription
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;
    log("startup build", BUILD_ID, "| local", counts(tripRef.current));
    // What we loaded locally before talking to the server — the merge base
    // for the initial reconcile, so an edit made during the fetch window is
    // preserved while everything else adopts the authoritative remote.
    const initialData = structuredClone(tripRef.current);

    const prunePending = () => {
      const now = Date.now();
      for (const [k, exp] of pendingEchoes.current) {
        if (exp < now) pendingEchoes.current.delete(k);
      }
    };

    const adopt = (base, theirs, why) => {
      const prev = tripRef.current;
      const merged = threeWayMerge(base, prev, theirs);
      log(why, "| base", counts(base), "| local", counts(prev), "| remote", counts(theirs), "=> show", counts(merged));
      lastSyncedData.current = theirs;
      lastSyncedJson.current = canonical(theirs);
      if (canonical(merged) !== canonical(prev)) {
        setTrip(mergeWithSeed(merged));
      }
    };

    (async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("data")
        .eq("id", TRIP_KEY)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.warn("Supabase fetch failed", error);
        log("fetch ERROR", error.message, "- saves stay blocked");
        setSyncState("error");
        // Stay un-initialized so saves remain blocked — never overwrite the
        // DB when we couldn't even read it.
        return;
      }

      log("fetch ok | remote", hasRealData(data?.data) ? counts(data.data) : "NO REAL DATA");

      if (hasRealData(data?.data)) {
        adopt(initialData, data.data, "initial adopt");
      } else {
        // No usable remote row yet — seed it from current local state.
        const current = tripRef.current;
        log("seeding empty DB with", counts(current));
        lastSyncedData.current = current;
        lastSyncedJson.current = canonical(current);
        pendingEchoes.current.set(lastSyncedJson.current, Date.now() + ECHO_TTL_MS);
        const { error: upErr } = await supabase
          .from("trips")
          .upsert({ id: TRIP_KEY, data: current, updated_at: new Date().toISOString() });
        if (upErr) {
          console.warn("Supabase init upsert failed", upErr);
          log("init upsert ERROR", upErr.message);
          setSyncState("error");
          return;
        }
      }
      setSyncState("synced");
      setInitialized(true); // unblock saves now that we've reconciled
    })();

    const channel = supabase
      .channel(`trip:${TRIP_KEY}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${TRIP_KEY}` },
        (payload) => {
          const remote = payload.new?.data;
          if (!remote) return;
          const remoteJson = canonical(remote);
          prunePending();
          // Echo of a write we initiated (any still-pending one).
          if (pendingEchoes.current.has(remoteJson)) {
            pendingEchoes.current.delete(remoteJson);
            log("realtime echo (ours, ignored)", counts(remote));
            return;
          }
          if (remoteJson === lastSyncedJson.current) return;
          // Genuine remote change — merge it in, preserving any local
          // unsaved edits to sections we touched.
          adopt(lastSyncedData.current, remote, "realtime adopt");
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push to Supabase. Gated on `initialized` so a client never
  // writes before it has read. Uses read-modify-write with a 3-way merge so
  // it only overwrites the sections this device actually changed.
  useEffect(() => {
    if (!supabaseEnabled || !initialized) return;
    const tripJson = canonical(trip);
    if (tripJson === lastSyncedJson.current) return;
    setSyncState((s) => (s === "error" ? s : "saving"));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      // Re-read the latest so we merge on top of anyone else's changes.
      let theirs = null;
      const { data: fresh, error: readErr } = await supabase
        .from("trips")
        .select("data")
        .eq("id", TRIP_KEY)
        .maybeSingle();
      if (!readErr && hasRealData(fresh?.data)) theirs = fresh.data;

      const ours = tripRef.current;
      const toWrite = theirs ? threeWayMerge(lastSyncedData.current, ours, theirs) : ours;
      const toWriteJson = canonical(toWrite);

      log(
        "SAVE | local", counts(ours),
        "| db-now", theirs ? counts(theirs) : (readErr ? "READ-ERR" : "none"),
        "=> writing", counts(toWrite)
      );

      lastSyncedJson.current = toWriteJson;
      lastSyncedData.current = toWrite;
      pendingEchoes.current.set(toWriteJson, Date.now() + ECHO_TTL_MS);

      const { error } = await supabase
        .from("trips")
        .upsert({ id: TRIP_KEY, data: toWrite, updated_at: new Date().toISOString() });
      if (error) {
        console.warn("Supabase save failed", error);
        log("SAVE ERROR", error.message);
        setSyncState("error");
        return;
      }
      setSyncState("synced");
      // If the merge pulled in remote changes, reflect them locally.
      if (toWriteJson !== canonical(tripRef.current)) {
        setTrip(mergeWithSeed(toWrite));
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip, initialized]);

  const value = useMemo(() => {
    const update = (path, updater) => {
      setTrip((prev) => {
        const next = structuredClone(prev);
        const keys = path.split(".");
        let cursor = next;
        for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
        const last = keys[keys.length - 1];
        cursor[last] = typeof updater === "function" ? updater(cursor[last]) : updater;
        return next;
      });
    };

    const resetAll = () => {
      const input = window.prompt(
        `Enter the secret key to reset ALL trip data back to defaults.\n\n(This wipes everyone's edits and can't be undone.)`
      );
      if (input == null) return;
      if (input.trim().toLowerCase() !== "science") {
        window.alert("Wrong key — nothing was reset.");
        return;
      }
      localStorage.removeItem(STORAGE_KEY);
      setTrip(seedTrip);
    };

    return { trip, setTrip, update, resetAll, syncState, buildId: BUILD_ID };
  }, [trip, syncState]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside TripProvider");
  return ctx;
};

export const personById = (people, id) => people.find((p) => p.id === id);
