import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TRIP_ID = import.meta.env.VITE_TRIP_ID || "miami-2026";

export const supabaseEnabled = Boolean(url && anon);

export const supabase = supabaseEnabled ? createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 5 } },
}) : null;

// The live data lives under a versioned key. Older cached builds of the
// app (which had the data-wiping bug) read/write the un-versioned key, so
// bumping this isolates the real data from any stale client that hasn't
// updated yet. PREV_TRIP_KEY is read once to migrate existing data forward.
export const TRIP_KEY = `${TRIP_ID}-v2`;
export const PREV_TRIP_KEY = TRIP_ID;
