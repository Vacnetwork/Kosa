# Security model

The KOSA platform keeps every authorisation decision in PostgreSQL. The static
frontend holds only the public anon key, so anything it can reach is exactly what
`anon` or `authenticated` is allowed to reach. There is no service-role key in
the repository and no server of ours in the write path.

## How it is enforced

1. **RLS on every table, default deny.** All 17 tables have
   `enable row level security`. A role with no matching policy gets no rows from
   `SELECT` and an error from any write. No policy is `true`.
2. **Privileges are broad, policies are narrow.** `anon` may `SELECT` only
   `events`, `news_posts` and `gallery_items` (and RLS filters those on
   `is_published`). `authenticated` holds table privileges on everything, so RLS
   is the single gate rather than a second, silent one.
3. **RPCs are the write boundary.** Everything that needs a decision the client
   must not make (rate limits, capacity, member numbers, money, audit) is a
   `SECURITY DEFINER` function in `public` with `set search_path = ''`, an
   explicit caller check, and `execute` granted to the roles that may call it.
4. **Helpers are not API surface.** `is_active_member`, `has_role`,
   `is_admin`, `is_executive`, `is_treasurer`, `write_audit` and friends live in
   the `private` schema. PostgREST only publishes `public`, so they cannot be
   called as endpoints. They are `SECURITY DEFINER` so that policies reading
   `memberships`/`user_roles` do not recurse into those tables' own policies.

## Roles

| Role | Meaning |
| --- | --- |
| `super_admin` | owns the platform: roles, everything the committee and treasurer can do |
| `membership_officer` | application queue and member records |
| `event_manager` | events and gallery |
| `treasurer` | contributions and the welfare fund |
| `member` | ordinary member; needs `memberships.status = 'active'` for member-only surfaces |

"Active member" is a row in `memberships` with `status = 'active'` — a role alone
is not enough, so a lapsed or suspended member loses the directory immediately
(`memberships` and `user_roles` are deliberately separate).

## Table by table

| Table | Read | Write |
| --- | --- | --- |
| `profiles` | own row; committee: all; active members: active members whose `directory_visibility = 'members'` | insert/update own row only; no delete |
| `profile_contacts` | own row, plus `super_admin` | insert/update own row only |
| `membership_applications` | own rows, plus committee | update by committee; **no insert/delete** — rows come from `submit_membership_application()` |
| `memberships` | own row, plus committee | update by committee; no insert/delete |
| `user_roles` | own rows, plus committee | `super_admin` only, and never on their own account |
| `events` | published rows to everyone; drafts to `event_manager`/committee | `event_manager` or committee |
| `event_registrations` | own rows; `event_manager`/committee see all | own row may only move to `cancelled`; managers may edit; **no insert** (RPC only) |
| `announcements` | `audience = 'members'` to active members; `audience = 'admins'` to committee | committee |
| `news_posts` | published rows to everyone; drafts to committee | committee |
| `gallery_items` | published rows to everyone; drafts to staff | `event_manager` or committee |
| `welfare_requests` | own rows; executive committee sees all | insert own (`status = 'submitted'`); update own **only while still `submitted`** and never `handled_by`/`status`; executives decide |
| `contributions` | `treasurer` and `super_admin` | update/delete by those two; **no insert** — `record_contribution()` only |
| `mentorship_offers` | active members (accepting offers, or their own); committee | insert/update/delete own |
| `mentorship_requests` | the mentor, the mentee, committee | **no direct write** — `request_mentorship()` / `respond_mentorship()` |
| `audit_logs` | executive committee | **nobody**: no insert policy, and a trigger rejects `UPDATE`/`DELETE` for every role |
| `contact_messages` | committee | no insert (RPC); committee may mark handled |
| `rate_limit_events` | nobody | nobody — only `assert_rate_limit()` writes it |

## RPCs

| Function | Callers | Notes |
| --- | --- | --- |
| `submit_membership_application` | authenticated | rate limited 3/hour per account; one open application per person (partial unique index); creates a profile stub if sign-up has not yet |
| `decide_membership_application` | `super_admin`, `membership_officer` | approved ⇒ active membership with `KOSA-<year>-<seq>` member number, `joined_at`, and the `member` role; audited |
| `set_member_status` | `super_admin`, `membership_officer` | audited |
| `set_user_role` | `super_admin` | refuses self-changes and refuses removing the last `super_admin`; audited |
| `search_alumni` | active members | returns the `AlumniCard` shape only — no email, no phone |
| `get_alumni_profile` | active members | email/phone only when the target set `allow_contact_by_members`; hidden profiles are unreachable |
| `cohort_stats`, `get_impact_stats` | anon + authenticated | aggregates only (counts and years), no personal data — the public landing page uses them |
| `register_for_event` | active members | published events only; capacity decides `going` vs `waitlist`; audited |
| `record_contribution` | `treasurer`, `super_admin` | validates amount/currency; sets `recorded_by`; audited |
| `decide_welfare_request` | executive committee | `reviewing|approved|disbursed|declined`; audited |
| `request_mentorship` | active members | rate limited 3/day; mentor must be an active member with an accepting offer; one open request per pair |
| `respond_mentorship` | the mentor (mentee may only `close`) | audited |
| `submit_contact_message` | anon + authenticated | the only anonymous write; rate limited 5/hour per address |
| `assert_rate_limit` | internal only | revoked from `anon`/`authenticated`/`PUBLIC` |
| `bootstrap_super_admin` | database owner / service role | revoked from `anon`/`authenticated`; the first administrator is created from the SQL editor, never from the app |

## Decisions worth stating

- **Welfare requests are not peer-visible.** A member cannot read another
  member's request even when `is_confidential = false`. The queue is an
  executive-committee document; non-confidential only means the committee may
  discuss it more widely. Confidentiality is therefore not the only control.
- **Contact details are opt-in and RPC-mediated.** `profile_contacts` is
  unreadable by other members at table level; `get_alumni_profile` is the only
  channel and it checks `allow_contact_by_members` on every call.
- **Applications, contributions and registrations are RPC-only.** Direct inserts
  would bypass rate limiting, member numbering and the audit trail, so the
  policies simply do not allow them.
- **Nobody decides their own application.** `decide_membership_application`
  refuses when the application belongs to the caller, so a membership officer
  cannot approve themselves into membership.
- **The bootstrap guard was rewritten.** `0013_auth_bootstrap.sql` tested
  `current_user`, which inside a `SECURITY DEFINER` function is the function
  owner — every signed-in caller passed. `0014_harden_bootstrap.sql` replaces it
  with a `session_user` / JWT check and revokes the function from `anon` and
  `authenticated`, so the first administrator can only be created from the SQL
  editor or with the service role. The harness proves a member is refused.
- **The audit trail is append-only for everyone**, including the owner of the
  tables. Retention/pruning, if it is ever needed, is a deliberate manual
  operation, not an API call.
- **Rate limiting counts committed writes.** The ledger row is written in the
  same transaction as the submission, so a submission that is rejected rolls
  back its own hit; repeated *invalid* attempts are bounded by validation and
  uniqueness instead. Successful writes — the ones that create rows, send
  messages or notify people — are what the limiter throttles.
- **Email verification is Supabase Auth's job.** RLS treats every signed-in
  account the same until a membership is active; unverified accounts can edit
  their own profile and apply, nothing more.

## What the harness proves

`scripts/rls-test` boots a real PostgreSQL 17 (embedded, no root, no Docker),
installs a Supabase-compatible `auth` shim (`auth.users`, `auth.uid()`,
`auth.jwt()` reading `request.jwt.claims`), applies every migration, loads 13
fixture accounts (8 active members, one lapsed member, one signed-in
non-member, one pending applicant, one fresh sign-up, one committee member who
is not yet a member), then runs the matrix as `anon`, those identities, and the
owner. Each assertion runs in its own transaction with
`SET LOCAL role …` + `set_config('request.jwt.claims', …)` and rolls back, apart
from the rate-limit cases which must commit.

```
cd scripts/rls-test && ./run.sh      # or: npm test
```

145 assertions, all passing. They cover:

- anonymous read of published events/news/gallery only, and no access to
  profiles, contacts, applications, memberships, roles, contributions, welfare,
  audit, contact messages or the rate-limit ledger;
- own-row-only profile and contact access for a signed-in non-member, with
  another person's row returning **0 rows** (no existence leak), one application
  accepted and a second refused, direct inserts refused;
- directory access for active members only (non-member and lapsed member both
  refused), no email/phone in directory output, opt-in honoured by
  `get_alumni_profile`, hidden profiles unreachable;
- committee-only application/membership updates (member updates affect 0 rows),
  approval creating an active membership + member number + `member` role;
- `super_admin`-only role writes and no self-escalation (member insert refused,
  member self-promotion affects 0 rows, super admin cannot touch their own rows,
  last-super-admin removal refused);
- treasurer-only contribution reads and `record_contribution`, member direct
  insert refused;
- welfare: owner-only reads, executive queue including confidential rows, member
  cannot read another's request, owner cannot approve their own;
- append-only audit log: no insert policy, update/delete affect 0 rows,
  readable by executives only;
- every `SECURITY DEFINER` function pins `search_path`, all 15 frontend RPC
  signatures exist, `assert_rate_limit` and `bootstrap_super_admin` are not
  callable by API roles;
- rate limiting: 3 hits admitted and the 4th rejected for the primitive, the 4th
  mentorship request in the window rejected, the 6th contact message rejected,
  and a successful application consumes a slot;
- `supabase/seed.sql` applies to a fresh database and every row it writes is
  demo-labelled.

## Limits

- Single-tenant: one association, no per-chapter isolation.
- No column-level grants; row policies plus RPC shapes carry the guarantees.
- The harness proves policy behaviour, not Supabase's own infrastructure (JWT
  issuance, email confirmation, storage). The `gallery` bucket policies are
  included as a comment in `0007_rls_policies.sql` because `storage.objects`
  does not exist on plain PostgreSQL.
- The harness applies *every* file in `supabase/migrations`, so a later
  migration that changes these policies must be reflected in the matrix.
