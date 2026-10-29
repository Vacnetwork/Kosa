-- 0013_auth_bootstrap.sql
--
-- Two things every Supabase project of this shape needs, and which the earlier
-- migrations deliberately left out of the RLS work:
--
--   1. A trigger on auth.users so a profile (and its private contact row) exist
--      from the moment somebody signs up. Without it a new account has no row to
--      attach a membership application to, and the portal's first screen has
--      nothing to read.
--   2. A one-time bootstrap path for the first super administrator. Nobody can
--      grant themselves a role (see user_roles policies), so the first one has to
--      be created deliberately, by a database owner or the service role.
--
-- Both are idempotent: this file can be re-run safely.

-- ---------------------------------------------------------------- profiles
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
begin
  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(new.email, 'member'), '@', 1)
  );

  insert into public.profiles (id, full_name)
  values (new.id, v_full_name)
  on conflict (id) do nothing;

  insert into public.profile_contacts (profile_id, email)
  values (new.id, new.email)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Backfill anyone who signed up before this migration ran.
insert into public.profiles (id, full_name)
select u.id,
       coalesce(
         nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
         split_part(coalesce(u.email, 'member'), '@', 1)
       )
from auth.users u
on conflict (id) do nothing;

insert into public.profile_contacts (profile_id, email)
select u.id, u.email
from auth.users u
on conflict (profile_id) do nothing;

-- ------------------------------------------------------- first administrator
-- Run once, immediately after creating the project:
--     select public.bootstrap_super_admin('you@example.org');
--
-- Allowed only when: it is called by the database owner / service role, or by a
-- signed-in user while the association still has no super administrator at all
-- (the genuinely empty bootstrap case). After that it refuses, so it cannot be
-- used to escalate later.
create or replace function public.bootstrap_super_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_existing int;
  v_caller_role text := coalesce(auth.role(), '');
begin
  select count(*) into v_existing
  from public.user_roles
  where role = 'super_admin';

  if v_existing > 0
     and v_caller_role <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'A super administrator already exists; ask them to grant the role.'
      using errcode = '42501';
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(p_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No account exists for %', p_email using errcode = 'no_data_found';
  end if;

  insert into public.profiles (id, full_name)
  select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
  from auth.users u
  where u.id = v_user_id
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (v_user_id, 'super_admin')
  on conflict (user_id, role) do nothing;

  perform private.write_audit(
    v_user_id,
    'role.bootstrap',
    'user_roles',
    v_user_id::text,
    jsonb_build_object('role', 'super_admin', 'email', p_email)
  );
end;
$$;

revoke all on function public.bootstrap_super_admin(text) from public, anon;
grant execute on function public.bootstrap_super_admin(text) to authenticated, service_role;

comment on function public.bootstrap_super_admin(text) is
  'One-time grant of super_admin to the first administrator; refuses once any super_admin exists unless called by the service role.';
