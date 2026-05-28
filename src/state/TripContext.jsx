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

const seedJson = canonical(seedTrip);
// How long we keep an unacknowledged write in the pending-echo set before
// giving up. Anything within this window is treated as "ours" if the
// realtime payload matches.
const ECHO_TTL_MS = 60_000;

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(loadLocal);
  const [syncState, setSyncState] = useState(supabaseEnabled ? "connecting" : "local");
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
        return;
      }

      if (data?.data) {
        const remoteJson = canonical(data.data);
        // Use functional update so we compare against the CURRENT local
        // state — the user may have edited things during the fetch.
        setTrip((prev) => {
          const localJson = canonical(prev);
          lastSyncedJson.current = remoteJson;
          if (localJson === remoteJson) return prev;
          // Local is just the seed (untouched) — adopt remote.
          if (localJson === seedJson) return mergeWithSeed(data.data);
          // Local has user edits — keep them; the save effect will push
          // them up because trip !== lastSyncedJson.
          return prev;
        });
      } else {
        // No remote row — seed it from current local state.
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
          // Genuine remote change — adopt.
          lastSyncedJson.current = remoteJson;
          setTrip(mergeWithSeed(remote));
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push to Supabase whenever local trip diverges from synced state
  useEffect(() => {
    if (!supabaseEnabled) return;
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
  }, [trip]);

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
      if (!confirm("Reset all trip data to defaults? This can't be undone.")) return;
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
