-- KOSA alumni platform — foundation objects.
-- Target: PostgreSQL 15+ with pgcrypto. No Supabase-only extensions are used,
-- so the whole migration set also applies to a plain PostgreSQL instance.

create extension if not exists pgcrypto;

-- Internal helpers live outside `public` so PostgREST never exposes them as RPCs.
create schema if not exists private;

-- Single source of truth for updated_at on every table that has the column.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- audit_logs is append-only for every role, including the table owner.
create or replace function private.reject_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only: % is not permitted', tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

-- Human-readable membership numbers: KOSA-<cohort>-<seq>.
create sequence if not exists public.membership_member_no_seq;
