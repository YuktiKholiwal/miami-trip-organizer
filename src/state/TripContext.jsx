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

const seedJson = JSON.stringify(seedTrip);

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(loadLocal);
  const [syncState, setSyncState] = useState(supabaseEnabled ? "connecting" : "local");
  // JSON of the last value we know is in sync with the DB. Used to:
  //  - ignore realtime echoes of our own writes (no timing window needed)
  //  - skip no-op saves when nothing meaningful changed
  const lastSyncedJson = useRef("");
  const saveTimer = useRef(null);
  // Keeps a live reference to the current trip so async paths can read
  // it without going through a stale closure.
  const tripRef = useRef(trip);

  useEffect(() => {
    tripRef.current = trip;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  // Supabase: initial fetch + realtime subscription
  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;

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
        const remoteJson = JSON.stringify(data.data);
        // Use functional update so we compare against the CURRENT local
        // state (the user may have made edits during the fetch).
        setTrip((prev) => {
          const localJson = JSON.stringify(prev);
          lastSyncedJson.current = remoteJson;
          if (localJson === remoteJson) return prev;
          // Local was untouched seed -> safe to adopt remote.
          if (localJson === seedJson) return mergeWithSeed(data.data);
          // Local has user edits — keep them. The save effect will
          // push them up because trip !== lastSyncedJson.
          return prev;
        });
      } else {
        // No remote row yet: push current local up to seed it.
        const current = tripRef.current;
        const currentJson = JSON.stringify(current);
        lastSyncedJson.current = currentJson;
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
          const remoteJson = JSON.stringify(remote);
          // Echo of our own write — we already have this state.
          if (remoteJson === lastSyncedJson.current) return;
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

  // Debounced push to Supabase whenever local trip diverges from what's synced
  useEffect(() => {
    if (!supabaseEnabled) return;
    const tripJson = JSON.stringify(trip);
    if (tripJson === lastSyncedJson.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      lastSyncedJson.current = tripJson;
      const { error } = await supabase
        .from("trips")
        .upsert({ id: TRIP_KEY, data: trip, updated_at: new Date().toISOString() });
      if (error) {
        console.warn("Supabase save failed", error);
        setSyncState("error");
      } else if (syncState !== "synced") {
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
