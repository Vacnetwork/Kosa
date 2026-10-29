-- Directory and public statistics.
--
-- search_alumni() returns the AlumniCard contract only: never email or phone.
-- get_alumni_profile() is the single place where contact details can surface,
-- and only when the target opted in (allow_contact_by_members) to an active
-- member.

create or replace function public.search_alumni(
  p_query text,
  p_year int,
  p_profession text,
  p_location text,
  p_limit int,
  p_offset int
)
returns table (
  id uuid,
  full_name text,
  graduation_year int,
  profession text,
  employer text,
  city text,
  country text,
  interests text[],
  avatar_url text,
  total_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_limit int := least(greatest(coalesce(p_limit, 24), 1), 100);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
  v_query text := nullif(btrim(coalesce(p_query, '')), '');
  v_profession text := nullif(btrim(coalesce(p_profession, '')), '');
  v_location text := nullif(btrim(coalesce(p_location, '')), '');
begin
  if v_uid is null then
    raise exception 'Sign in to browse the alumni directory' using errcode = '42501';
  end if;
  if not private.is_active_member(v_uid) then
    raise exception 'Only active members can browse the alumni directory' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.graduation_year,
    p.profession,
    p.employer,
    p.city,
    p.country,
    p.interests,
    p.avatar_url,
    count(*) over () as total_count
  from public.profiles p
  join public.memberships m
    on m.user_id = p.id and m.status = 'active'
  where p.directory_visibility = 'members'
    and (p_year is null or p.graduation_year = p_year)
    and (
      v_query is null
      or p.full_name ilike '%' || v_query || '%'
      or coalesce(p.profession, '') ilike '%' || v_query || '%'
      or coalesce(p.city, '') ilike '%' || v_query || '%'
      or exists (
        select 1 from unnest(p.interests) as i(interest)
        where i.interest ilike '%' || v_query || '%'
      )
    )
    and (v_profession is null or coalesce(p.profession, '') ilike '%' || v_profession || '%')
    and (
      v_location is null
      or coalesce(p.city, '') ilike '%' || v_location || '%'
      or coalesce(p.country, '') ilike '%' || v_location || '%'
    )
  order by p.full_name
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function public.get_alumni_profile(p_id uuid)
returns table (
  id uuid,
  full_name text,
  graduation_year int,
  profession text,
  employer text,
  city text,
  country text,
  interests text[],
  avatar_url text,
  bio text,
  email text,
  phone text,
  can_contact boolean
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sign in to view an alumni profile' using errcode = '42501';
  end if;
  if not private.is_active_member(v_uid) then
    raise exception 'Only active members can view alumni profiles' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.graduation_year,
    p.profession,
    p.employer,
    p.city,
    p.country,
    p.interests,
    p.avatar_url,
    p.bio,
    case when p.allow_contact_by_members then c.email else null end,
    case when p.allow_contact_by_members then c.phone else null end,
    p.allow_contact_by_members
  from public.profiles p
  join public.memberships m
    on m.user_id = p.id and m.status = 'active'
  left join public.profile_contacts c
    on c.profile_id = p.id
  where p.id = p_id
    and (p.directory_visibility = 'members' or p.id = v_uid)
  limit 1;
end;
$$;

-- Aggregate only: a year and a head count, no personal data. Safe for the
-- public "our cohorts" strip on the website.
create or replace function public.cohort_stats()
returns table (year int, members bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select m.cohort_year as year, count(*)::bigint as members
  from public.memberships m
  where m.status = 'active' and m.cohort_year is not null
  group by m.cohort_year
  order by m.cohort_year desc;
$$;

-- Aggregate only. projects = published events categorised as Project or
-- Community Service; bursaries_awarded = education welfare requests that the
-- committee approved or disbursed.
create or replace function public.get_impact_stats()
returns table (
  active_members bigint,
  cohorts bigint,
  projects bigint,
  bursaries_awarded bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.memberships m where m.status = 'active')::bigint as active_members,
    (
      select count(distinct m.cohort_year)
      from public.memberships m
      where m.status = 'active' and m.cohort_year is not null
    )::bigint as cohorts,
    (
      select count(*)
      from public.events e
      where e.is_published and e.category in ('Project', 'Community Service')
    )::bigint as projects,
    (
      select count(*)
      from public.welfare_requests w
      where w.category = 'education' and w.status in ('approved', 'disbursed')
    )::bigint as bursaries_awarded;
$$;

revoke all on function public.search_alumni(text, int, text, text, int, int) from public, anon;
revoke all on function public.get_alumni_profile(uuid) from public, anon;
revoke all on function public.cohort_stats() from public;
revoke all on function public.get_impact_stats() from public;

grant execute on function public.search_alumni(text, int, text, text, int, int) to authenticated;
grant execute on function public.get_alumni_profile(uuid) to authenticated;
grant execute on function public.cohort_stats() to anon, authenticated;
grant execute on function public.get_impact_stats() to anon, authenticated;
