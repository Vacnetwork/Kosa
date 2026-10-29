-- ===========================================================================
-- KOSA alumni platform — DEMO SEED
--
-- EVERY ROW IN THIS FILE IS SAMPLE DATA FOR A DEMONSTRATION INSTALL.
-- No real members, no real committee, no real fees, no real contact details,
-- no real money. Addresses use the reserved .invalid TLD, names are invented,
-- and every title says "demo" wherever a visitor could mistake it for a record.
--
-- Safe to run more than once: fixed identifiers plus ON CONFLICT DO NOTHING.
-- No privileged role is seeded. After deploying, sign in and grant
-- super_admin to a real account with:
--     select public.set_user_role('<your-user-id>', 'super_admin', true);
-- (run as the database owner, then remove that ability again).
--
-- Run on a Supabase project:
--     psql "$DATABASE_URL" -f supabase/seed.sql
-- The demo auth users cannot be signed into: their passwords are random.
-- ===========================================================================

begin;

-- ---------------------------------------------------------------- cohorts
-- Five demo members across five graduation cohorts.
do $$
declare
  v_instance uuid := '00000000-0000-0000-0000-000000000000';
begin
  begin
    insert into auth.users
      (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values
      (v_instance, 'd0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
       'demo.member.2008@example.invalid', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Member 2008"}'::jsonb, now(), now()),
      (v_instance, 'd0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
       'demo.member.2012@example.invalid', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Member 2012"}'::jsonb, now(), now()),
      (v_instance, 'd0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
       'demo.member.2016@example.invalid', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Member 2016"}'::jsonb, now(), now()),
      (v_instance, 'd0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
       'demo.member.2019@example.invalid', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Member 2019"}'::jsonb, now(), now()),
      (v_instance, 'd0000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated',
       'demo.member.2004@example.invalid', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Demo Member 2004"}'::jsonb, now(), now())
    on conflict (id) do nothing;
  exception
    when others then
      -- A hosted auth schema can differ slightly; content still seeds below.
      raise warning 'demo members were not created (%): profile rows will be skipped', sqlerrm;
  end;
end
$$;

insert into public.profiles
  (id, full_name, graduation_year, profession, employer, city, country, interests, bio,
   directory_visibility, allow_contact_by_members)
select v.id, v.full_name, v.graduation_year, v.profession, v.employer, v.city, v.country,
       v.interests, v.bio, 'members', true
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'Demo Member 2008 (demo)', 2008, 'Teacher', 'Demo Secondary School', 'Gulu', 'Uganda', '{reading,netball}'::text[], 'Sample directory profile for the demonstration site.'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'Demo Member 2012 (demo)', 2012, 'Software engineer', 'Demo Tech', 'Kampala', 'Uganda', '{mentoring,football}'::text[], 'Sample directory profile for the demonstration site.'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'Demo Member 2016 (demo)', 2016, 'Nurse', 'Demo Clinic', 'Gulu', 'Uganda', '{health,volunteering}'::text[], 'Sample directory profile for the demonstration site.'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'Demo Member 2019 (demo)', 2019, 'Student', 'Demo University', 'Lira', 'Uganda', '{research}'::text[], 'Sample directory profile for the demonstration site.'),
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'Demo Member 2004 (demo)', 2004, 'Accountant', 'Demo Audit', 'Gulu', 'Uganda', '{finance}'::text[], 'Sample directory profile for the demonstration site.')
) as v(id, full_name, graduation_year, profession, employer, city, country, interests, bio)
where exists (select 1 from auth.users u where u.id = v.id)
on conflict (id) do update set
  full_name = excluded.full_name,
  graduation_year = excluded.graduation_year,
  profession = excluded.profession,
  employer = excluded.employer,
  city = excluded.city,
  country = excluded.country,
  interests = excluded.interests,
  bio = excluded.bio;

insert into public.memberships (user_id, member_no, status, cohort_year, joined_at)
select v.user_id, v.member_no, 'active', v.cohort_year, now() - interval '2 years'
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'KOSA-2008-9001', 2008),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'KOSA-2012-9002', 2012),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'KOSA-2016-9003', 2016),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'KOSA-2019-9004', 2019),
  ('d0000000-0000-4000-8000-000000000005'::uuid, 'KOSA-2004-9005', 2004)
) as v(user_id, member_no, cohort_year)
where exists (select 1 from public.profiles p where p.id = v.user_id)
on conflict (user_id) do nothing;

-- Everyone who has a membership row is an ordinary member. Nothing more.
insert into public.user_roles (user_id, role)
select m.user_id, 'member'
from public.memberships m
where m.user_id in (
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000002',
  'd0000000-0000-4000-8000-000000000003',
  'd0000000-0000-4000-8000-000000000004',
  'd0000000-0000-4000-8000-000000000005'
)
on conflict (user_id, role) do nothing;

-- ------------------------------------------------------------- events
insert into public.events
  (id, slug, title, summary, description, starts_at, ends_at, venue, category, capacity, is_published)
values
  ('e0000000-0000-4000-8000-000000000001', 'demo-annual-general-meeting',
   'Annual General Meeting (demo)',
   'Demo listing: the yearly meeting with reports from the executive and the welfare fund.',
   'This is a demonstration event. There is no real meeting at this venue or time.',
   now() + interval '45 days', now() + interval '45 days 3 hours',
   'Demo Hall, Gulu', 'Meeting', 150, true),
  ('e0000000-0000-4000-8000-000000000002', 'demo-careers-day',
   'Careers day for senior students (demo)',
   'Demo listing: alumni talk to final-year students about work, applications and trades.',
   'This is a demonstration event. There is no real careers day at this venue or time.',
   now() + interval '80 days', null,
   'Demo Secondary School, Gulu', 'Community Service', 80, true),
  ('e0000000-0000-4000-8000-000000000003', 'demo-homecoming',
   'Homecoming weekend (demo)',
   'Demo listing: a weekend of sport, food and catching up for every cohort.',
   'This is a demonstration event. There is no real homecoming at this venue or time.',
   now() - interval '400 days', now() - interval '399 days',
   'Demo Grounds, Gulu', 'Social', 400, true)
on conflict (id) do nothing;

-- ------------------------------------------------------- announcements
insert into public.announcements (id, title, body, audience, is_pinned, published_at)
values
  ('e1000000-0000-4000-8000-000000000001',
   'Membership applications are reviewed once a month (demo)',
   'Demo announcement: the membership officer reviews the queue in the first week of each month. Applications missing a graduation year are returned for more information rather than rejected.',
   'members', true, now() - interval '6 days'),
  ('e1000000-0000-4000-8000-000000000002',
   'Welfare fund: how to ask for help (demo)',
   'Demo announcement: any member can file a welfare request from their dashboard. The committee sees it, and confidential requests are visible to the executive only.',
   'members', false, now() - interval '12 days')
on conflict (id) do nothing;

-- -------------------------------------------------------------- news
insert into public.news_posts (id, slug, title, excerpt, body, cover_image_url, author_name, published_at, is_published)
values
  ('e2000000-0000-4000-8000-000000000001', 'demo-bursary-report',
   'What the bursary fund covered this term (demo)',
   'A demo report on the sample bursary round: what it paid for, what it did not, and what the committee needs next term.',
   'This is demonstration copy. It describes no real students, no real school and no real money. It exists so the news layout can be reviewed with realistic paragraph lengths.

The committee lists each award, the term it covers and the receipts it expects. Nothing here is a record of an actual payment.',
   '/photos/gulu-town-skyline-01.webp', 'Demo Desk', now() - interval '9 days', true),
  ('e2000000-0000-4000-8000-000000000002', 'demo-mentorship-round',
   'Mentorship round opens for the long holiday (demo)',
   'A demo story about members offering a few hours a month to students choosing subjects and trades.',
   'This is demonstration copy. No real mentorship programme is described.

Members publish an offer from their dashboard; students and younger alumni send a short message through the site.',
   '/photos/gulu-city.webp', 'Demo Desk', now() - interval '21 days', true),
-- Real story, supplied by the association: the Diamond Jubilee Hall dinner.
('e2000000-0000-4000-8000-000000000003', 'diamond-jubilee-hall-fundraising-dinner',
'Diamond Jubilee Hall project unveiled at a Bugolobi fundraising dinner',
'Old students, board members and friends of Kakoma Secondary School came together at Royal Suites, Bugolobi on 15 August 2026 in support of the Diamond Jubilee Hall Project — a new hall for the school, timed to mark its 60th anniversary on 14 November 2026.',
'On 15 August 2026, old students, board members and friends of Kakoma Secondary School came together at Royal Suites, Bugolobi for an evening fundraising dinner in support of the Diamond Jubilee Hall Project — a new hall for the school, timed to mark our 60th anniversary on 14 November 2026.

Board Chairman Dr. Isaac Nsereko welcomed guests and thanked old students for continuing to "labour for success" long after leaving Kakoma''s gates. Head Teacher Bbale David spoke about the Board''s vision for the Jubilee Hall and thanked old students for their generosity.

The evening''s highlight was the unveiling of the Diamond Jubilee Hall Project board: a visual journey "from where we are" — the school''s current, aging facilities — "to where we want to be" — a modern hall pictured in architectural renders.

Old students, including a guest from the Class of 1968, shared memories from their own years at Kakoma before pledging their support.',
'/photos/alumni.webp', 'KOSA Secretariat', '2026-08-15T21:00:00+03:00', true)
on conflict (id) do nothing;

-- ----------------------------------------------------------- gallery
-- Photographs are the same credited Wikimedia Commons pictures used by the
-- static site (CC BY-SA 4.0). The credit column is required to stay honest.
insert into public.gallery_items (id, title, caption, image_url, credit, album, cohort_year, is_published)
values
  ('e3000000-0000-4000-8000-000000000001', 'Gulu town skyline (demo album)',
   'Demo gallery row: rooftops of Gulu town under a wide sky.',
   '/photos/gulu-town-skyline-01.webp',
   'Gulu Town Skyline 01 by Alemeneghini, CC BY-SA 4.0, via Wikimedia Commons',
   'Gulu', null, true),
  ('e3000000-0000-4000-8000-000000000002', 'The elephant statue (demo album)',
   'Demo gallery row: the elephant statue marking the entrance to Gulu city.',
   '/photos/gulu-city.webp',
   'Gulu city by Micheal Kaluba, CC BY-SA 4.0, via Wikimedia Commons',
   'Gulu', null, true),
  ('e3000000-0000-4000-8000-000000000003', 'Market entrance (demo album)',
   'Demo gallery row: women sitting with produce beneath the elephant statue.',
   '/photos/women-sitted-under-an-elephant-statue-in.webp',
   'Women Sitted under an Elephant Statue in a Market Entrance, Gulu by Chapelle musa, CC BY-SA 4.0, via Wikimedia Commons',
   'Gulu', null, true),
  ('e3000000-0000-4000-8000-000000000004', 'Acholi dancers (demo album)',
   'Demo gallery row: a line of Acholi women dancing in matching wraps.',
   '/photos/female-acholi-dancers.webp',
   'Female Acholi Dancers by Bettycath, CC BY-SA 4.0, via Wikimedia Commons',
   'Culture', null, true)
on conflict (id) do nothing;

-- ------------------------------------------------------- welfare (demo)
insert into public.welfare_requests
  (id, user_id, category, summary, details, amount_requested, currency, status, is_confidential)
select 'e4000000-0000-4000-8000-000000000001'::uuid,
       'd0000000-0000-4000-8000-000000000003'::uuid,
       'education',
       'Demo: school fees support for one term',
       'Demonstration request. It describes no real family, no real school and no real amount owed. It exists so the welfare queue has a row to display.',
       400000, 'UGX', 'submitted', false
where exists (select 1 from public.profiles p where p.id = 'd0000000-0000-4000-8000-000000000003')
  and not exists (select 1 from public.welfare_requests w where w.id = 'e4000000-0000-4000-8000-000000000001');

-- --------------------------------------------------- contributions (demo)
-- Demo money only: these are not fees, not receipts and not real amounts.
insert into public.contributions
  (id, member_id, campaign, amount, currency, method, reference, received_at, note)
select v.id, v.member_id, v.campaign, v.amount, 'UGX', v.method, v.reference, v.received_at, v.note
from (values
  ('e5000000-0000-4000-8000-000000000001'::uuid, 'd0000000-0000-4000-8000-000000000001'::uuid, 'Demo bursary fund', 200000::numeric, 'Mobile money', 'DEMO-0001', current_date - 30, 'Demo row, not a real contribution.'),
  ('e5000000-0000-4000-8000-000000000002'::uuid, 'd0000000-0000-4000-8000-000000000002'::uuid, 'Demo welfare fund', 150000::numeric, 'Bank transfer', 'DEMO-0002', current_date - 18, 'Demo row, not a real contribution.'),
  ('e5000000-0000-4000-8000-000000000003'::uuid, null::uuid, 'Demo building fund', 500000::numeric, 'Cash', 'DEMO-0003', current_date - 4, 'Demo row from an unnamed well-wisher.')
) as v(id, member_id, campaign, amount, method, reference, received_at, note)
where (v.member_id is null or exists (select 1 from public.profiles p where p.id = v.member_id))
  and not exists (select 1 from public.contributions c where c.id = v.id);

commit;
