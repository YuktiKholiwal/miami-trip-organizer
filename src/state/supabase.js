import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TRIP_ID = import.meta.env.VITE_TRIP_ID || "miami-2026";

export const supabaseEnabled = Boolean(url && anon);

export const supabase = supabaseEnabled ? createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 5 } },
}) : null;

export const TRIP_KEY = TRIP_ID;
