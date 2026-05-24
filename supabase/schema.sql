-- Run this once in the Supabase SQL editor (Database → SQL Editor → New query).
-- It creates a single table that stores the whole trip as a JSON blob,
-- with realtime enabled and permissive policies (this is a private trip site
-- with no auth — keep the URL secret).

create table if not exists public.trips (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.trips enable row level security;

drop policy if exists "trips read" on public.trips;
drop policy if exists "trips insert" on public.trips;
drop policy if exists "trips update" on public.trips;

create policy "trips read" on public.trips for select using (true);
create policy "trips insert" on public.trips for insert with check (true);
create policy "trips update" on public.trips for update using (true) with check (true);

-- Enable realtime broadcasts on this table.
alter publication supabase_realtime add table public.trips;
