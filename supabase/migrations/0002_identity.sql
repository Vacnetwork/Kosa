-- Identity: the person (profiles), their private contact details, their
-- membership application, their membership record and their roles.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  preferred_name text,
  graduation_year int,
  profession text,
  employer text,
  city text,
  country text,
  interests text[] not null default '{}',
  bio text,
  avatar_url text,
  linkedin_url text,
  directory_visibility text not null default 'members',
  allow_contact_by_members boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(btrim(full_name)) between 2 and 120),
  constraint profiles_preferred_name_len check (preferred_name is null or char_length(preferred_name) <= 60),
  constraint profiles_graduation_year_range check (graduation_year is null or graduation_year between 1950 and 2100),
  constraint profiles_profession_len check (profession is null or char_length(profession) <= 120),
  constraint profiles_employer_len check (employer is null or char_length(employer) <= 120),
  constraint profiles_city_len check (city is null or char_length(city) <= 80),
  constraint profiles_country_len check (country is null or char_length(country) <= 80),
  constraint profiles_interests_len check (cardinality(interests) <= 12),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 1200),
  constraint profiles_avatar_url_len check (avatar_url is null or char_length(avatar_url) <= 500),
  constraint profiles_linkedin_url_len check (linkedin_url is null or char_length(linkedin_url) <= 300),
  constraint profiles_visibility_values check (directory_visibility in ('members', 'hidden'))
);

create index profiles_graduation_year_idx on public.profiles (graduation_year);
create index profiles_directory_idx on public.profiles (directory_visibility) where directory_visibility = 'members';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Private contact details. Never exposed by a table policy to other members;
-- get_alumni_profile() is the only member-to-member channel and it obeys
-- profiles.allow_contact_by_members.
create table public.profile_contacts (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_contacts_email_shape check (
    email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint profile_contacts_phone_len check (phone is null or char_length(phone) between 3 and 40)
);

create trigger profile_contacts_set_updated_at
  before update on public.profile_contacts
  for each row execute function private.set_updated_at();

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  graduation_year int,
  cohort_note text,
  motivation text not null,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_applications_full_name_len check (char_length(btrim(full_name)) between 2 and 120),
  constraint membership_applications_graduation_year_range check (graduation_year is null or graduation_year between 1950 and 2100),
  constraint membership_applications_cohort_note_len check (cohort_note is null or char_length(cohort_note) <= 160),
  constraint membership_applications_motivation_len check (char_length(btrim(motivation)) between 40 and 2000),
  constraint membership_applications_status_values check (status in ('pending', 'needs_info', 'approved', 'rejected')),
  constraint membership_applications_review_note_len check (review_note is null or char_length(review_note) <= 2000),
  constraint membership_applications_reviewed_pair check (
    (status = 'pending') or (reviewed_at is not null) or (status = 'needs_info')
  )
);

-- One open application per person: a second one is rejected by the database.
create unique index membership_applications_one_open_idx
  on public.membership_applications (user_id)
  where status in ('pending', 'needs_info');

create index membership_applications_status_idx on public.membership_applications (status, submitted_at);
create index membership_applications_user_idx on public.membership_applications (user_id, submitted_at desc);

create trigger membership_applications_set_updated_at
  before update on public.membership_applications
  for each row execute function private.set_updated_at();

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  member_no text unique,
  status text not null default 'pending',
  cohort_year int,
  joined_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_member_no_shape check (member_no is null or member_no ~ '^KOSA-[0-9]{4}-[0-9]{4,6}$'),
  constraint memberships_status_values check (status in ('pending', 'active', 'lapsed', 'suspended')),
  constraint memberships_cohort_year_range check (cohort_year is null or cohort_year between 1950 and 2100),
  constraint memberships_notes_len check (notes is null or char_length(notes) <= 2000),
  constraint memberships_active_has_join_date check (status <> 'active' or joined_at is not null)
);

create index memberships_status_idx on public.memberships (status);
create index memberships_cohort_year_idx on public.memberships (cohort_year) where status = 'active';

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function private.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint user_roles_role_values check (
    role in ('super_admin', 'membership_officer', 'event_manager', 'treasurer', 'member')
  ),
  constraint user_roles_unique unique (user_id, role)
);

create index user_roles_user_idx on public.user_roles (user_id);
create index user_roles_staff_idx on public.user_roles (role) where role <> 'member';
