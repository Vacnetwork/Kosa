-- Audit trail, inbound contact messages and the rate-limit ledger.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  detail jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_len check (char_length(btrim(action)) between 3 and 120),
  constraint audit_logs_entity_len check (char_length(btrim(entity)) between 2 and 80)
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_action_idx on public.audit_logs (action);

-- Append-only: no UPDATE and no DELETE, for any role.
create trigger audit_logs_no_update
  before update on public.audit_logs
  for each row execute function private.reject_mutation();

create trigger audit_logs_no_delete
  before delete on public.audit_logs
  for each row execute function private.reject_mutation();

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_messages_name_len check (char_length(btrim(name)) between 2 and 120),
  constraint contact_messages_email_shape check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint contact_messages_subject_len check (char_length(btrim(subject)) between 3 and 160),
  constraint contact_messages_message_len check (char_length(btrim(message)) between 20 and 2000)
);

create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

create trigger contact_messages_set_updated_at
  before update on public.contact_messages
  for each row execute function private.set_updated_at();

-- Ledger read exclusively by assert_rate_limit() (SECURITY DEFINER). No policy
-- is defined for anon or authenticated, so RLS denies every direct access.
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now(),
  constraint rate_limit_events_key_len check (char_length(key) between 1 and 200)
);

create index rate_limit_events_key_time_idx on public.rate_limit_events (key, created_at desc);
