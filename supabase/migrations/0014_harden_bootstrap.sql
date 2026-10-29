-- Hardens the super-admin bootstrap introduced in 0013.
--
-- 0013 allowed the call when `current_user` was postgres/supabase_admin. Inside
-- a SECURITY DEFINER function current_user is the *owner*, so every signed-in
-- caller passed that test: a plain member could grant themselves super_admin.
-- The bootstrap is now a database-owner / service-role action only, and it is no
-- longer executable by anon or authenticated at all.

create or replace function public.bootstrap_super_admin(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_privileged boolean :=
    coalesce(auth.role(), '') = 'service_role'
    or (auth.uid() is null and session_user in ('postgres', 'supabase_admin'));
begin
  if not v_privileged then
    raise exception 'bootstrap_super_admin is a database-owner action: run it from the SQL editor or with the service role'
      using errcode = '42501';
  end if;

  if p_email is null or char_length(btrim(p_email)) < 3 then
    raise exception 'Provide the email address of an existing account' using errcode = '22023';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = lower(btrim(p_email))
  limit 1;

  if v_user_id is null then
    raise exception 'No account exists for %', p_email using errcode = 'P0002';
  end if;

  insert into public.profiles (id, full_name)
  select u.id, coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
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
    jsonb_build_object('role', 'super_admin')
  );
end;
$$;

revoke all on function public.bootstrap_super_admin(text) from public, anon, authenticated;
grant execute on function public.bootstrap_super_admin(text) to service_role;

comment on function public.bootstrap_super_admin(text) is
  'Grants super_admin to an existing account. Owner/service role only: it is revoked from anon and authenticated.';
