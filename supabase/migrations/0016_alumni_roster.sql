-- 0016 — the alumni register.
--
-- The association keeps a list of old students by year of entry and year of
-- completion, taken from its own records (the file the committee supplied).
-- That list is NOT the membership register and must never be published as one:
-- nobody in it has an account, has agreed to be listed in a directory, or has
-- paid a subscription. So the names and phone numbers in this table are
-- readable only by the committee, and the public site is allowed to see counts
-- and nothing else — through the two SECURITY DEFINER functions at the bottom
-- of this file, which return aggregates only.
--
-- It exists so the association can find people again: who was in a year, who
-- has a phone number on file, and how many of a cohort are still to be traced.

create table public.alumni_roster (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  -- Year of entry. Nullable: a handful of names in the committee's file carry
  -- no years at all, and dropping them would lose people from the register.
  start_year int,
  end_year int,
  phone text,
  notes text,
  source text not null default 'Association register',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alumni_roster_first_name_len check (char_length(btrim(first_name)) between 1 and 80),
  constraint alumni_roster_last_name_len check (char_length(btrim(last_name)) between 1 and 80),
  constraint alumni_roster_start_year_range check (start_year is null or start_year between 1950 and 2100),
  constraint alumni_roster_end_year_range check (end_year is null or end_year between 1950 and 2100),
  constraint alumni_roster_end_after_start check (end_year is null or end_year >= start_year),
  constraint alumni_roster_phone_len check (phone is null or char_length(btrim(phone)) <= 40),
  constraint alumni_roster_notes_len check (notes is null or char_length(btrim(notes)) <= 500)
);

-- One row per person per year of entry: the same name may legitimately appear
-- twice only if the association recorded two separate starts.
create unique index alumni_roster_identity_idx
  on public.alumni_roster (lower(btrim(first_name)), lower(btrim(last_name)), coalesce(start_year, 0));

create index alumni_roster_start_year_idx on public.alumni_roster (start_year);
create index alumni_roster_end_year_idx on public.alumni_roster (end_year);

create trigger alumni_roster_set_updated_at
  before update on public.alumni_roster
  for each row execute function private.set_updated_at();

alter table public.alumni_roster enable row level security;

-- Committee only. `private.is_admin` covers super_admin and membership_officer.
create policy alumni_roster_select_committee on public.alumni_roster
  for select to authenticated
  using (private.is_admin((select auth.uid())));

create policy alumni_roster_insert_committee on public.alumni_roster
  for insert to authenticated
  with check (private.is_admin((select auth.uid())));

create policy alumni_roster_update_committee on public.alumni_roster
  for update to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- Deleting a person from the register is a super admin action, and the audit
-- log keeps the record of it.
create policy alumni_roster_delete_super_admin on public.alumni_roster
  for delete to authenticated
  using (private.is_super_admin((select auth.uid())));

grant select, insert, update, delete on public.alumni_roster to authenticated;
grant all on public.alumni_roster to service_role;

-- ---------------------------------------------------------------- public view
-- Aggregates only: a year of completion, how many people the association has
-- for it, and how many of them carry a phone number. No names, no numbers.
create or replace function public.alumni_roster_stats()
returns table (year int, alumni bigint, with_phone bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(r.end_year, r.start_year) as year,
         count(*)::bigint as alumni,
         count(*) filter (where nullif(btrim(r.phone), '') is not null)::bigint as with_phone
  from public.alumni_roster r
  where coalesce(r.end_year, r.start_year) is not null
  group by 1
  order by 1 desc;
$$;

create or replace function public.alumni_roster_totals()
returns table (alumni bigint, years bigint, with_phone bigint, earliest int, latest int, unplaced bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::bigint,
         count(distinct coalesce(r.end_year, r.start_year))::bigint,
         count(*) filter (where nullif(btrim(r.phone), '') is not null)::bigint,
         min(coalesce(r.end_year, r.start_year)),
         max(coalesce(r.end_year, r.start_year)),
         count(*) filter (where coalesce(r.end_year, r.start_year) is null)::bigint
  from public.alumni_roster r;
$$;

revoke all on function public.alumni_roster_stats() from public;
revoke all on function public.alumni_roster_totals() from public;

grant execute on function public.alumni_roster_stats() to anon, authenticated;
grant execute on function public.alumni_roster_totals() to anon, authenticated;
