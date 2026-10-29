# Verification — what was actually run, and what it proved

Everything below was executed against real software, not simulated. Dates are the
build date; re-run the commands at any time.

## 1. Database and access control

Two independent harnesses, because they prove different things.

| What | Command | Result |
| --- | --- | --- |
| Schema, RLS policies, functions, triggers — asserted directly in PostgreSQL | `npm run test:rls` (`scripts/rls-test/run.sh`, boots a portable PostgreSQL 17, no Docker, no root) | **145 / 145 assertions PASS**, exit code 0 |
| The same policies through the real HTTP path the browser uses — PostgREST + GoTrue + JWTs | a development-time local Supabase-compatible stack (PostgreSQL + GoTrue + PostgREST behind a proxy), 26 assertions | **26 / 26 assertions PASS** |

The second harness signs real users up through GoTrue, gets real JWTs, and calls
PostgREST exactly as the app does. What it asserted, and saw:

| Assertion | Observed |
| --- | --- |
| An anonymous visitor can read published events / news / gallery | allowed |
| An anonymous visitor cannot read any profile | 0 rows |
| A signed-in user sees only their own profile row | 1 row |
| A member can submit one membership application | created |
| The directory is closed before approval | refused / empty |
| A member cannot approve an application | refused (SQL function raises) |
| A membership officer can approve an application | allowed |
| Approval activates membership with a member number | `KOSA-2004-0006` |
| An active member can search the directory | 17 members returned |
| Directory rows carry no email or phone | no such columns |
| Contact details only when the member opted in | withheld by default |
| An unapproved signed-in user cannot enumerate members | refused |
| A member cannot write a contribution directly | 0 rows / refused |
| A member cannot grant themselves a role | refused |
| A member cannot call the bootstrap grant | refused (`bootstrap_super_admin` revoked) |
| A member cannot forge an audit entry | refused |
| A plain member cannot read the audit log; an officer can | 0 rows vs rows |
| An anonymous visitor can send a contact message | created |
| Repeat submissions are rate limited | rejected on the 4th |
| A plain member cannot publish an announcement | refused |

A real vulnerability was found by this work and fixed: the first version of
`bootstrap_super_admin` (migration 0013) checked `current_user`, which inside a
`SECURITY DEFINER` function is the owner — so the guard never fired and any
signed-in user could have granted `super_admin`. Migration
`0014_harden_bootstrap.sql` replaces the body (session/JWT check) and revokes the
function from `anon` and `authenticated`; both harnesses now assert a member is
refused.

## 2. The application, in a browser

The production static build (`out/`) was served and driven in Chromium against the
local Supabase-compatible backend. The full membership journey was executed
through the UI, not the API:

1. `/register/` — created an account (full name, email, password, confirmation).
2. Redirected to `/portal/` — dashboard correctly said *"You have not applied for
   membership yet"* and *"An account is not a membership"*.
3. `/portal/application/` — submitted the application (graduation year 2004,
   year note, motivation, declaration).
4. `/portal/directory/` — **locked**: *"The directory is for approved members"*.
5. Signed in as an officer → `/admin/applications/` — the application appeared with
   the applicant's year note and motivation, plus Approve / Request more
   information / Reject.
6. Clicked *Approve* → inline confirm → *Approve and activate* → the database
   recorded the decision, issued member number `KOSA-2004-0006`, set the membership
   to `active`, granted the `member` role and wrote the audit row.
7. Signed back in as the member → `/portal/directory/` — **unlocked**: *"Alumni
   directory … Showing 1–17 of 17 members"*, with the status banner showing the new
   member number. See `docs/proof-directory.png`.

Console output during the journey: no application errors (only dev-server HMR
websocket noise and the deliberate CORS probe of the local proxy).

Also exercised in the browser: the gallery year filter, the contact form's
validation and mailto fallback, the anonymous RSVP notice on an event page, the
`/welfare/#bursary-fund` anchor from the homepage, and the admin section behind a
non-admin account.

## 3. Build and design gate

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npm run build` (static export) | 41 HTML artefacts; 35 routes pre-rendered, both `[slug]` routes generated from content; `_headers` copied by `postbuild` |
| Design inspector (`inspect.mjs`, 1440 / 768 / 390) | homepage 1 FAIL (the hero's clipped duplicate of the headline is reported as "covered text" — it is an `aria-hidden` copy of the *same* words, the direction's signature seam effect, not hidden content); `/membership/` **0 FAIL**; `/about/` 0 FAIL after moving a demo label |
| Remaining WARNs, and why they stand | *no-footage*: no honest clip of the association exists and unrelated footage would misrepresent it. *size-count / grey-body*: secondary notes use the muted ink at 6.9:1, above AA. *card-rows* on the projects list: deliberate tabular comparison, not decorative cards |

## 4. Live deployment

- `https://kosa-website.pages.dev` — Cloudflare Pages, static export, HTTP 200,
  ~84 KB HTML, imagery served as WebP from the same origin.
- `public/_headers` is deployed, so CSP, HSTS, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy` and immutable caching for
  `/_next/static/*` are applied by Cloudflare.
- `robots.txt` and `sitemap.xml` are generated at build time.

## 5. Reproducing this

`npm run test:rls` ships in the repository and re-runs the 145 schema/RLS
assertions anywhere Node 22 runs — no Docker, no root, no network.

The second harness (GoTrue + PostgREST through a proxy, and the browser journey
above) was a development-time tool: it downloaded the GoTrue and PostgREST release
binaries, pointed the app at them, and drove Chromium. It is **not vendored** in
this repository, because it exists to verify the build once rather than to run in
CI. To repeat it, stand up any Supabase-compatible endpoint (a hosted Supabase
project is the obvious one), set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, run the migrations, and walk the same seven steps.

## 6. What was **not** verified, honestly

- **A hosted Supabase project.** No Supabase credentials existed in this
  environment, so the schema was proved against PostgreSQL 17 with a faithful
  `auth` shim and against GoTrue + PostgREST locally. Differences to expect on
  hosted Supabase: its own grants/roles, its `storage` schema (bucket policies are
  supplied as SQL comments and untested), and email delivery through its mailer.
- **Real email delivery.** Verification and recovery emails were exercised with the
  local GoTrue set to auto-confirm; sending actual mail needs SMTP configured
  (`docs/UNCONFIGURED.md` §2).
- **Turnstile under load.** A free widget exists and the app sends
  `captchaToken`; the secret must be pasted into Supabase before the challenge is
  enforced.
- **Long-run concurrency** of the rate limiter (single-threaded assertions only).
