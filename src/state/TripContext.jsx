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

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(loadLocal);
  const [syncState, setSyncState] = useState(supabaseEnabled ? "connecting" : "local");
  const lastWriteSelf = useRef(0);
  const saveTimer = useRef(null);

  // Persist to localStorage always
  useEffect(() => {
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
        setTrip(mergeWithSeed(data.data));
      } else {
        // Seed remote row from local on first run
        await supabase.from("trips").upsert({ id: TRIP_KEY, data: trip, updated_at: new Date().toISOString() });
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
          const updated = new Date(payload.new?.updated_at || 0).getTime();
          if (!remote) return;
          // Ignore echoes of our own writes within a short window
          if (updated <= lastWriteSelf.current + 500) return;
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

  // Debounced push to Supabase on changes
  useEffect(() => {
    if (!supabaseEnabled) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const stamp = new Date().toISOString();
      lastWriteSelf.current = new Date(stamp).getTime();
      const { error } = await supabase.from("trips").upsert({ id: TRIP_KEY, data: trip, updated_at: stamp });
      if (error) {
        console.warn("Supabase save failed", error);
        setSyncState("error");
      } else if (syncState !== "synced") {
        setSyncState("synced");
      }
    }, 500);
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
