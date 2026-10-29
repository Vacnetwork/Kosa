-- 0015_application_details.sql
--
-- The association's own membership application form asks for more than a name
-- and a year: a category of membership (former student, former staff,
-- associate/friend, other), the areas the applicant wants to be involved in,
-- and how they want to be contacted. Those answers are what the membership
-- officer and the programme leads actually use, so they belong on the
-- application rather than in a free-text note.
--
-- The RPC gains three optional parameters; every existing call keeps working
-- because they default to null.

alter table public.membership_applications
  add column if not exists membership_category text not null default 'former_student',
  add column if not exists areas_of_interest text[] not null default '{}',
  add column if not exists communication_preference text not null default 'all';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'membership_applications_category_values'
  ) then
    alter table public.membership_applications
      add constraint membership_applications_category_values
      check (membership_category in ('former_student', 'former_staff', 'associate', 'other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_applications_preference_values'
  ) then
    alter table public.membership_applications
      add constraint membership_applications_preference_values
      check (communication_preference in ('whatsapp', 'email', 'sms', 'all'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'membership_applications_interests_size'
  ) then
    alter table public.membership_applications
      add constraint membership_applications_interests_size
      check (cardinality(areas_of_interest) <= 8);
  end if;
end
$$;

create index if not exists membership_applications_category_idx
  on public.membership_applications (membership_category);

create or replace function public.submit_membership_application(
  p_full_name text,
  p_graduation_year int,
  p_cohort_note text,
  p_motivation text,
  p_membership_category text default null,
  p_areas_of_interest text[] default null,
  p_communication_preference text default null
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
  v_category text := coalesce(nullif(btrim(coalesce(p_membership_category, '')), ''), 'former_student');
  v_preference text := coalesce(nullif(btrim(coalesce(p_communication_preference, '')), ''), 'all');
  v_interests text[] := coalesce(p_areas_of_interest, '{}');
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
  if v_category not in ('former_student', 'former_staff', 'associate', 'other') then
    raise exception 'Choose one of the membership categories' using errcode = '22023';
  end if;
  if v_preference not in ('whatsapp', 'email', 'sms', 'all') then
    raise exception 'Choose how you would like to be contacted' using errcode = '22023';
  end if;
  if cardinality(v_interests) > 8 then
    raise exception 'Choose up to eight areas of interest' using errcode = '22023';
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

  insert into public.membership_applications (
    user_id,
    full_name,
    graduation_year,
    cohort_note,
    motivation,
    membership_category,
    areas_of_interest,
    communication_preference
  )
  values (
    v_uid,
    btrim(p_full_name),
    p_graduation_year,
    nullif(btrim(coalesce(p_cohort_note, '')), ''),
    btrim(p_motivation),
    v_category,
    v_interests,
    v_preference
  )
  returning id into v_id;

  perform private.write_audit(
    v_uid,
    'membership.application.submitted',
    'membership_applications',
    v_id::text,
    jsonb_build_object(
      'graduation_year', p_graduation_year,
      'category', v_category,
      'interests', v_interests
    )
  );

  return v_id;
end;
$$;

comment on column public.membership_applications.membership_category is
  'Category from the association''s application form: former_student, former_staff, associate, other.';

-- One signature only: the four-argument version from 0009 is dropped so that a
-- client can never hit an ambiguous overload. Every caller passes the full set
-- (src/lib/api.ts passes all seven).
drop function if exists public.submit_membership_application(text, int, text, text);
