# Deployment, hosting decision, backups and recovery

## 1. Hosting decision record

The brief asked for Next.js, and asked for the hosting target to be evaluated
rather than assumed. Three realistic free options were compared.

| Option | Next.js support | Free-plan fit | Verdict |
| --- | --- | --- | --- |
| **Cloudflare Pages + static export** (`output: 'export'`) | Full for pre-rendered pages; no SSR, no route handlers, no middleware, no ISR | Unlimited requests and bandwidth; 500 builds/month; 20k files | **Chosen** |
| Cloudflare Workers + `@opennextjs/cloudflare` | Near-full Next.js (SSR, server actions) | 100k requests/day but **10 ms CPU per request** on the free plan — Next.js SSR regularly exceeds it | Rejected: a free plan that throttles real pages is worse than no SSR at all |
| Vercel Hobby | Full Next.js | Generous, but the Hobby plan is licensed for non-commercial use | Documented fallback only |

### What the chosen target means for the architecture

There is no server in the deployment. Therefore:

- **All authorisation is enforced in PostgreSQL** by Row Level Security and
  `SECURITY DEFINER` functions (`supabase/migrations`, proven by
  `scripts/rls-test`). The browser only ever holds the anon key.
- **UI guards are cosmetic.** `RequireAuth`/`RequireMember` and the admin `can()`
  checks improve the experience; they are not the security boundary and the code
  says so where it matters.
- **Public content is baked in at build time.** Publishing an event or a story
  makes it appear in the member portal immediately, and on the public pages after
  the next deployment. Wire a Cloudflare **deploy hook** (free) to a "rebuild"
  button or a daily cron if that lag matters.
- Member-facing data (profile, directory, RSVP, welfare, admin queues) is fetched
  live in the browser from Supabase, so it is never stale.

## 2. First deployment, step by step

Assumes the repository is cloned and `npm install` has been run.

```bash
# 1. Create the Supabase project (free plan), then:
#    SQL Editor → run every file in supabase/migrations in numeric order
#    SQL Editor → optionally run supabase/seed.sql (demo data)
#    Settings → API → copy the Project URL and anon key into .env.local
cp .env.example .env.local

# 2. Point auth emails at the deployed origin
#    Authentication → URL configuration:
#      Site URL:            https://kosa-website.pages.dev
#      Redirect URLs:       https://kosa-website.pages.dev/auth/callback/
#                           https://kosa-website.pages.dev/auth/reset-password/
#                           http://localhost:3000/auth/callback/

# 3. Turnstile (free): create a widget for your domains, then
#    .env.local  NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>
#    Supabase → Authentication → Attack protection → enable Turnstile,
#    paste the <secret key>. (Rotate the secret if it is ever exposed.)

# 4. Build and deploy the static export
npm run build            # writes ./out
npx wrangler pages deploy out --project-name kosa-website
```

Then in the Cloudflare dashboard: **Workers & Pages → kosa-website → Settings**
and add the same environment variables, so rebuilds from a Git connection also
produce a correct build.

### Git-connected deploys (recommended once the repo is live)

Pages → Create application → Connect to Git → select the repo →
build command `npm run build`, output directory `out`, framework preset *None*.
Every push to `main` deploys. Rollback is a button in the deployment list.

### Custom domain

Pages → Custom domains → add the domain, follow the DNS instructions. Free
hosting stays free; only the domain registration costs money (~$10–15/year,
`docs/COSTS.md`).

## 3. Environment variables

See `.env.example`. Only `NEXT_PUBLIC_*` values reach the browser, and only the
anon key and the Turnstile site key are meant to. The service-role key, the
Turnstile secret and the database URL are for local scripts and CI, never for the
frontend bundle.

## 4. Supabase configuration that the app expects

| Setting | Value |
| --- | --- |
| Email confirmations | **On** (the flow assumes a verification email) |
| Site URL | your deployed origin |
| Redirect URLs | `/auth/callback/`, `/auth/reset-password/` on every origin used |
| Password minimum length | 10 |
| Leaked password protection | On |
| Turnstile | On, with the secret key |
| Storage bucket | `gallery`, public read, write restricted to admin roles (see migration comments) |
| Point-in-time recovery | Not on the free plan — hence the backup routine below |

Email delivery on the free plan is rate-limited (a handful of messages per hour).
For real member volumes, add **Resend free** (3,000/month) as Supabase custom
SMTP: Host `smtp.resend.com`, port 465, user `resend`, password = API key, from
`KOSA <no-reply@your-domain>` — the sending domain must be verified in Resend.

## 5. Backups

The free plan gives daily database backups for 7 days but **no** point-in-time
recovery, and free projects pause after a week without use. A backup you have not
restored is not a backup.

```bash
# Database (schema + data) — run weekly, keep the files off the laptop
pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges -Fc \
  -f "backups/kosa-$(date +%F).dump"

# Storage is not in pg_dump: mirror the gallery bucket
npx supabase storage cp -r ss:///gallery ./backups/gallery-$(date +%F) --experimental

# Every table also exports as CSV from the admin dashboard (reports section),
# which is the recovery path that does not need a developer.
```

Keep 8 weekly dumps and 3 monthly ones (a free Backblaze/B2 or Google Drive
folder is enough). Verification step: restore into a scratch Supabase project at
least once a quarter with

```bash
pg_restore --no-owner --no-privileges -d "$SCRATCH_DB_URL" backups/kosa-YYYY-MM-DD.dump
```

## 6. Recovery runbook

| Failure | Recovery |
| --- | --- |
| Bad deployment | Cloudflare Pages → Deployments → **Rollback** to the previous build (seconds, no rebuild) |
| Accidental data change | Restore the affected tables from the latest `pg_dump` into a scratch project, export the rows as CSV, re-import through the admin UI so the audit log records it |
| Supabase project paused (inactivity) | Dashboard → Restore project; data is intact, the site's member portal is down until then (public pages keep serving — they are static) |
| Lost Supabase keys | Settings → API → rotate the anon key, update `NEXT_PUBLIC_SUPABASE_ANON_KEY`, rebuild. Old JWTs stay valid until they expire |
| Turnstile secret leaked | Cloudflare → Turnstile → rotate, then update Supabase's auth settings |
| Domain loss | The `*.pages.dev` hostname still serves the site |
| Admin locked out | Another super admin grants the role (dashboard → roles). If there is only one and they lose access, restore `user_roles` from the newest dump with the service-role key |

## 7. What is still unconfigured

See `docs/UNCONFIGURED.md` — the honest list, with the exact steps and cost of each.
