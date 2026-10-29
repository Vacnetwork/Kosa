-- Membership RPCs. Each one is SECURITY DEFINER, sets search_path = '' and
-- validates the caller before doing anything: the function signature is the
-- only API a client sees, and the checks inside replace direct table access.

create or replace function public.submit_membership_application(
  p_full_name text,
  p_graduation_year int,
  p_cohort_note text,
  p_motivation text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_year int := extract(year from now())::int;
begin
  if v_uid is null then
    raise exception 'Sign in to apply for membership' using errcode = '42501';
  end if;

  if p_full_name is null or char_length(btrim(p_full_name)) not between 2 and 120 then
    raise exception 'Enter your full name' using errcode = '22023';
  end if;
  if p_graduation_year is null or p_graduation_year not between 1950 and (v_year + 1) then
    raise exception 'Choose a valid graduation year' using errcode = '22023';
  end if;
  if p_motivation is null or char_length(btrim(p_motivation)) not between 40 and 2000 then
    raise exception 'Tell the committee a little more (40 to 2000 characters)' using errcode = '22023';
  end if;
  if p_cohort_note is not null and char_length(p_cohort_note) > 160 then
    raise exception 'Keep the cohort note under 160 characters' using errcode = '22023';
  end if;

  -- Three attempts per hour, including repeated/invalid ones.
  perform public.assert_rate_limit('membership_application:' || v_uid::text, 3, 3600);

  if exists (
    select 1 from public.memberships m
    where m.user_id = v_uid and m.status in ('active', 'pending')
  ) then
    raise exception 'You already have a membership record with the association';
  end if;

  if exists (
    select 1 from public.membership_applications a
    where a.user_id = v_uid and a.status in ('pending', 'needs_info')
  ) then
    raise exception 'You already have an application in review';
  end if;

  -- A brand-new account may not have a profile row yet; one application is
  -- enough to create the stub the rest of the schema hangs off.
  insert into public.profiles (id, full_name, graduation_year)
  values (v_uid, btrim(p_full_name), p_graduation_year)
  on conflict (id) do nothing;

  insert into public.membership_applications (user_id, full_name, graduation_year, cohort_note, motivation)
  values (
    v_uid,
    btrim(p_full_name),
    p_graduation_year,
    nullif(btrim(coalesce(p_cohort_note, '')), ''),
    btrim(p_motivation)
  )
  returning id into v_id;

  perform private.write_audit(
    v_uid,
    'membership.application.submitted',
    'membership_applications',
    v_id::text,
    jsonb_build_object('graduation_year', p_graduation_year)
  );

  return v_id;
end;
$$;

create or replace function public.decide_membership_application(
  p_application_id uuid,
  p_decision text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_app public.membership_applications;
  v_member_no text;
begin
  if v_uid is null or not private.is_admin(v_uid) then
    raise exception 'Only the membership committee can decide applications' using errcode = '42501';
  end if;

  if p_decision is null or p_decision not in ('approved', 'rejected', 'needs_info') then
    raise exception 'Unknown decision: use approved, rejected or needs_info' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 2000 then
    raise exception 'Keep the note under 2000 characters' using errcode = '22023';
  end if;

  select * into v_app
  from public.membership_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  -- A committee member cannot approve their own application.
  if v_app.user_id = v_uid then
    raise exception 'You cannot decide your own application' using errcode = '42501';
  end if;

  update public.membership_applications
  set status = p_decision,
      reviewed_at = now(),
      reviewed_by = v_uid,
      review_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = v_app.id;

  if p_decision = 'approved' then
    v_member_no := 'KOSA-'
      || coalesce(v_app.graduation_year, extract(year from now())::int)::text
      || '-'
      || lpad(nextval('public.membership_member_no_seq')::text, 4, '0');

    insert into public.memberships (user_id, member_no, status, cohort_year, joined_at)
    values (v_app.user_id, v_member_no, 'active', v_app.graduation_year, now())
    on conflict (user_id) do update
      set status = 'active',
          joined_at = coalesce(memberships.joined_at, now()),
          cohort_year = coalesce(memberships.cohort_year, excluded.cohort_year),
          member_no = coalesce(memberships.member_no, excluded.member_no),
          updated_at = now();

    insert into public.user_roles (user_id, role, granted_by)
    values (v_app.user_id, 'member', v_uid)
    on conflict (user_id, role) do nothing;
  end if;

  perform private.write_audit(
    v_uid,
    'membership.application.' || p_decision,
    'membership_applications',
    v_app.id::text,
    jsonb_build_object('user_id', v_app.user_id, 'member_no', v_member_no)
  );
end;
$$;

create or replace function public.set_member_status(
  p_user_id uuid,
  p_status text,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.is_admin(v_uid) then
    raise exception 'Only the membership committee can change a member status' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('pending', 'active', 'lapsed', 'suspended') then
    raise exception 'Unknown membership status' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 2000 then
    raise exception 'Keep the note under 2000 characters' using errcode = '22023';
  end if;

  update public.memberships
  set status = p_status,
      notes = nullif(btrim(coalesce(p_notes, '')), ''),
      joined_at = case when p_status = 'active' then coalesce(joined_at, now()) else joined_at end
  where user_id = p_user_id;

  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  perform private.write_audit(
    v_uid,
    'membership.status.' || p_status,
    'memberships',
    p_user_id::text,
    jsonb_build_object('status', p_status)
  );
end;
$$;

create or replace function public.set_user_role(
  p_user_id uuid,
  p_role text,
  p_grant boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.is_super_admin(v_uid) then
    raise exception 'Only a super admin can change roles' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('super_admin', 'membership_officer', 'event_manager', 'treasurer', 'member') then
    raise exception 'Unknown role' using errcode = '22023';
  end if;
  if p_user_id = v_uid then
    raise exception 'You cannot change your own roles' using errcode = '42501';
  end if;
  if p_grant is null then
    raise exception 'Say whether the role is granted or revoked' using errcode = '22023';
  end if;

  if p_grant then
    insert into public.user_roles (user_id, role, granted_by)
    values (p_user_id, p_role, v_uid)
    on conflict (user_id, role) do nothing;
  else
    if p_role = 'super_admin'
       and (select count(*) from public.user_roles where role = 'super_admin') <= 1 then
      raise exception 'At least one super admin must remain';
    end if;
    delete from public.user_roles where user_id = p_user_id and role = p_role;
  end if;

  perform private.write_audit(
    v_uid,
    case when p_grant then 'role.granted' else 'role.revoked' end,
    'user_roles',
    p_user_id::text,
    jsonb_build_object('role', p_role)
  );
end;
$$;

revoke all on function public.submit_membership_application(text, int, text, text) from public, anon;
revoke all on function public.decide_membership_application(uuid, text, text) from public, anon;
revoke all on function public.set_member_status(uuid, text, text) from public, anon;
revoke all on function public.set_user_role(uuid, text, boolean) from public, anon;

grant execute on function public.submit_membership_application(text, int, text, text) to authenticated;
grant execute on function public.decide_membership_application(uuid, text, text) to authenticated;
grant execute on function public.set_member_status(uuid, text, text) to authenticated;
grant execute on function public.set_user_role(uuid, text, boolean) to authenticated;
