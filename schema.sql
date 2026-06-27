-- ============================================================
--  BefitAfrica (BFA) — Supabase database schema
--  Run this once in the Supabase SQL Editor (see SETUP_GUIDE.md)
-- ============================================================

-- ---------- MEMBERS ----------
-- One row per member. The `id` matches Supabase Auth user id (uuid),
-- so a member's profile is linked to their login account.
create table if not exists public.members (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  name        text not null,
  role        text not null default 'member',          -- 'member' | 'admin'
  occupation  text,
  country     text,
  state       text,
  lga         text,
  address     text,
  hub         text,
  gender      text,
  phone       text,
  avatar      text,
  status      text default 'new',
  verified    boolean default false,
  streak      int default 0,
  sessions    int default 0,
  km          numeric default 0,
  bmi         numeric default 0,
  bp          text default '—',
  hr          int default 0,
  weight      numeric default 0,
  height      numeric default 0,
  goals       jsonb default '[]'::jsonb,
  monthly_km  jsonb default '[]'::jsonb,
  joined      text,
  created_at  timestamptz default now()
);

-- ---------- ACTIVITIES (GPS workouts) ----------
create table if not exists public.activities (
  id           bigint generated always as identity primary key,
  member_id    uuid references public.members(id) on delete cascade,
  type         text,
  km           numeric,
  steps        int,
  duration_sec int,
  avg_bpm      int,
  route        jsonb,
  date         text,
  ts           bigint,
  created_at   timestamptz default now()
);

-- ---------- ATTENDANCE (clock in/out) ----------
create table if not exists public.attendance (
  id          bigint generated always as identity primary key,
  member_id   uuid references public.members(id) on delete cascade,
  name        text,
  avatar      text,
  hub         text,
  program     text,
  in_at       bigint,
  out_at      bigint,
  duration_ms bigint,
  date        text,
  created_at  timestamptz default now()
);

-- ---------- OPEN CLOCK-INS (one active clock-in per member) ----------
create table if not exists public.attendance_open (
  member_id  uuid primary key references public.members(id) on delete cascade,
  name       text,
  hub        text,
  program    text,
  in_at      bigint
);

-- ---------- EVENTS ----------
create table if not exists public.events (
  id          bigint generated always as identity primary key,
  name        text,
  date        text,
  time        text,
  hub         text,
  type        text,
  registered  jsonb default '[]'::jsonb,
  created_at  timestamptz default now()
);

-- ---------- CHALLENGES ----------
create table if not exists public.challenges (
  id           bigint generated always as identity primary key,
  name         text,
  duration     text,
  goal         text,
  icon         text,
  participants jsonb default '[]'::jsonb,
  created_at   timestamptz default now()
);

-- ---------- MESSAGES (community chat) ----------
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  channel     text,                 -- 'general' | 'interhub' | 'intrahub:<hub>'
  member_id   uuid references public.members(id) on delete set null,
  name        text,
  avatar      text,
  hub         text,
  text        text,
  created_at  timestamptz default now()
);

-- ---------- HEALTH LOG ----------
create table if not exists public.health_logs (
  id          bigint generated always as identity primary key,
  member_id   uuid references public.members(id) on delete cascade,
  weight      numeric,
  bp          text,
  hr          int,
  steps       int,
  blood_sugar numeric,
  waist       numeric,
  date        text,
  month       text,
  created_at  timestamptz default now()
);

-- ============================================================
--  ROW LEVEL SECURITY
--  Enables fine-grained access. Members see the community;
--  only the owner (or an admin) can change a given member's data.
-- ============================================================
alter table public.members        enable row level security;
alter table public.activities     enable row level security;
alter table public.attendance     enable row level security;
alter table public.attendance_open enable row level security;
alter table public.events         enable row level security;
alter table public.challenges     enable row level security;
alter table public.messages       enable row level security;
alter table public.health_logs    enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(select 1 from public.members where id = auth.uid() and role = 'admin');
$$;

-- MEMBERS: everyone signed in can read the directory (needed for leaderboards/hubs).
create policy members_read on public.members
  for select using (auth.role() = 'authenticated');
-- A member can insert their own profile row at signup.
create policy members_insert_self on public.members
  for insert with check (auth.uid() = id);
-- A member can update their own row; an admin can update anyone.
create policy members_update on public.members
  for update using (auth.uid() = id or public.is_admin());
-- Only admins can delete members.
create policy members_delete on public.members
  for delete using (public.is_admin());

-- ACTIVITIES: read all (for community), write your own.
create policy act_read   on public.activities for select using (auth.role() = 'authenticated');
create policy act_insert on public.activities for insert with check (auth.uid() = member_id);
create policy act_mod    on public.activities for update using (auth.uid() = member_id or public.is_admin());
create policy act_del    on public.activities for delete using (auth.uid() = member_id or public.is_admin());

-- ATTENDANCE: read all, write your own.
create policy att_read   on public.attendance for select using (auth.role() = 'authenticated');
create policy att_insert on public.attendance for insert with check (auth.uid() = member_id);
create policy att_del    on public.attendance for delete using (auth.uid() = member_id or public.is_admin());

create policy attopen_read   on public.attendance_open for select using (auth.role() = 'authenticated');
create policy attopen_write  on public.attendance_open for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- EVENTS & CHALLENGES: everyone reads; only admins create/edit/delete; anyone can update the join/register lists.
create policy ev_read   on public.events for select using (auth.role() = 'authenticated');
create policy ev_admin  on public.events for all using (public.is_admin()) with check (public.is_admin());
create policy ev_join   on public.events for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy ch_read   on public.challenges for select using (auth.role() = 'authenticated');
create policy ch_admin  on public.challenges for all using (public.is_admin()) with check (public.is_admin());
create policy ch_join   on public.challenges for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- MESSAGES: read all, post as yourself.
create policy msg_read   on public.messages for select using (auth.role() = 'authenticated');
create policy msg_insert on public.messages for insert with check (auth.uid() = member_id);

-- HEALTH LOGS: a member reads & writes only their own; admins can read all.
create policy hl_read   on public.health_logs for select using (auth.uid() = member_id or public.is_admin());
create policy hl_insert on public.health_logs for insert with check (auth.uid() = member_id);

-- ============================================================
--  Done. Next: create the admin account (see SETUP_GUIDE.md),
--  then mark it role='admin' with:
--    update public.members set role='admin', verified=true
--    where email='abiola@befitafrica.org';
-- ============================================================
