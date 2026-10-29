-- Row Level Security: the single authorisation gate.
--
-- Supabase grants table privileges to anon/authenticated broadly and relies on
-- RLS for authorisation, so every table below has RLS enabled and every policy
-- is written for a specific role. A table with no policy for a role is denied
-- by default (SELECT returns no rows, writes raise). No policy is `true`:
-- anonymous reads are limited to rows whose is_published flag is set.

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.membership_applications enable row level security;
alter table public.memberships enable row level security;
alter table public.user_roles enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.announcements enable row level security;
alter table public.news_posts enable row level security;
alter table public.gallery_items enable row level security;
alter table public.welfare_requests enable row level security;
alter table public.contributions enable row level security;
alter table public.mentorship_offers enable row level security;
alter table public.mentorship_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limit_events enable row level security;

-- ------------------------------------------------------------------ grants
grant usage on schema public to anon, authenticated, service_role;

-- Anonymous visitors may read the published content tables only. RLS still
-- filters each row on is_published.
grant select on public.events, public.news_posts, public.gallery_items to anon;

-- Signed-in users get the full privilege set; RLS decides what each statement
-- is actually allowed to touch.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- --------------------------------------------------------------- profiles
create policy profiles_select_self_or_directory on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin((select auth.uid()))
    or (
      private.is_active_member((select auth.uid()))
      and directory_visibility = 'members'
      and private.is_active_member(id)
    )
  );

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -------------------------------------------------------- profile_contacts
create policy profile_contacts_select_self on public.profile_contacts
  for select to authenticated
  using (profile_id = (select auth.uid()) or private.is_super_admin((select auth.uid())));

create policy profile_contacts_insert_self on public.profile_contacts
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy profile_contacts_update_self on public.profile_contacts
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- ------------------------------------------------ membership_applications
create policy membership_applications_select_own_or_committee on public.membership_applications
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));

-- Applications are created only by submit_membership_application() (rate
-- limited, audited). The committee may record a decision directly.
create policy membership_applications_update_committee on public.membership_applications
  for update to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- ------------------------------------------------------------- memberships
create policy memberships_select_own_or_committee on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));

create policy memberships_update_committee on public.memberships
  for update to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- --------------------------------------------------------------- user_roles
create policy user_roles_select_own_or_committee on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin((select auth.uid())));

-- Only a super admin writes roles, and never to their own account: that is the
-- database-level answer to privilege escalation.
create policy user_roles_insert_super_admin on public.user_roles
  for insert to authenticated
  with check (
    private.is_super_admin((select auth.uid()))
    and user_id <> (select auth.uid())
  );

create policy user_roles_update_super_admin on public.user_roles
  for update to authenticated
  using (
    private.is_super_admin((select auth.uid()))
    and user_id <> (select auth.uid())
  )
  with check (
    private.is_super_admin((select auth.uid()))
    and user_id <> (select auth.uid())
  );

create policy user_roles_delete_super_admin on public.user_roles
  for delete to authenticated
  using (
    private.is_super_admin((select auth.uid()))
    and user_id <> (select auth.uid())
  );

-- ------------------------------------------------------------------ events
create policy events_select_published on public.events
  for select to anon, authenticated
  using (is_published);

create policy events_select_managers on public.events
  for select to authenticated
  using (
    private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  );

create policy events_insert_managers on public.events
  for insert to authenticated
  with check (
    private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  );

create policy events_update_managers on public.events
  for update to authenticated
  using (
    private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  )
  with check (
    private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  );

create policy events_delete_managers on public.events
  for delete to authenticated
  using (
    private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  );

-- ------------------------------------------------------ event_registrations
create policy event_registrations_select_own_or_staff on public.event_registrations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  );

-- Registration (including the capacity/waitlist decision) goes through
-- register_for_event(). A member may only cancel their own place.
create policy event_registrations_update_self_cancel on public.event_registrations
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  )
  with check (
    (user_id = (select auth.uid()) and status = 'cancelled')
    or private.is_event_manager((select auth.uid()))
    or private.is_admin((select auth.uid()))
  );

-- ----------------------------------------------------------- announcements
create policy announcements_select_members on public.announcements
  for select to authenticated
  using (audience = 'members' and private.is_active_member((select auth.uid())));

create policy announcements_select_admins on public.announcements
  for select to authenticated
  using (audience = 'admins' and private.is_admin((select auth.uid())));

create policy announcements_write_committee on public.announcements
  for all to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- --------------------------------------------------------------- news_posts
create policy news_posts_select_published on public.news_posts
  for select to anon, authenticated
  using (is_published);

create policy news_posts_select_committee on public.news_posts
  for select to authenticated
  using (private.is_admin((select auth.uid())));

create policy news_posts_write_committee on public.news_posts
  for all to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- ------------------------------------------------------------ gallery_items
create policy gallery_items_select_published on public.gallery_items
  for select to anon, authenticated
  using (is_published);

create policy gallery_items_select_staff on public.gallery_items
  for select to authenticated
  using (
    private.is_admin((select auth.uid()))
    or private.is_event_manager((select auth.uid()))
  );

create policy gallery_items_insert_staff on public.gallery_items
  for insert to authenticated
  with check (
    private.is_admin((select auth.uid()))
    or private.is_event_manager((select auth.uid()))
  );

create policy gallery_items_update_staff on public.gallery_items
  for update to authenticated
  using (
    private.is_admin((select auth.uid()))
    or private.is_event_manager((select auth.uid()))
  )
  with check (
    private.is_admin((select auth.uid()))
    or private.is_event_manager((select auth.uid()))
  );

create policy gallery_items_delete_staff on public.gallery_items
  for delete to authenticated
  using (
    private.is_admin((select auth.uid()))
    or private.is_event_manager((select auth.uid()))
  );

-- -------------------------------------------------------- welfare_requests
-- Decision: ordinary members never read another member's welfare request, not
-- even a non-confidential one. The queue is an executive-committee document.
create policy welfare_requests_select_own_or_executive on public.welfare_requests
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_executive((select auth.uid()))
  );

create policy welfare_requests_insert_self on public.welfare_requests
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'submitted'
    and handled_by is null
  );

create policy welfare_requests_update_own_or_executive on public.welfare_requests
  for update to authenticated
  using (
    (user_id = (select auth.uid()) and status = 'submitted')
    or private.is_executive((select auth.uid()))
  )
  with check (
    (user_id = (select auth.uid()) and status = 'submitted' and handled_by is null)
    or private.is_executive((select auth.uid()))
  );

-- ------------------------------------------------------------ contributions
-- Financial records are read and corrected by the treasurer and super admin
-- only; new rows arrive through record_contribution().
create policy contributions_select_treasurer on public.contributions
  for select to authenticated
  using (private.is_treasurer((select auth.uid())));

create policy contributions_update_treasurer on public.contributions
  for update to authenticated
  using (private.is_treasurer((select auth.uid())))
  with check (private.is_treasurer((select auth.uid())));

create policy contributions_delete_treasurer on public.contributions
  for delete to authenticated
  using (private.is_treasurer((select auth.uid())));

-- ------------------------------------------------------- mentorship_offers
create policy mentorship_offers_select_members on public.mentorship_offers
  for select to authenticated
  using (
    (
      private.is_active_member((select auth.uid()))
      and (is_accepting or user_id = (select auth.uid()))
    )
    or private.is_admin((select auth.uid()))
  );

create policy mentorship_offers_insert_self on public.mentorship_offers
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy mentorship_offers_update_self on public.mentorship_offers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy mentorship_offers_delete_self on public.mentorship_offers
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ----------------------------------------------------- mentorship_requests
create policy mentorship_requests_select_parties on public.mentorship_requests
  for select to authenticated
  using (
    mentor_id = (select auth.uid())
    or mentee_id = (select auth.uid())
    or private.is_admin((select auth.uid()))
  );

-- -------------------------------------------------------------- audit_logs
create policy audit_logs_select_executives on public.audit_logs
  for select to authenticated
  using (private.is_executive((select auth.uid())));

-- No INSERT/UPDATE/DELETE policy exists: the table is written only by
-- SECURITY DEFINER functions and can never be edited or removed by a client.

-- --------------------------------------------------------- contact_messages
create policy contact_messages_select_committee on public.contact_messages
  for select to authenticated
  using (private.is_admin((select auth.uid())));

create policy contact_messages_update_committee on public.contact_messages
  for update to authenticated
  using (private.is_admin((select auth.uid())))
  with check (private.is_admin((select auth.uid())));

-- ------------------------------------------------------- rate_limit_events
-- Deliberately no policies: RLS denies every direct read and write. Only
-- assert_rate_limit() (SECURITY DEFINER) touches this table.

-- ---------------------------------------------------------------------------
-- Supabase Storage (run in the hosted project's SQL editor; intentionally a
-- comment so plain PostgreSQL never sees storage.objects):
--
--   insert into storage.buckets (id, name, public)
--     values ('gallery', 'gallery', true)
--     on conflict (id) do nothing;
--
--   create policy "gallery public read" on storage.objects
--     for select to anon, authenticated
--     using (bucket_id = 'gallery');
--
--   create policy "gallery staff insert" on storage.objects
--     for insert to authenticated
--     with check (
--       bucket_id = 'gallery'
--       and (private.is_admin(auth.uid()) or private.is_event_manager(auth.uid()))
--     );
--
--   create policy "gallery staff update" on storage.objects
--     for update to authenticated
--     using (
--       bucket_id = 'gallery'
--       and (private.is_admin(auth.uid()) or private.is_event_manager(auth.uid()))
--     );
--
--   create policy "gallery staff delete" on storage.objects
--     for delete to authenticated
--     using (
--       bucket_id = 'gallery'
--       and (private.is_admin(auth.uid()) or private.is_event_manager(auth.uid()))
--     );
--
-- Uploads are limited to 5 MB and to image/jpeg, image/png and image/webp by
-- the bucket's file_size_limit / allowed_mime_types settings in the dashboard.
-- ---------------------------------------------------------------------------
