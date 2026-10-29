-- Public-facing content: events and their registrations, announcements,
-- news posts and gallery items. is_published is the only gate that makes a
-- row readable by anonymous visitors.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  category text not null default 'General',
  capacity int,
  cover_image_url text,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_shape check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  constraint events_title_len check (char_length(btrim(title)) between 4 and 140),
  constraint events_summary_len check (char_length(btrim(summary)) between 10 and 240),
  constraint events_description_len check (description is null or char_length(description) <= 4000),
  constraint events_venue_len check (venue is null or char_length(venue) <= 160),
  constraint events_category_len check (char_length(category) between 2 and 40),
  constraint events_capacity_range check (capacity is null or capacity between 0 and 100000),
  constraint events_time_order check (ends_at is null or ends_at >= starts_at)
);

create index events_starts_at_idx on public.events (starts_at);
create index events_published_idx on public.events (starts_at) where is_published;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function private.set_updated_at();

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going',
  guests int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_registrations_status_values check (status in ('going', 'waitlist', 'cancelled')),
  constraint event_registrations_guests_range check (guests between 0 and 10),
  constraint event_registrations_notes_len check (notes is null or char_length(notes) <= 500),
  constraint event_registrations_unique unique (event_id, user_id)
);

create index event_registrations_event_idx on public.event_registrations (event_id, status);
create index event_registrations_user_idx on public.event_registrations (user_id, created_at desc);

create trigger event_registrations_set_updated_at
  before update on public.event_registrations
  for each row execute function private.set_updated_at();

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'members',
  is_pinned boolean not null default false,
  published_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_len check (char_length(btrim(title)) between 4 and 140),
  constraint announcements_body_len check (char_length(btrim(body)) between 20 and 4000),
  constraint announcements_audience_values check (audience in ('members', 'admins'))
);

create index announcements_published_idx on public.announcements (is_pinned desc, published_at desc);

create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function private.set_updated_at();

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  cover_image_url text,
  author_name text not null,
  published_at timestamptz not null default now(),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_posts_slug_shape check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  constraint news_posts_title_len check (char_length(btrim(title)) between 4 and 160),
  constraint news_posts_excerpt_len check (char_length(btrim(excerpt)) between 10 and 400),
  constraint news_posts_body_len check (char_length(btrim(body)) between 20 and 20000),
  constraint news_posts_author_len check (char_length(btrim(author_name)) between 2 and 120)
);

create index news_posts_published_idx on public.news_posts (published_at desc) where is_published;

create trigger news_posts_set_updated_at
  before update on public.news_posts
  for each row execute function private.set_updated_at();

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  credit text,
  album text not null default 'General',
  cohort_year int,
  is_published boolean not null default true,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_items_title_len check (char_length(btrim(title)) between 2 and 120),
  constraint gallery_items_caption_len check (caption is null or char_length(caption) <= 300),
  constraint gallery_items_image_url_len check (char_length(image_url) between 4 and 500),
  constraint gallery_items_credit_len check (credit is null or char_length(credit) <= 200),
  constraint gallery_items_album_len check (char_length(btrim(album)) between 2 and 60),
  constraint gallery_items_cohort_year_range check (cohort_year is null or cohort_year between 1950 and 2100)
);

create index gallery_items_album_idx on public.gallery_items (album, created_at desc) where is_published;

create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function private.set_updated_at();

-- Attribute a gallery upload to the signed-in uploader when the client omits it.
create or replace function private.set_gallery_uploader()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.uploaded_by is null then
    new.uploaded_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger gallery_items_set_uploader
  before insert on public.gallery_items
  for each row execute function private.set_gallery_uploader();
