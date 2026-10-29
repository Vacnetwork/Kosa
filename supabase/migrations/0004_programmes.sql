-- Programmes: welfare requests, contributions, and mentorship.

create table public.welfare_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null,
  summary text not null,
  details text not null,
  amount_requested numeric(12, 2),
  currency text not null default 'UGX',
  status text not null default 'submitted',
  is_confidential boolean not null default false,
  handled_by uuid references public.profiles (id) on delete set null,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint welfare_requests_category_values check (
    category in ('bereavement', 'medical', 'education', 'hardship', 'other')
  ),
  constraint welfare_requests_summary_len check (char_length(btrim(summary)) between 10 and 160),
  constraint welfare_requests_details_len check (char_length(btrim(details)) between 20 and 4000),
  constraint welfare_requests_amount_range check (
    amount_requested is null or (amount_requested >= 0 and amount_requested <= 100000000)
  ),
  constraint welfare_requests_currency_shape check (currency ~ '^[A-Z]{3}$'),
  constraint welfare_requests_status_values check (
    status in ('submitted', 'reviewing', 'approved', 'disbursed', 'declined')
  ),
  constraint welfare_requests_decision_note_len check (decision_note is null or char_length(decision_note) <= 2000)
);

create index welfare_requests_user_idx on public.welfare_requests (user_id, created_at desc);
create index welfare_requests_status_idx on public.welfare_requests (status, created_at);

create trigger welfare_requests_set_updated_at
  before update on public.welfare_requests
  for each row execute function private.set_updated_at();

-- The dashboard form does not send user_id; attribute the request to the
-- signed-in member. The RLS WITH CHECK still requires user_id = auth.uid().
create or replace function private.set_welfare_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

create trigger welfare_requests_set_owner
  before insert on public.welfare_requests
  for each row execute function private.set_welfare_owner();

create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles (id) on delete set null,
  campaign text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'UGX',
  method text,
  reference text,
  received_at date not null default current_date,
  recorded_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contributions_campaign_len check (char_length(btrim(campaign)) between 2 and 120),
  constraint contributions_amount_positive check (amount > 0 and amount <= 100000000),
  constraint contributions_currency_shape check (currency ~ '^[A-Z]{3}$'),
  constraint contributions_method_len check (method is null or char_length(method) <= 60),
  constraint contributions_reference_len check (reference is null or char_length(reference) <= 80),
  constraint contributions_note_len check (note is null or char_length(note) <= 300)
);

create index contributions_received_at_idx on public.contributions (received_at desc);
create index contributions_member_idx on public.contributions (member_id);
create index contributions_campaign_idx on public.contributions (campaign);

create trigger contributions_set_updated_at
  before update on public.contributions
  for each row execute function private.set_updated_at();

create table public.mentorship_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  expertise text not null,
  availability text,
  is_accepting boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentorship_offers_expertise_len check (char_length(btrim(expertise)) between 3 and 120),
  constraint mentorship_offers_availability_len check (availability is null or char_length(availability) <= 120)
);

create index mentorship_offers_accepting_idx on public.mentorship_offers (created_at desc) where is_accepting;

create trigger mentorship_offers_set_updated_at
  before update on public.mentorship_offers
  for each row execute function private.set_updated_at();

create table public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentorship_requests_message_len check (char_length(btrim(message)) between 20 and 2000),
  constraint mentorship_requests_status_values check (status in ('pending', 'accepted', 'declined', 'closed')),
  constraint mentorship_requests_not_self check (mentor_id <> mentee_id)
);

-- One open request per mentor/mentee pair.
create unique index mentorship_requests_one_open_idx
  on public.mentorship_requests (mentor_id, mentee_id)
  where status = 'pending';

create index mentorship_requests_mentor_idx on public.mentorship_requests (mentor_id, created_at desc);
create index mentorship_requests_mentee_idx on public.mentorship_requests (mentee_id, created_at desc);

create trigger mentorship_requests_set_updated_at
  before update on public.mentorship_requests
  for each row execute function private.set_updated_at();
