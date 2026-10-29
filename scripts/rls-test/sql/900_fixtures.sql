-- Harness fixtures: fake people and rows used only by the RLS assertions.
-- Never shipped, never seeded. All addresses use the reserved .invalid TLD.

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'alice@fixture.invalid', now(), '{"full_name":"Alice Auma"}'),
  ('22222222-2222-4222-8222-222222222222', 'brian@fixture.invalid', now(), '{"full_name":"Brian Okello"}'),
  ('33333333-3333-4333-8333-333333333333', 'christine@fixture.invalid', null, '{"full_name":"Christine Lamwaka"}'),
  ('44444444-4444-4444-8444-444444444444', 'denis@fixture.invalid', now(), '{"full_name":"Denis Ojok"}'),
  ('55555555-5555-4555-8555-555555555555', 'esther@fixture.invalid', now(), '{"full_name":"Esther Akello"}'),
  ('66666666-6666-4666-8666-666666666666', 'francis@fixture.invalid', now(), '{"full_name":"Francis Ochieng"}'),
  ('77777777-7777-4777-8777-777777777777', 'grace@fixture.invalid', now(), '{"full_name":"Grace Atim"}'),
  ('88888888-8888-4888-8888-888888888888', 'henry@fixture.invalid', now(), '{"full_name":"Henry Odong"}'),
  ('99999999-9999-4999-8999-999999999999', 'irene@fixture.invalid', now(), '{"full_name":"Irene Adong"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'jacob@fixture.invalid', now(), '{"full_name":"Jacob Otim"}'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'lydia@fixture.invalid', now(), '{"full_name":"Lydia Aciro"}'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'moses@fixture.invalid', now(), '{"full_name":"Moses Opio"}');

-- K has no profile row at all: a fresh sign-up.
insert into auth.users (id, email, email_confirmed_at) values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'kevin@fixture.invalid', null);

insert into public.profiles
  (id, full_name, graduation_year, profession, employer, city, country, interests, bio, directory_visibility, allow_contact_by_members)
values
  ('11111111-1111-4111-8111-111111111111', 'Alice Auma', 2008, 'Teacher', 'Demo Secondary School', 'Gulu', 'Uganda', '{reading,netball}', 'Fixture member.', 'members', true),
  ('22222222-2222-4222-8222-222222222222', 'Brian Okello', 2012, 'Software engineer', 'Demo Tech', 'Kampala', 'Uganda', '{mentoring,football}', 'Fixture member.', 'members', true),
  ('33333333-3333-4333-8333-333333333333', 'Christine Lamwaka', 2015, 'Nurse', 'Demo Clinic', 'Gulu', 'Uganda', '{health}', null, 'members', true),
  ('44444444-4444-4444-8444-444444444444', 'Denis Ojok', 2004, 'Accountant', 'Demo Audit', 'Gulu', 'Uganda', '{finance}', null, 'members', true),
  ('55555555-5555-4555-8555-555555555555', 'Esther Akello', 2006, 'Banker', 'Demo Bank', 'Lira', 'Uganda', '{finance}', null, 'members', true),
  ('66666666-6666-4666-8666-666666666666', 'Francis Ochieng', 2001, 'Head teacher', 'Demo College', 'Gulu', 'Uganda', '{education}', null, 'members', true),
  ('77777777-7777-4777-8777-777777777777', 'Grace Atim', 2010, 'Agronomist', 'Demo Farms', 'Kitgum', 'Uganda', '{agriculture}', null, 'members', false),
  ('88888888-8888-4888-8888-888888888888', 'Henry Odong', 2013, 'Engineer', 'Demo Works', 'Gulu', 'Uganda', '{construction}', null, 'hidden', true),
  ('99999999-9999-4999-8999-999999999999', 'Irene Adong', 2009, 'Midwife', 'Demo Hospital', 'Gulu', 'Uganda', '{health}', null, 'members', true),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Jacob Otim', 2011, 'Journalist', 'Demo Radio', 'Gulu', 'Uganda', '{media}', null, 'members', true),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Lydia Aciro', 2016, 'Student', 'Demo University', 'Gulu', 'Uganda', '{research}', null, 'members', true),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Moses Opio', 2007, 'Clerk', 'Demo Council', 'Gulu', 'Uganda', '{administration}', null, 'members', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  graduation_year = excluded.graduation_year,
  profession = excluded.profession,
  employer = excluded.employer,
  city = excluded.city,
  country = excluded.country,
  interests = excluded.interests,
  bio = excluded.bio,
  directory_visibility = excluded.directory_visibility,
  allow_contact_by_members = excluded.allow_contact_by_members;

insert into public.profile_contacts (profile_id, email, phone) values
  ('11111111-1111-4111-8111-111111111111', 'alice@fixture.invalid', 'DEMO-PHONE-0001'),
  ('22222222-2222-4222-8222-222222222222', 'brian@fixture.invalid', 'DEMO-PHONE-0002'),
  ('33333333-3333-4333-8333-333333333333', 'christine@fixture.invalid', 'DEMO-PHONE-0003'),
  ('44444444-4444-4444-8444-444444444444', 'denis@fixture.invalid', 'DEMO-PHONE-0004'),
  ('55555555-5555-4555-8555-555555555555', 'esther@fixture.invalid', 'DEMO-PHONE-0005'),
  ('66666666-6666-4666-8666-666666666666', 'francis@fixture.invalid', 'DEMO-PHONE-0006'),
  ('77777777-7777-4777-8777-777777777777', 'grace@fixture.invalid', 'DEMO-PHONE-0007'),
  ('88888888-8888-4888-8888-888888888888', 'henry@fixture.invalid', 'DEMO-PHONE-0008'),
  ('99999999-9999-4999-8999-999999999999', 'irene@fixture.invalid', 'DEMO-PHONE-0009'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'jacob@fixture.invalid', 'DEMO-PHONE-0010'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'lydia@fixture.invalid', 'DEMO-PHONE-0011'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'moses@fixture.invalid', 'DEMO-PHONE-0012')
on conflict (profile_id) do update set email = excluded.email, phone = excluded.phone;

insert into public.memberships (user_id, member_no, status, cohort_year, joined_at) values
  ('11111111-1111-4111-8111-111111111111', 'KOSA-2008-0001', 'active', 2008, now() - interval '3 years'),
  ('22222222-2222-4222-8222-222222222222', 'KOSA-2012-0002', 'active', 2012, now() - interval '2 years'),
  ('44444444-4444-4444-8444-444444444444', 'KOSA-2004-0003', 'active', 2004, now() - interval '5 years'),
  ('55555555-5555-4555-8555-555555555555', 'KOSA-2006-0004', 'active', 2006, now() - interval '4 years'),
  ('66666666-6666-4666-8666-666666666666', 'KOSA-2001-0005', 'active', 2001, now() - interval '6 years'),
  ('77777777-7777-4777-8777-777777777777', 'KOSA-2010-0006', 'active', 2010, now() - interval '1 year'),
  ('88888888-8888-4888-8888-888888888888', 'KOSA-2013-0007', 'active', 2013, now() - interval '1 year'),
  ('99999999-9999-4999-8999-999999999999', 'KOSA-2009-0008', 'lapsed', 2009, now() - interval '5 years'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'KOSA-2011-0009', 'active', 2011, now() - interval '2 years');

insert into public.user_roles (user_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'member'),
  ('22222222-2222-4222-8222-222222222222', 'member'),
  ('44444444-4444-4444-8444-444444444444', 'member'),
  ('44444444-4444-4444-8444-444444444444', 'membership_officer'),
  ('55555555-5555-4555-8555-555555555555', 'member'),
  ('55555555-5555-4555-8555-555555555555', 'treasurer'),
  ('66666666-6666-4666-8666-666666666666', 'member'),
  ('66666666-6666-4666-8666-666666666666', 'super_admin'),
  ('77777777-7777-4777-8777-777777777777', 'member'),
  ('88888888-8888-4888-8888-888888888888', 'member'),
  ('99999999-9999-4999-8999-999999999999', 'member'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'member'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'event_manager');

-- An approved application on file for Alice (enumeration target for Christine).
insert into public.membership_applications
  (id, user_id, full_name, graduation_year, motivation, status, reviewed_at, reviewed_by, review_note)
values
  ('70000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Alice Auma', 2008,
   'I would like to help the association with its schools programme.', 'approved', now(), '44444444-4444-4444-8444-444444444444', 'Welcome.');

-- Moses is a membership officer who applied before being appointed and has not
-- been made a member yet: he must not be able to approve himself.
insert into public.user_roles (user_id, role) values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'membership_officer');

insert into public.membership_applications
  (id, user_id, full_name, graduation_year, motivation, status)
values
  ('70000000-0000-4000-8000-000000000003', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Moses Opio', 2007,
   'I was asked to help with the membership queue and would like to be a member too.', 'pending');

-- Lydia has applied and is waiting for the committee.
insert into public.membership_applications
  (id, user_id, full_name, graduation_year, motivation, status)
values
  ('70000000-0000-4000-8000-000000000002', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Lydia Aciro', 2016,
   'I want to volunteer with the schools programme while I study.', 'pending');

insert into public.events
  (id, slug, title, summary, description, starts_at, ends_at, venue, category, capacity, is_published)
values
  ('10000000-0000-4000-8000-000000000001', 'annual-general-meeting-2026', 'Annual General Meeting 2026',
   'Members meet to review the year and elect the committee.', 'Fixture event.', now() + interval '20 days', now() + interval '20 days 3 hours',
   'Gulu Demo Hall', 'Meeting', 120, true),
  ('10000000-0000-4000-8000-000000000002', 'community-clean-up-2026', 'Community clean-up day',
   'A morning of service in the town centre with students.', 'Fixture event.', now() + interval '40 days', null,
   'Gulu Demo Market', 'Community Service', 60, true),
  ('10000000-0000-4000-8000-000000000003', 'committee-retreat-2027', 'Committee retreat (draft)',
   'Draft planning weekend that is not published yet.', null, now() + interval '90 days', null,
   'Demo Lodge', 'Meeting', 15, false);

insert into public.news_posts (id, slug, title, excerpt, body, author_name, published_at, is_published) values
  ('20000000-0000-4000-8000-000000000001', 'bursary-round-opens', 'Bursary round opens',
   'Applications for the next school term are now open.', 'Fixture story body for the harness.', 'Demo Desk', now() - interval '5 days', true),
  ('20000000-0000-4000-8000-000000000002', 'unpublished-draft', 'Unpublished draft',
   'This story is still being written.', 'Fixture draft body for the harness.', 'Demo Desk', now(), false);

insert into public.gallery_items (id, title, caption, image_url, credit, album, cohort_year, is_published) values
  ('30000000-0000-4000-8000-000000000001', 'Demo assembly', 'Fixture picture.', 'https://example.invalid/gallery/demo-1.jpg', 'Demo photographer', 'Campus', 2008, true),
  ('30000000-0000-4000-8000-000000000002', 'Demo sports day', 'Fixture picture.', 'https://example.invalid/gallery/demo-2.jpg', 'Demo photographer', 'Sports', 2012, true),
  ('30000000-0000-4000-8000-000000000003', 'Demo draft picture', 'Fixture picture.', 'https://example.invalid/gallery/demo-3.jpg', 'Demo photographer', 'Campus', 2015, false);

insert into public.announcements (id, title, body, audience, is_pinned, published_at) values
  ('40000000-0000-4000-8000-000000000001', 'Members meeting', 'Fixture announcement for members only.', 'members', true, now() - interval '2 days'),
  ('40000000-0000-4000-8000-000000000002', 'Committee only note', 'Fixture announcement for administrators only.', 'admins', false, now() - interval '1 day');

insert into public.welfare_requests (id, user_id, category, summary, details, amount_requested, currency, status, is_confidential) values
  ('50000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'medical',
   'Help with a hospital bill', 'Fixture welfare details long enough to pass the check.', 500000, 'UGX', 'submitted', false),
  ('50000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'bereavement',
   'Funeral support for a parent', 'Fixture confidential details long enough to pass the check.', 300000, 'UGX', 'submitted', true);

insert into public.contributions (id, member_id, campaign, amount, currency, method, reference, received_at, note) values
  ('60000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Demo bursary fund', 200000, 'UGX', 'Mobile money', 'DEMO-0001', current_date - 10, 'Fixture contribution.');

-- Four accepting mentors so the mentorship rate limiter can be exercised.
insert into public.mentorship_offers (id, user_id, expertise, availability, is_accepting) values
  ('80000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Software engineering', 'Weekends', true),
  ('80000000-0000-4000-8000-000000000002', '44444444-4444-4444-8444-444444444444', 'Accounting', 'Evenings', true),
  ('80000000-0000-4000-8000-000000000003', '55555555-5555-4555-8555-555555555555', 'Banking', 'Weekends', true),
  ('80000000-0000-4000-8000-000000000004', '66666666-6666-4666-8666-666666666666', 'School leadership', 'Weekends', true);

insert into public.mentorship_requests (id, mentor_id, mentee_id, message, status) values
  ('90000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'Fixture mentorship message long enough for the constraint.', 'pending');

-- One audit row so executive reads have something to return.
insert into public.audit_logs (id, actor_id, actor_email, action, entity, entity_id, detail) values
  ('b0000000-0000-4000-8000-000000000001', null, null, 'fixture.loaded', 'fixtures', null, '{"demo":true}'::jsonb);

insert into public.event_registrations (event_id, user_id, status, guests)
values ('10000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'going', 1);
