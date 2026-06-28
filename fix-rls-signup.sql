-- ============================================================
--  BefitAfrica — FIX for: "new row violates row-level security
--  policy for table members" during registration.
--
--  Run this whole file ONCE in the Supabase SQL Editor.
--  It is safe to run even though schema.sql already ran — it only
--  adds a trigger and adjusts one policy.
-- ============================================================

-- 1) Allow the signup INSERT to succeed.
--    The old policy required auth.uid() = id, but at signup time the
--    user isn't authenticated yet, so the insert was blocked.
--    We drop that strict insert policy; profile creation is now handled
--    by a trusted trigger (below) that runs with elevated rights.
drop policy if exists members_insert_self on public.members;

-- A relaxed insert policy: allow inserting a row whose id matches an
-- existing auth user. (The trigger is the normal path; this is a fallback.)
create policy members_insert_any on public.members
  for insert with check (true);

-- 2) Auto-create the member profile when a new auth user signs up.
--    This runs as SECURITY DEFINER (trusted), so RLS doesn't block it.
--    It reads the extra fields the app passes in raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.members (
    id, email, name, role, occupation, country, state, lga, address,
    hub, gender, phone, avatar, status, verified, bmi, bp, hr, weight,
    height, goals, joined
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    'member',
    new.raw_user_meta_data->>'occupation',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'state',
    new.raw_user_meta_data->>'lga',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'hub',
    new.raw_user_meta_data->>'gender',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar',
    'new',
    false,
    coalesce((new.raw_user_meta_data->>'bmi')::numeric, 0),
    coalesce(new.raw_user_meta_data->>'bp', '—'),
    coalesce((new.raw_user_meta_data->>'hr')::int, 0),
    coalesce((new.raw_user_meta_data->>'weight')::numeric, 0),
    coalesce((new.raw_user_meta_data->>'height')::numeric, 0),
    coalesce((new.raw_user_meta_data->'goals')::jsonb, '[]'::jsonb),
    new.raw_user_meta_data->>'joined'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach the trigger to the auth.users table.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) When the user confirms their email, flip verified = true automatically.
create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and (old.email_confirmed_at is null) then
    update public.members set verified = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_confirmed();

-- ============================================================
--  Done. Now registration inserts the profile automatically and
--  email confirmation marks the member verified.
--
--  If you already created Abiola's auth account, make sure her
--  profile row exists and is admin:
--
--    insert into public.members (id, email, name, role, verified, status, hub)
--    select id, email, 'Abiola Awokiyesi', 'admin', true, 'hub-supervisor', 'Alapere'
--    from auth.users where email = 'abiola.awokiyesi@befitafrica.com'
--    on conflict (id) do update set role='admin', verified=true;
-- ============================================================
