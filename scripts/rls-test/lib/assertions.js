'use strict';

/**
 * The RLS assertion matrix. Each entry names the behaviour it proves, the
 * PostgREST-style session it runs as, and the expectation. Descriptions are
 * kept close to docs/SECURITY-MODEL.md.
 */
const {
  pass,
  fail,
  expectRows,
  expectBlocked,
  expectError,
  expectOk,
  expectAffected,
  short,
} = require('./harness');

const U = {
  A: '11111111-1111-4111-8111-111111111111', // active member, visible, contactable
  B: '22222222-2222-4222-8222-222222222222', // active member, mentor
  C: '33333333-3333-4333-8333-333333333333', // signed in, unverified, not a member
  D: '44444444-4444-4444-8444-444444444444', // membership_officer
  E: '55555555-5555-4555-8555-555555555555', // treasurer
  F: '66666666-6666-4666-8666-666666666666', // super_admin
  G: '77777777-7777-4777-8777-777777777777', // active member, visible, NOT contactable
  H: '88888888-8888-4888-8888-888888888888', // active member, directory hidden
  I: '99999999-9999-4999-8999-999999999999', // role 'member' but membership lapsed
  J: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', // event_manager
  K: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', // fresh sign-up
  L: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', // pending application, no membership
  M: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', // membership officer awaiting her own application
};

const EVENT_PUBLISHED = '10000000-0000-4000-8000-000000000001';
const EVENT_PUBLISHED_2 = '10000000-0000-4000-8000-000000000002';
const EVENT_DRAFT = '10000000-0000-4000-8000-000000000003';
const APP_ALICE = '70000000-0000-4000-8000-000000000001';
const APP_LYDIA = '70000000-0000-4000-8000-000000000002';
const APP_MOSES = '70000000-0000-4000-8000-000000000003';
const WELFARE_ALICE = '50000000-0000-4000-8000-000000000001';
const WELFARE_BRIAN = '50000000-0000-4000-8000-000000000002';

const anon = { role: 'anon', claims: {} };
const user = (id) => ({
  role: 'authenticated',
  claims: { sub: id, role: 'authenticated', aud: 'authenticated' },
});
const owner = { role: null, claims: {} };

const as = {
  anon,
  A: user(U.A),
  B: user(U.B),
  C: user(U.C),
  D: user(U.D),
  E: user(U.E),
  F: user(U.F),
  G: user(U.G),
  H: user(U.H),
  I: user(U.I),
  J: user(U.J),
  K: user(U.K),
  L: user(U.L),
  M: user(U.M),
  owner,
};

function buildTests() {
  const tests = [];
  const add = (group, spec) => tests.push({ group, ...spec });

  const expectAtLeast = (name, session, sql, params, min) => ({
    name,
    session,
    run: async (c) => {
      const rows = await c.rows(sql, params);
      return rows.length >= min ? pass(`${rows.length} row(s)`) : fail(`expected at least ${min}, got ${rows.length}`);
    },
  });

  /* ------------------------------------------------------------------ anon */

  const G1 = 'anon';
  add(G1, expectRows('reads only published events', as.anon, 'select id from public.events', [], 2));
  add(G1, expectRows('cannot see a draft event', as.anon, 'select id from public.events where id = $1', [EVENT_DRAFT], 0));
  add(G1, expectRows('reads only published news', as.anon, 'select id from public.news_posts', [], 1));
  add(G1, expectRows('reads only published gallery items', as.anon, 'select id from public.gallery_items', [], 2));
  add(G1, expectBlocked('cannot read profiles', as.anon, 'select * from public.profiles', []));
  add(G1, expectBlocked('cannot read profile_contacts', as.anon, 'select * from public.profile_contacts', []));
  add(G1, expectBlocked('cannot read membership_applications', as.anon, 'select * from public.membership_applications', []));
  add(G1, expectBlocked('cannot read memberships', as.anon, 'select * from public.memberships', []));
  add(G1, expectBlocked('cannot read user_roles', as.anon, 'select * from public.user_roles', []));
  add(G1, expectBlocked('cannot read contributions', as.anon, 'select * from public.contributions', []));
  add(G1, expectBlocked('cannot read welfare_requests', as.anon, 'select * from public.welfare_requests', []));
  add(G1, expectBlocked('cannot read audit_logs', as.anon, 'select * from public.audit_logs', []));
  add(G1, expectBlocked('cannot read announcements', as.anon, 'select * from public.announcements', []));
  add(G1, expectBlocked('cannot read contact_messages', as.anon, 'select * from public.contact_messages', []));
  add(G1, expectBlocked('cannot read rate_limit_events', as.anon, 'select * from public.rate_limit_events', []));
  add(G1, expectBlocked('cannot read event_registrations', as.anon, 'select * from public.event_registrations', []));
  add(G1, expectBlocked('cannot read mentorship_requests', as.anon, 'select * from public.mentorship_requests', []));
  add(
    G1,
    expectError(
      'cannot insert an event',
      as.anon,
      `insert into public.events (slug, title, summary, starts_at) values ('anon-hack', 'Anon hack', 'Anonymous visitors must never publish events.', now())`,
      [],
      /permission denied|row-level security/i,
    ),
  );
  add(
    G1,
    expectError(
      'cannot insert a welfare request',
      as.anon,
      `insert into public.welfare_requests (user_id, category, summary, details) values ($1, 'other', 'Anon request', 'Anonymous visitors must never file welfare requests.')`,
      [U.A],
      /permission denied|row-level security/i,
    ),
  );
  add(
    G1,
    expectError(
      'cannot insert a contact message directly',
      as.anon,
      `insert into public.contact_messages (name, email, subject, message) values ('Anon', 'anon@fixture.invalid', 'Hello there', 'Anonymous visitors must use the RPC for this.')`,
      [],
      /permission denied|row-level security/i,
    ),
  );
  add(G1, expectError('cannot call search_alumni', as.anon, 'select * from public.search_alumni(null, null, null, null, 10, 0)', [], /permission denied/i));
  add(G1, expectError('cannot call get_alumni_profile', as.anon, 'select * from public.get_alumni_profile($1)', [U.A], /permission denied/i));
  add(
    G1,
    expectError(
      'cannot call decide_membership_application',
      as.anon,
      "select public.decide_membership_application($1, 'approved', 'anon')",
      [APP_LYDIA],
      /permission denied/i,
    ),
  );
  add(G1, expectError('cannot call the super-admin bootstrap', as.anon, "select public.bootstrap_super_admin('alice@fixture.invalid')", [], /permission denied/i));
  add(G1, expectAtLeast('can call cohort_stats (aggregate only)', as.anon, 'select * from public.cohort_stats()', [], 1));
  add(G1, {
    name: 'can call get_impact_stats and gets counts, not people',
    session: as.anon,
    run: async (c) => {
      const rows = await c.rows('select * from public.get_impact_stats()');
      if (rows.length !== 1) return fail(`expected 1 row, got ${rows.length}`);
      const row = rows[0];
      const keys = Object.keys(row).sort().join(',');
      if (keys !== 'active_members,bursaries_awarded,cohorts,projects') return fail(`unexpected columns: ${keys}`);
      return Number(row.active_members) >= 1 ? pass(`active_members=${row.active_members}`) : fail('no active members counted');
    },
  });
  add(
    G1,
    expectOk(
      'can submit a contact message (the one anonymous write)',
      as.anon,
      `select public.submit_contact_message('Demo Visitor', 'visitor@fixture.invalid', 'Demo subject', 'This fixture message is long enough to pass.')`,
      [],
    ),
  );

  /* --------------------------------------- signed in, not a member (C / K) */

  const G2 = 'signed-in, not a member';
  add(G2, expectRows('reads exactly one profile (their own)', as.C, 'select id from public.profiles', [], 1));
  add(G2, expectRows("cannot read another person's profile", as.C, 'select id from public.profiles where id = $1', [U.A], 0));
  add(G2, expectAffected('updates their own profile', as.C, "update public.profiles set profession = 'Nurse (updated)' where id = $1", [U.C], 1));
  add(G2, expectAffected("cannot update another person's profile", as.C, "update public.profiles set profession = 'hijacked' where id = $1", [U.A], 0));
  add(G2, expectRows('reads their own contact row', as.C, 'select profile_id from public.profile_contacts', [], 1));
  add(G2, expectRows("cannot read another person's contact row", as.C, 'select profile_id from public.profile_contacts where profile_id = $1', [U.A], 0));
  add(G2, expectAffected('updates their own phone number', as.C, "update public.profile_contacts set phone = '+256700009999' where profile_id = $1", [U.C], 1));
  add(G2, expectAffected("cannot update another person's contact row", as.C, "update public.profile_contacts set phone = '+256700000000' where profile_id = $1", [U.A], 0));
  add(G2, expectRows('cannot read any membership record', as.C, 'select id from public.memberships', [], 0));
  add(G2, expectRows('cannot read any role row', as.C, 'select id from public.user_roles', [], 0));
  add(G2, expectRows('cannot read anyone else\'s application', as.C, 'select id from public.membership_applications', [], 0));
  add(G2, expectBlocked('enumeration by id returns 0 rows, not an error', as.C, 'select id from public.membership_applications where id = $1', [APP_ALICE]));
  add(G2, expectAffected('cannot change an application status', as.C, "update public.membership_applications set status = 'approved' where id = $1", [APP_ALICE], 0));
  add(G2, expectError('cannot insert a role row', as.C, "insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [U.C], /row-level security|permission denied/i));
  add(G2, expectAffected("cannot update someone else's role", as.C, "update public.user_roles set role = 'super_admin' where user_id = $1", [U.A], 0));
  add(G2, expectAffected("cannot delete someone else's role", as.C, 'delete from public.user_roles where user_id = $1', [U.A], 0));
  add(G2, expectError('cannot browse the directory', as.C, 'select * from public.search_alumni(null, null, null, null, 10, 0)', [], /Only active members/i));
  add(G2, expectError('cannot open an alumni profile', as.C, 'select * from public.get_alumni_profile($1)', [U.A], /Only active members/i));
  add(G2, expectRows('cannot read the audit trail', as.C, 'select id from public.audit_logs', [], 0));
  add(G2, expectRows('cannot read announcements', as.C, 'select id from public.announcements', [], 0));
  add(G2, {
    name: 'submits one membership application through the RPC',
    session: as.C,
    run: async (c) => {
      const first = await c.try('select public.submit_membership_application($1::text, $2::int, $3::text, $4::text, null, null, null) as id', [
        'Christine Lamwaka',
        2015,
        'Day scholar',
        'I would like to join the association and help with the health outreach programme.',
      ]);
      if (!first.ok) return fail(`application rejected: ${short(first.error.message)}`);
      const id = first.rows[0].id;
      const status = await c.scalar('select status from public.membership_applications where id = $1', [id]);
      const second = await c.try('select public.submit_membership_application($1::text, $2::int, $3::text, $4::text, null, null, null) as id', [
        'Christine Lamwaka',
        2015,
        null,
        'A second application must not be possible while the first is in review.',
      ]);
      if (status !== 'pending') return fail(`expected pending, got ${status}`);
      if (second.ok) return fail('a second open application was accepted');
      return pass(`created ${id.slice(0, 8)}…, second attempt rejected (${short(second.error.message)})`);
    },
  });
  add(
    G2,
    expectError(
      'cannot insert an application row directly',
      as.C,
      "insert into public.membership_applications (user_id, full_name, graduation_year, motivation) values ($1, 'Christine Lamwaka', 2015, 'Direct inserts bypass the rate limiter, so they are not allowed.')",
      [U.C],
      /row-level security|permission denied/i,
    ),
  );
  add(
    G2,
    {
      group: G2,
      name: 'a brand-new account can apply on its first visit',
      session: as.K,
      run: async (c) => {
        const res = await c.try('select public.submit_membership_application($1::text, $2::int, null, $3::text, null, null, null) as id', [
          'Kevin Omara',
          2018,
          'I have just signed up and would like to join the alumni association.',
        ]);
        if (!res.ok) return fail(`application rejected: ${short(res.error.message)}`);
        const profiles = await c.count('select count(*) from public.profiles where id = $1', [U.K]);
        const apps = await c.count('select count(*) from public.membership_applications where user_id = $1', [U.K]);
        return profiles === 1 && apps === 1
          ? pass('application created, profile available')
          : fail(`profiles=${profiles}, applications=${apps}`);
      },
    },
  );

  /* ------------------------------------------------------- active member A */

  const G3 = 'active member';
  add(G3, expectRows('reads their own profile', as.A, 'select id from public.profiles where id = $1', [U.A], 1));
  add(G3, expectRows("reads another visible member's profile", as.A, 'select id from public.profiles where id = $1', [U.B], 1));
  add(G3, expectRows('cannot read a hidden profile', as.A, 'select id from public.profiles where id = $1', [U.H], 0));
  add(G3, expectRows('cannot read the profile of a non-member', as.A, 'select id from public.profiles where id = $1', [U.C], 0));
  add(G3, expectRows('reads their own contact row', as.A, 'select profile_id from public.profile_contacts', [], 1));
  add(G3, expectRows("cannot read another member's contact row", as.A, 'select profile_id from public.profile_contacts where profile_id = $1', [U.B], 0));
  add(G3, {
    name: 'directory never returns email or phone',
    session: as.A,
    run: async (c) => {
      const res = await c.query('select * from public.search_alumni(null, null, null, null, 50, 0)');
      const cols = res.fields.map((f) => f.name).sort();
      const expected = ['avatar_url', 'city', 'country', 'employer', 'full_name', 'graduation_year', 'id', 'interests', 'profession', 'total_count'].sort();
      if (cols.join(',') !== expected.join(',')) return fail(`unexpected columns: ${cols.join(',')}`);
      return pass(`${res.rows.length} cards, columns: ${cols.join(', ')}`);
    },
  });
  add(G3, {
    name: 'directory excludes hidden profiles and non-members',
    session: as.A,
    run: async (c) => {
      const rows = await c.rows('select id from public.search_alumni(null, null, null, null, 50, 0)');
      const ids = rows.map((r) => r.id);
      const problems = [];
      if (ids.includes(U.H)) problems.push('hidden member H');
      if (ids.includes(U.C)) problems.push('non-member C');
      if (ids.includes(U.I)) problems.push('lapsed member I');
      if (ids.length !== 7) problems.push(`expected 7 visible members, got ${ids.length}`);
      return problems.length ? fail(problems.join('; ')) : pass('7 visible active members, no hidden/lapsed/non-members');
    },
  });
  add(G3, {
    name: 'directory filters by graduation year and reports total_count',
    session: as.A,
    run: async (c) => {
      const all = await c.rows('select id, total_count from public.search_alumni(null, null, null, null, 50, 0)');
      const filtered = await c.rows('select id, graduation_year, total_count from public.search_alumni(null, 2008, null, null, 50, 0)');
      if (all.length !== 7) return fail(`expected 7 directory rows, got ${all.length}`);
      if (Number(all[0].total_count) !== 7) return fail(`total_count=${all[0].total_count}`);
      if (filtered.length !== 1 || filtered[0].graduation_year !== 2008) return fail(`year filter returned ${filtered.length} rows`);
      return pass('year filter 1 row, total_count 7');
    },
  });
  add(G3, {
    name: 'directory text, profession and location filters work',
    session: as.A,
    run: async (c) => {
      const byProfession = await c.rows("select id from public.search_alumni('teach', null, null, null, 10, 0)");
      const byInterest = await c.rows("select id from public.search_alumni('netball', null, null, null, 10, 0)");
      const byLocation = await c.rows("select id from public.search_alumni(null, null, null, 'Kitgum', 10, 0)");
      const byFilter = await c.rows("select id from public.search_alumni(null, null, 'Software', null, 10, 0)");
      const ids = (rows) => rows.map((r) => r.id);
      if (!ids(byProfession).includes(U.A)) return fail('profession text search missed Alice');
      if (!ids(byInterest).includes(U.A)) return fail('interest search missed Alice');
      if (ids(byLocation).join() !== U.G) return fail(`location filter returned ${ids(byLocation).length} row(s)`);
      if (ids(byFilter).join() !== U.B) return fail(`profession filter returned ${ids(byFilter).length} row(s)`);
      return pass('text, interest, location and profession filters all match');
    },
  });
  add(G3, {
    name: 'get_alumni_profile shares contact details only when the target allows it',
    session: as.A,
    run: async (c) => {
      const b = (await c.rows('select * from public.get_alumni_profile($1)', [U.B]))[0];
      const g = (await c.rows('select * from public.get_alumni_profile($1)', [U.G]))[0];
      if (!b) return fail('Brian (contactable) not returned');
      if (!g) return fail('Grace (not contactable) not returned');
      if (!b.email || !b.phone || b.can_contact !== true) return fail(`Brian leaked wrong: ${JSON.stringify({ email: b.email, can_contact: b.can_contact })}`);
      if (g.email !== null || g.phone !== null || g.can_contact !== false) return fail('Grace contact details were exposed');
      return pass('opt-in honoured (email/phone for B, null for G)');
    },
  });
  add(G3, expectRows('hidden members are not reachable by id', as.A, 'select * from public.get_alumni_profile($1)', [U.H], 0));
  add(G3, expectRows('non-members are not reachable by id', as.A, 'select * from public.get_alumni_profile($1)', [U.C], 0));
  add(G3, expectRows('can open their own profile', as.A, 'select * from public.get_alumni_profile($1)', [U.A], 1));
  add(G3, expectRows('cannot read contributions', as.A, 'select id from public.contributions', [], 0));
  add(G3, expectError('cannot insert a contribution', as.A, "insert into public.contributions (member_id, campaign, amount, currency) values ($1, 'Hack', 1, 'UGX')", [U.A], /row-level security|permission denied/i));
  add(G3, expectError('cannot call record_contribution', as.A, "select public.record_contribution(null, 'Hack', 1, 'UGX', null, null, current_date, null)", [], /Only the treasurer/i));
  add(G3, expectError('cannot call decide_membership_application', as.A, "select public.decide_membership_application($1, 'approved', 'self')", [APP_LYDIA], /Only the membership committee/i));
  add(G3, expectError('cannot call set_member_status', as.A, "select public.set_member_status($1, 'active', 'self')", [U.A], /Only the membership committee/i));
  add(G3, expectError('cannot call set_user_role', as.A, "select public.set_user_role($1, 'super_admin', true)", [U.A], /Only a super admin/i));
  add(G3, expectAffected('cannot change their own application status', as.A, "update public.membership_applications set status = 'approved' where id = $1", [APP_ALICE], 0));
  add(G3, expectAffected('cannot change their own membership status', as.A, "update public.memberships set status = 'suspended' where user_id = $1", [U.A], 0));
  add(G3, expectError('cannot grant themselves super_admin', as.A, "insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [U.A], /row-level security|permission denied/i));
  add(G3, expectAffected('cannot promote their own member role', as.A, "update public.user_roles set role = 'super_admin' where user_id = $1", [U.A], 0));
  add(G3, expectRows('cannot read the audit trail', as.A, 'select id from public.audit_logs', [], 0));
  add(G3, expectRows('reads their own membership row', as.A, 'select id from public.memberships where user_id = $1', [U.A], 1));
  add(G3, expectRows("cannot read another member's membership row", as.A, 'select id from public.memberships where user_id = $1', [U.B], 0));
  add(G3, expectRows('reads member announcements', as.A, "select id from public.announcements where audience = 'members'", [], 1));
  add(G3, expectRows('cannot read admin announcements', as.A, "select id from public.announcements where audience = 'admins'", [], 0));
  add(G3, expectRows("cannot read another member's non-confidential welfare request", as.A, 'select id from public.welfare_requests where id = $1', [WELFARE_BRIAN], 0));
  add(G3, expectRows('reads only their own welfare request', as.A, 'select id from public.welfare_requests', [], 1));
  add(G3, expectRows('cannot read the welfare queue of others', as.A, 'select id from public.welfare_requests where user_id <> $1', [U.A], 0));
  add(
    G3,
    expectAffected(
      'files a welfare request of their own',
      as.A,
      "insert into public.welfare_requests (user_id, category, summary, details) values ($1, 'hardship', 'School fees shortfall', 'A fixture request that is long enough to satisfy the details check.')",
      [U.A],
      1,
    ),
  );
  add(G3, {
    name: 'the dashboard form can file a request without sending user_id',
    session: as.A,
    run: async (c) => {
      const res = await c.try(
        "insert into public.welfare_requests (category, summary, details) values ('education', 'Demo fees request', 'A fixture request long enough to satisfy the details check.') returning user_id",
      );
      if (!res.ok) return fail(`insert rejected: ${short(res.error.message)}`);
      return res.rows[0].user_id === U.A ? pass('user_id attributed to the caller') : fail(`user_id=${res.rows[0].user_id}`);
    },
  });
  add(
    G3,
    expectError(
      "cannot file a welfare request in someone else's name",
      as.A,
      "insert into public.welfare_requests (user_id, category, summary, details) values ($1, 'hardship', 'Not mine', 'This request is filed on behalf of another member, which must fail.')",
      [U.B],
      /row-level security|permission denied/i,
    ),
  );
  add(
    G3,
    expectError(
      'cannot approve their own welfare request',
      as.A,
      "update public.welfare_requests set status = 'approved' where id = $1",
      [WELFARE_ALICE],
      /row-level security/i,
    ),
  );
  add(G3, expectRows('cannot read contact messages', as.A, 'select id from public.contact_messages', [], 0));
  add(G3, expectRows('cannot read the rate-limit ledger', as.A, 'select id from public.rate_limit_events', [], 0));
  add(G3, expectError('cannot call the super_admin bootstrap', as.A, "select public.bootstrap_super_admin('alice@fixture.invalid')", [], /permission denied/i));
  add(
    G3,
    expectError(
      'cannot write to the audit trail directly',
      as.A,
      "insert into public.audit_logs (actor_id, action, entity) values ($1, 'fake.action', 'memberships')",
      [U.A],
      /row-level security|permission denied/i,
    ),
  );
  add(G3, expectAffected('cannot edit the audit trail', as.A, "update public.audit_logs set action = 'tampered'", [], 0));
  add(G3, expectAffected('cannot delete the audit trail', as.A, 'delete from public.audit_logs', [], 0));
  add(G3, {
    name: 'registers for a published event, then may only cancel',
    session: as.A,
    run: async (c) => {
      const reg = await c.try('select public.register_for_event($1, 1, null) as id', [EVENT_PUBLISHED]);
      if (!reg.ok) return fail(`registration rejected: ${short(reg.error.message)}`);
      const id = reg.rows[0].id;
      const status = await c.scalar('select status from public.event_registrations where id = $1', [id]);
      if (status !== 'going') return fail(`expected going, got ${status}`);
      const cancel = await c.try("update public.event_registrations set status = 'cancelled' where id = $1", [id]);
      if (cancel.rowCount !== 1) return fail(`cancel affected ${cancel.rowCount} row(s)`);
      const revive = await c.try("update public.event_registrations set status = 'going' where id = $1", [id]);
      if (revive.ok) return fail('a cancelled registration could be revived directly');
      return pass('registered, cancelled (1 row), revive blocked by WITH CHECK');
    },
  });
  add(
    G3,
    expectError(
      'cannot insert a registration row directly',
      as.A,
      'insert into public.event_registrations (event_id, user_id) values ($1, $2)',
      [EVENT_PUBLISHED_2, U.A],
      /row-level security|permission denied/i,
    ),
  );
  add(G3, expectAffected("cannot cancel another member's registration", as.A, "update public.event_registrations set status = 'cancelled' where user_id = $1", [U.B], 0));
  add(G3, expectRows("cannot read another member's registrations", as.A, 'select id from public.event_registrations where user_id = $1', [U.B], 0));
  add(
    G3,
    expectAffected(
      'publishes their own mentorship offer',
      as.A,
      "insert into public.mentorship_offers (user_id, expertise) values ($1, 'Teaching')",
      [U.A],
      1,
    ),
  );
  add(
    G3,
    expectError(
      "cannot publish an offer for someone else",
      as.A,
      "insert into public.mentorship_offers (user_id, expertise) values ($1, 'Ghost writing')",
      [U.B],
      /row-level security|permission denied/i,
    ),
  );
  add(
    G3,
    expectError(
      'cannot request mentorship from a non-mentor',
      as.A,
      'select public.request_mentorship($1, $2)',
      [U.C, 'Please mentor me in community health work for a term.'],
      /not accepting requests/i,
    ),
  );
  add(G3, {
    name: 'requests mentorship, sees only that thread, cannot accept it',
    session: as.A,
    run: async (c) => {
      const req = await c.try('select public.request_mentorship($1, $2) as id', [
        U.B,
        'I would like some guidance on moving from teaching into school leadership.',
      ]);
      if (!req.ok) return fail(`request rejected: ${short(req.error.message)}`);
      const id = req.rows[0].id;
      const mine = await c.count('select count(*) from public.mentorship_requests');
      const others = await c.count('select count(*) from public.mentorship_requests where mentor_id <> $1 and mentee_id <> $1', [U.A]);
      const accept = await c.try("select public.respond_mentorship($1, 'accepted')", [id]);
      if (mine !== 1) return fail(`expected 1 visible request, got ${mine}`);
      if (others !== 0) return fail(`saw ${others} request(s) that are not theirs`);
      if (accept.ok) return fail('the mentee could accept their own request');
      return pass('1 request visible, acceptance refused');
    },
  });
  add(G3, expectRows('cannot read a mentorship thread they are not part of', as.A, 'select id from public.mentorship_requests where mentee_id = $1', [U.J], 0));
  add(G3, expectRows('mentor sees the request addressed to them', as.B, 'select id from public.mentorship_requests', [], 1));

  /* -------------------------------------------------- membership_officer D */

  const G4 = 'membership officer';
  add(G4, expectRows('reads the application queue', as.D, 'select id from public.membership_applications', [], 3));
  add(G4, expectAffected('updates an application status', as.D, "update public.membership_applications set status = 'needs_info' where id = $1", [APP_ALICE], 1));
  add(G4, {
    name: 'approving an application creates an active membership, a member number and the member role',
    session: as.D,
    run: async (c) => {
      const res = await c.try("select public.decide_membership_application($1, 'approved', 'Welcome aboard')", [APP_LYDIA]);
      if (!res.ok) return fail(`approval failed: ${short(res.error.message)}`);
      const m = await c.one('select status, member_no, cohort_year, joined_at from public.memberships where user_id = $1', [U.L]);
      const role = await c.count("select count(*) from public.user_roles where user_id = $1 and role = 'member'", [U.L]);
      const app = await c.scalar('select status from public.membership_applications where id = $1', [APP_LYDIA]);
      if (!m) return fail('no membership row created');
      if (m.status !== 'active' || !m.joined_at) return fail(`membership not activated: ${JSON.stringify(m)}`);
      if (!/^KOSA-2016-\d{4,6}$/.test(m.member_no || '')) return fail(`bad member_no: ${m.member_no}`);
      if (role !== 1) return fail(`member role rows: ${role}`);
      if (app !== 'approved') return fail(`application status: ${app}`);
      return pass(`membership ${m.member_no} active, role granted`);
    },
  });
  add(G4, {
    name: 'set_member_status changes a membership and is audited',
    session: as.D,
    run: async (c) => {
      const res = await c.try("select public.set_member_status($1, 'suspended', 'Fixture suspension')", [U.B]);
      if (!res.ok) return fail(`call failed: ${short(res.error.message)}`);
      const status = await c.scalar('select status from public.memberships where user_id = $1', [U.B]);
      const audit = await c.count("select count(*) from public.audit_logs where action = 'membership.status.suspended' and entity_id = $1", [U.B]);
      if (status !== 'suspended') return fail(`status is ${status}`);
      if (audit !== 1) return fail(`audit rows: ${audit}`);
      return pass('status suspended, audit row written');
    },
  });
  add(G4, expectError('cannot approve their own application', as.M, "select public.decide_membership_application($1, 'approved', 'self')", [APP_MOSES], /cannot decide your own application/i));
  add(G4, expectAffected('updates a membership status row', as.D, "update public.memberships set status = 'lapsed' where user_id = $1", [U.I], 1));
  add(G4, expectAffected('cannot delete role rows', as.D, 'delete from public.user_roles where user_id = $1', [U.J], 0));
  add(G4, expectError('cannot change roles', as.D, "select public.set_user_role($1, 'treasurer', true)", [U.B], /Only a super admin/i));
  add(G4, expectRows('cannot read contributions', as.D, 'select id from public.contributions', [], 0));
  add(G4, expectError('cannot insert a role row', as.D, "insert into public.user_roles (user_id, role) values ($1, 'treasurer')", [U.B], /row-level security|permission denied/i));
  add(G4, expectRows("cannot read another member's contact details", as.D, 'select profile_id from public.profile_contacts where profile_id = $1', [U.B], 0));
  add(G4, expectAtLeast('reads the audit trail as an executive', as.D, 'select id from public.audit_logs', [], 1));
  add(G4, expectRows('reads the welfare queue as an executive', as.D, 'select id from public.welfare_requests', [], 2));

  /* ----------------------------------------------------------- treasurer E */

  const G5 = 'treasurer';
  add(G5, expectRows('reads contributions', as.E, 'select id from public.contributions', [], 1));
  add(G5, {
    name: 'records a contribution through the RPC',
    session: as.E,
    run: async (c) => {
      const before = await c.count('select count(*) from public.contributions');
      const res = await c.try('select public.record_contribution($1, $2, $3, $4, $5, $6, $7, $8) as id', [
        U.B,
        'Demo bursary fund',
        150000,
        'UGX',
        'Bank transfer',
        'DEMO-0002',
        '2026-10-01',
        'Fixture contribution.',
      ]);
      if (!res.ok) return fail(`call failed: ${short(res.error.message)}`);
      const after = await c.count('select count(*) from public.contributions');
      const row = await c.one('select amount, currency, recorded_by from public.contributions where id = $1', [res.rows[0].id]);
      if (after !== before + 1) return fail(`row count ${before} -> ${after}`);
      if (Number(row.amount) !== 150000 || row.recorded_by !== U.E) return fail(`row: ${JSON.stringify(row)}`);
      return pass('contribution stored with recorded_by');
    },
  });
  add(G5, expectError('cannot decide membership applications', as.E, "select public.decide_membership_application($1, 'approved', 'treasurer')", [APP_LYDIA], /Only the membership committee/i));
  add(G5, expectRows('reads the whole welfare queue including confidential rows', as.E, 'select id from public.welfare_requests', [], 2));
  add(G5, {
    name: 'decides a welfare request',
    session: as.E,
    run: async (c) => {
      const res = await c.try("select public.decide_welfare_request($1, 'approved', 'Approved by the welfare committee')", [WELFARE_BRIAN]);
      if (!res.ok) return fail(`call failed: ${short(res.error.message)}`);
      const row = await c.one('select status, handled_by from public.welfare_requests where id = $1', [WELFARE_BRIAN]);
      if (row.status !== 'approved' || row.handled_by !== U.E) return fail(`row: ${JSON.stringify(row)}`);
      return pass('request approved and attributed');
    },
  });
  add(G5, expectError('cannot insert a role row', as.E, "insert into public.user_roles (user_id, role) values ($1, 'super_admin')", [U.E], /row-level security|permission denied/i));
  add(G5, expectRows("cannot read another member's contact details", as.E, 'select profile_id from public.profile_contacts where profile_id = $1', [U.B], 0));
  add(G5, expectError('cannot change a membership status', as.E, "select public.set_member_status($1, 'active', 'treasurer')", [U.I], /Only the membership committee/i));

  /* --------------------------------------------------------- super_admin F */

  const G6 = 'super admin';
  add(G6, expectAtLeast('reads the audit trail', as.F, 'select id from public.audit_logs', [], 1));
  add(G6, expectAffected('grants a role directly', as.F, "insert into public.user_roles (user_id, role) values ($1, 'treasurer')", [U.L], 1));
  add(G6, expectError('cannot grant a role to themselves', as.F, "insert into public.user_roles (user_id, role) values ($1, 'treasurer')", [U.F], /row-level security|permission denied/i));
  add(G6, {
    name: 'set_user_role grants a role to another person',
    session: as.F,
    run: async (c) => {
      const res = await c.try("select public.set_user_role($1, 'event_manager', true)", [U.L]);
      if (!res.ok) return fail(`call failed: ${short(res.error.message)}`);
      const rows = await c.count("select count(*) from public.user_roles where user_id = $1 and role = 'event_manager'", [U.L]);
      return rows === 1 ? pass('role granted') : fail(`role rows: ${rows}`);
    },
  });
  add(G6, expectError('cannot escalate their own role through the RPC', as.F, "select public.set_user_role($1, 'super_admin', true)", [U.F], /cannot change your own roles/i));
  add(G6, expectAffected("revokes another person's role", as.F, "delete from public.user_roles where user_id = $1 and role = 'event_manager'", [U.J], 1));
  add(G6, expectAffected('cannot remove their own super_admin role', as.F, "delete from public.user_roles where user_id = $1 and role = 'super_admin'", [U.F], 0));
  add(G6, expectAffected('cannot edit the audit trail (append-only)', as.F, "update public.audit_logs set action = 'tampered'", [], 0));

  /* ------------------------------------------------------------ rate limits */

  const G7 = 'rate limiting';
  add(G7, {
    name: 'assert_rate_limit admits 3 hits and rejects the 4th',
    session: owner,
    commit: true,
    run: async (c) => {
      const key = 'harness:rate-limit:direct';
      const outcomes = [];
      for (let i = 0; i < 4; i += 1) {
        const res = await c.try('select public.assert_rate_limit($1, 3, 3600)', [key]);
        outcomes.push(res.ok ? 'ok' : res.error.message);
      }
      if (outcomes.slice(0, 3).some((o) => o !== 'ok')) return fail(`early rejection: ${outcomes.join(' | ')}`);
      if (!/rate limit exceeded/.test(outcomes[3])) return fail(`4th hit was not rejected: ${outcomes[3]}`);
      return pass('3 accepted, 4th rejected');
    },
  });
  add(G7, {
    name: 'the 4th mentorship request in the window is rejected',
    session: as.A,
    run: async (c) => {
      const mentors = [U.B, U.D, U.E, U.F];
      const outcomes = [];
      for (const mentor of mentors) {
        const res = await c.try('select public.request_mentorship($1, $2) as id', [
          mentor,
          'I would like some guidance on moving into school leadership over the next year.',
        ]);
        outcomes.push(res.ok ? 'ok' : res.error.message);
      }
      const early = outcomes.slice(0, 3).filter((o) => o !== 'ok');
      if (early.length) return fail(`one of the first three was rejected: ${early.join(' | ')}`);
      if (!/rate limit exceeded/.test(outcomes[3])) return fail(`4th request: ${short(outcomes[3])}`);
      return pass('3 accepted, 4th rejected by the limiter');
    },
  });
  add(G7, {
    name: 'an accepted membership application consumes a limiter slot',
    session: as.K,
    commit: true,
    run: async (c) => {
      const res = await c.try('select public.submit_membership_application($1::text, $2::int, $3::text, $4::text, null, null, null) as id', [
        'Kevin Omara',
        2018,
        null,
        'I have just finished school and would like to join the alumni association.',
      ]);
      if (!res.ok) return fail(`application rejected: ${short(res.error.message)}`);
      // Drop back to the owner for one read: the ledger is invisible to members.
      await c.query('reset role');
      const hits = await c.count('select count(*) from public.rate_limit_events where key = $1', [
        `membership_application:${U.K}`,
      ]);
      await c.query('set role authenticated');
      return hits === 1 ? pass('1 hit recorded for the applicant') : fail(`hits=${hits}`);
    },
  });
  add(G7, {
    name: 'the 6th contact message from one address is rate limited',
    session: as.anon,
    commit: true,
    run: async (c) => {
      const outcomes = [];
      for (let i = 0; i < 6; i += 1) {
        const res = await c.try('select public.submit_contact_message($1, $2, $3, $4)', [
          'Demo Visitor',
          'rate-limit@fixture.invalid',
          'Demo subject',
          `Message ${i + 1} is long enough to pass the twenty character minimum.`,
        ]);
        outcomes.push(res.ok ? 'ok' : res.error.message);
      }
      if (outcomes.slice(0, 5).some((o) => o !== 'ok')) return fail(`early rejection: ${outcomes.join(' | ')}`);
      if (!/rate limit exceeded/.test(outcomes[5])) return fail(`6th message not limited: ${short(outcomes[5])}`);
      return pass('5 accepted, 6th rejected');
    },
  });

  /* ------------------------------------------------- schema-level invariants */

  const G8 = 'schema invariants';
  add(G8, {
    name: 'RLS is enabled on all 17 tables',
    session: owner,
    run: async (c) => {
      const total = await c.count("select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'");
      const open = await c.count("select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity");
      return total === 17 && open === 0 ? pass('17 tables, all with RLS') : fail(`tables=${total}, without RLS=${open}`);
    },
  });
  add(G8, {
    name: 'no policy is unconditionally permissive',
    session: owner,
    run: async (c) => {
      const rows = await c.rows("select tablename, policyname from pg_policies where schemaname = 'public' and (qual = 'true' or with_check = 'true')");
      return rows.length === 0 ? pass('no `true` qualifier') : fail(`${rows.length} permissive: ${rows.map((r) => r.policyname).join(', ')}`);
    },
  });
  add(G8, {
    name: 'every SECURITY DEFINER function pins search_path',
    session: owner,
    run: async (c) => {
      const rows = await c.rows(
        `select p.oid::regprocedure as fn
           from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
          where p.prosecdef
            and n.nspname in ('public', 'private')
            and not exists (
              select 1 from unnest(coalesce(p.proconfig, '{}'::text[])) cfg
               where cfg like 'search_path=%'
            )`,
      );
      return rows.length === 0 ? pass('all definer functions pinned') : fail(`unpinned: ${rows.map((r) => r.fn).join(', ')}`);
    },
  });
  add(G8, {
    name: 'all 15 RPC signatures the frontend calls exist',
    session: owner,
    run: async (c) => {
      const signatures = [
        'public.submit_membership_application(text,integer,text,text,text,text[],text)',
        'public.decide_membership_application(uuid,text,text)',
        'public.set_member_status(uuid,text,text)',
        'public.set_user_role(uuid,text,boolean)',
        'public.search_alumni(text,integer,text,text,integer,integer)',
        'public.get_alumni_profile(uuid)',
        'public.cohort_stats()',
        'public.get_impact_stats()',
        'public.register_for_event(uuid,integer,text)',
        'public.record_contribution(uuid,text,numeric,text,text,text,date,text)',
        'public.decide_welfare_request(uuid,text,text)',
        'public.request_mentorship(uuid,text)',
        'public.respond_mentorship(uuid,text)',
        'public.submit_contact_message(text,text,text,text)',
        'public.assert_rate_limit(text,integer,integer)',
      ];
      const rows = await c.rows(
        'select s.sig, to_regprocedure(s.sig) as oid from unnest($1::text[]) as s(sig)',
        [signatures],
      );
      const missing = rows.filter((r) => r.oid === null).map((r) => r.sig);
      return missing.length === 0 ? pass('15/15 present') : fail(`missing: ${missing.join(', ')}`);
    },
  });
  add(G8, {
    name: 'audit_logs has no write policy at all',
    session: owner,
    run: async (c) => {
      const rows = await c.count("select count(*) from pg_policies where schemaname = 'public' and tablename = 'audit_logs' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')");
      return rows === 0 ? pass('0 write policies') : fail(`${rows} write policies found`);
    },
  });
  add(G8, {
    name: 'rate_limit_events is invisible to every API role',
    session: owner,
    run: async (c) => {
      const rows = await c.count("select count(*) from pg_policies where schemaname = 'public' and tablename = 'rate_limit_events'");
      return rows === 0 ? pass('0 policies (default deny)') : fail(`${rows} policies found`);
    },
  });
  add(G8, {
    name: 'the owner can bootstrap a super admin, members cannot',
    session: owner,
    run: async (c) => {
      const res = await c.try("select public.bootstrap_super_admin('lydia@fixture.invalid')");
      if (!res.ok) return fail(`owner bootstrap failed: ${short(res.error.message)}`);
      const rows = await c.count("select count(*) from public.user_roles where user_id = $1 and role = 'super_admin'", [U.L]);
      return rows === 1 ? pass('role granted to the existing account') : fail(`role rows: ${rows}`);
    },
  });
  add(G8, {
    name: 'assert_rate_limit is not executable by API roles',
    session: owner,
    run: async (c) => {
      const rows = await c.count(
        `select count(*) from information_schema.routine_privileges
          where routine_schema = 'public' and routine_name = 'assert_rate_limit'
            and grantee in ('anon', 'authenticated', 'PUBLIC')`,
      );
      return rows === 0 ? pass('not granted to anon/authenticated/PUBLIC') : fail(`${rows} grant(s) found`);
    },
  });
  add(G8, {
    name: 'a lapsed member loses directory access',
    session: as.I,
    run: async (c) => {
      try {
        const rows = await c.rows('select id from public.search_alumni(null, null, null, null, 10, 0)');
        return rows.length === 0 ? pass('0 rows') : fail(`returned ${rows.length} row(s)`);
      } catch (err) {
        return /Only active members/i.test(err.message) ? pass('exception: not an active member') : fail(`unexpected: ${err.message}`);
      }
    },
  });

  return tests;
}

module.exports = { buildTests, U, EVENT_PUBLISHED, EVENT_PUBLISHED_2, EVENT_DRAFT, APP_ALICE, APP_LYDIA, WELFARE_ALICE, WELFARE_BRIAN };
