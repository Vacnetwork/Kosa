-- Access helpers used by RLS policies and RPCs.
-- Every one is SECURITY DEFINER with an empty search_path, so it reads the
-- role/membership tables as the owner and cannot recurse into their policies.
-- Clients can execute them only if they are granted below; they live in the
-- `private` schema so PostgREST never publishes them as endpoints.

create or replace function private.is_active_member(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = p_user_id and m.status = 'active'
  );
$$;

create or replace function private.has_role(p_user_id uuid, p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = p_user_id and r.role = p_role
  );
$$;

create or replace function private.has_any_role(p_user_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = p_user_id and r.role = any (p_roles)
  );
$$;

-- Committee: applications, memberships, announcements, content.
create or replace function private.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(p_user_id, array['super_admin', 'membership_officer']);
$$;

create or replace function private.is_super_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(p_user_id, 'super_admin');
$$;

create or replace function private.is_event_manager(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(p_user_id, array['super_admin', 'event_manager']);
$$;

-- Finance: contributions and the welfare fund.
create or replace function private.is_treasurer(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(p_user_id, array['super_admin', 'treasurer']);
$$;

-- Executive committee: reads the audit trail and the welfare queue.
create or replace function private.is_executive(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_any_role(p_user_id, array['super_admin', 'membership_officer', 'treasurer']);
$$;

-- The single write path into audit_logs. Callers are SECURITY DEFINER RPCs.
create or replace function private.write_audit(
  p_actor_id uuid,
  p_action text,
  p_entity text,
  p_entity_id text,
  p_detail jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id, detail)
  values (
    p_actor_id,
    (select u.email from auth.users u where u.id = p_actor_id),
    p_action,
    p_entity,
    p_entity_id,
    p_detail
  );
$$;

revoke all on function private.is_active_member(uuid) from public;
revoke all on function private.has_role(uuid, text) from public;
revoke all on function private.has_any_role(uuid, text[]) from public;
revoke all on function private.is_admin(uuid) from public;
revoke all on function private.is_super_admin(uuid) from public;
revoke all on function private.is_event_manager(uuid) from public;
revoke all on function private.is_treasurer(uuid) from public;
revoke all on function private.is_executive(uuid) from public;
revoke all on function private.write_audit(uuid, text, text, text, jsonb) from public;

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_active_member(uuid) to authenticated, service_role;
grant execute on function private.has_role(uuid, text) to authenticated, service_role;
grant execute on function private.has_any_role(uuid, text[]) to authenticated, service_role;
grant execute on function private.is_admin(uuid) to authenticated, service_role;
grant execute on function private.is_super_admin(uuid) to authenticated, service_role;
grant execute on function private.is_event_manager(uuid) to authenticated, service_role;
grant execute on function private.is_treasurer(uuid) to authenticated, service_role;
grant execute on function private.is_executive(uuid) to authenticated, service_role;
