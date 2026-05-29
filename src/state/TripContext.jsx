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

// How long we keep an unacknowledged write in the pending-echo set before
// giving up. Anything within this window is treated as "ours" if the
// realtime payload matches.
const ECHO_TTL_MS = 60_000;

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(loadLocal);
  const [syncState, setSyncState] = useState(supabaseEnabled ? "connecting" : "local");
  // False until the very first fetch from Supabase has resolved. We must
  // NOT write to the DB before this, otherwise a fresh client (whose state
  // is just the seed) or a client with stale localStorage would push its
  // data up and wipe everyone else's real edits before ever reading them.
  const [initialized, setInitialized] = useState(false);
  // The latest snapshot we've written or accepted as authoritative.
  // Used to skip no-op saves and to recognize duplicate echoes.
  const lastSyncedJson = useRef("");
  // Every JSON snapshot we've written that we haven't yet seen echo back.
  // Multiple writes can be in flight at once if the network is slow, so
  // a single "latest" pointer is not enough — we have to track all of them.
  // Map<json, expiresAtMs>
  const pendingEchoes = useRef(new Map());
  const saveTimer = useRef(null);
  // A live mirror of `trip` so async paths can read the current value
  // without going through a stale closure.
  const tripRef = useRef(trip);

  useEffect(() => {
    tripRef.current = trip;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  // Supabase: initial fetch + realtime subscription
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;
    // Snapshot of what we loaded locally before talking to the server.
    // Lets us tell "user hasn't touched anything since load" (safe to
    // adopt remote) apart from "user typed during the fetch" (keep local).
    const initialJson = canonical(tripRef.current);

    const prunePending = () => {
      const now = Date.now();
      for (const [k, exp] of pendingEchoes.current) {
        if (exp < now) pendingEchoes.current.delete(k);
      }
    };

    (async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("data, updated_at")
        .eq("id", TRIP_KEY)
        .maybeSingle();

      if (!active) return;
      if (error) {
        console.warn("Supabase fetch failed", error);
        setSyncState("error");
        // Stay un-initialized so saves remain blocked — we don't want to
        // overwrite the DB when we couldn't even read it.
        return;
      }

      if (data?.data) {
        const remoteJson = canonical(data.data);
        // Functional update so we compare against the CURRENT local state.
        setTrip((prev) => {
          const localJson = canonical(prev);
          lastSyncedJson.current = remoteJson;
          if (localJson === remoteJson) return prev; // already in sync
          // The user hasn't edited anything since the page loaded, so the
          // remote copy is authoritative — adopt it. This is the common
          // case and is what prevents a fresh/stale client from later
          // pushing its own data over the real DB.
          if (localJson === initialJson) return mergeWithSeed(data.data);
          // The user actively edited during the fetch window — keep those
          // edits; the save effect will push them up once initialized.
          return prev;
        });
      } else {
        // No remote row exists yet — seed it from current local state.
        const current = tripRef.current;
        const currentJson = canonical(current);
        lastSyncedJson.current = currentJson;
        pendingEchoes.current.set(currentJson, Date.now() + ECHO_TTL_MS);
        const { error: upErr } = await supabase
          .from("trips")
          .upsert({ id: TRIP_KEY, data: current, updated_at: new Date().toISOString() });
        if (upErr) {
          console.warn("Supabase init upsert failed", upErr);
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
            return;
          }
          // Already reflects current synced state — no-op.
          if (remoteJson === lastSyncedJson.current) return;
          // Genuine remote change — adopt. Guard against the merged
          // result being canonically identical to current local state,
          // which would otherwise trigger a redundant save cycle.
          lastSyncedJson.current = remoteJson;
          setTrip((prev) => {
            const merged = mergeWithSeed(remote);
            return canonical(merged) === canonical(prev) ? prev : merged;
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push to Supabase whenever local trip diverges from synced
  // state. Gated on `initialized`: until the first fetch has resolved we
  // never write, so a client can't clobber the DB with seed/stale data
  // before it has read what's already there.
  useEffect(() => {
    if (!supabaseEnabled || !initialized) return;
    const tripJson = canonical(trip);
    if (tripJson === lastSyncedJson.current) return;
    setSyncState((s) => (s === "error" ? s : "saving"));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      lastSyncedJson.current = tripJson;
      pendingEchoes.current.set(tripJson, Date.now() + ECHO_TTL_MS);
      const { error } = await supabase
        .from("trips")
        .upsert({ id: TRIP_KEY, data: trip, updated_at: new Date().toISOString() });
      if (error) {
        console.warn("Supabase save failed", error);
        setSyncState("error");
      } else {
        setSyncState("synced");
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

    return { trip, setTrip, update, resetAll, syncState };
  }, [trip, syncState]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export const useTrip = () => {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside TripProvider");
  return ctx;
};

export const personById = (people, id) => people.find((p) => p.id === id);
