# Handover — maintaining this application

Written for the next developer who has to run, change or fix this site without
having built it.

## 1. What this app is

A public marketing site plus an alumni management platform for the Kakoma Old
Students Association (KOSA). Four surfaces:

| Surface | Route group | Who it is for | Data |
| --- | --- | --- | --- |
| Public site | `src/app/(site)` | anyone | published content, baked in at build time |
| Member portal | `src/app/(portal)` | approved members | live from Supabase, authorised by RLS |
| Administration | `src/app/(admin)` | role holders only | live from Supabase, authorised by RLS + SQL functions |
| Auth screens | `src/app/(auth)` | anyone signing in | Supabase Auth |

## 2. Getting it running

```bash
git clone <repo> && cd kosa-website
npm install
cp .env.example .env.local        # fill in Supabase URL + anon key
npm run dev                       # http://localhost:3000
npm run build                     # static export into ./out
npm run typecheck                 # tsc --noEmit
npm run lint                      # eslint
```

With no Supabase values set the site **still runs**: public pages fall back to
the demo fixtures in `src/content/demo.ts`, every demo value is labelled in the
UI, and the portal shows "backend not configured" states instead of pretending to
work. That fallback is deliberate — it is how the site is demonstrable before
credentials exist — so keep it working if you refactor the data layer.

## 3. Layout of the code

```
src/
  app/
    (site)/          public pages (server components, pre-rendered)
    (auth)/          register, login, recovery, callback
    (portal)/portal/ member dashboard and features
    (admin)/admin/   role-based administration
    layout.tsx       fonts, metadata, AuthProvider, toaster, JSON-LD
    globals.css      ALL design tokens (colours, type steps, margins, motion)
  components/
    home/            the homepage chapters (each section is one file)
    site/            header, footer, live clock
    ui/              Button, Field/Input/Textarea/Select/Checkbox, Notice,
                     DemoTag, EmptyState, Spinner, Table primitives
    motion/          Reveal (IntersectionObserver entrance), MaskedHeadline
    auth/            Turnstile widget
    admin/, portal/  surface-specific pieces
  content/demo.ts    demo fixtures + the photo credits
  lib/
    supabase.ts      browser client (anon key only)
    auth.tsx         session, profile, roles, membership, permissions
    api.ts           THE data contract — every read/write the app performs
    server-content.ts build-time reads for the public pages
    types.ts         row types mirroring the SQL schema
    validation.ts    every zod schema, shared by forms and by API calls
    format.ts        dates in Africa/Kampala, money, CSV
supabase/
  migrations/        numbered SQL — schema, RLS, functions, triggers, indexes
  seed.sql           clearly-labelled demo data
scripts/rls-test/    a real PostgreSQL harness that proves the policies
docs/                this folder
```

**Rule of thumb:** pages never call `supabase.from(...)` directly. If you need a
query, add it to `src/lib/api.ts` (or a `queries` module) so the RPC boundary
stays in one reviewable place.

## 4. Data model in one page

- `auth.users` — Supabase's own.
- `profiles` — one row per user; the public-facing facts (name, graduation year,
  profession, city, interests, bio).
- `profile_contacts` — email and phone, deliberately in a **separate table** so
  the directory can never leak them. Owner and administrators only.
- `membership_applications` — the queue the membership officer works through.
- `memberships` — the outcome: status (`pending`/`active`/`lapsed`/`suspended`),
  member number, year of completion.
- `user_roles` — `super_admin`, `membership_officer`, `event_manager`,
  `treasurer`, `member`. Only `super_admin` may change roles.
- `events` / `event_registrations`, `announcements`, `news_posts`,
  `gallery_items`, `welfare_requests`, `contributions`,
  `mentorship_offers` / `mentorship_requests`, `contact_messages`,
  `audit_logs`, `rate_limit_events`.

Directory access requires an `active` membership, is served by a
`SECURITY DEFINER` function (`search_alumni`) that returns only non-private
columns, and cannot be enumerated by anonymous or unverified users.
`docs/SECURITY-MODEL.md` has the full matrix, and `scripts/rls-test` proves it.

## 5. Common changes

| Task | Where |
| --- | --- |
| Change a colour, type size or margin | `src/app/globals.css` — tokens only, nothing hard-coded in components |
| Add a section to the homepage | new file in `src/components/home/`, then wire it in `home-chapters.tsx` |
| Add a page | new folder under `src/app/(site)/`, `export const metadata`, reuse the chapter idioms |
| Add a field to profiles | migration + `src/lib/types.ts` + form schema in `src/lib/validation.ts` + the form |
| Change who can approve members | `supabase/migrations` (role checks) and `ROLE_PERMISSIONS` in `src/lib/auth.tsx` |
| Replace the crest artwork | overwrite `public/brand/kosa-crest-round.png` (see `docs/DESIGN.md`) |
| Swap demo content for real content | insert rows through the admin dashboard, or replace `supabase/seed.sql` |
| Regenerate the "scan to join" QR (e.g. after the domain changes) | `npx qrcode -t svg -e M -w 512 -m 2 -d "#102B60" -l "#FFFFFF" -o public/brand/kosa-join-qr.svg "https://<host>/membership/"` (and the same with `-t png` for print). It is committed as an asset, so no dependency is added to the project |

## 6. Design constraints worth keeping

They come from the brief and from a design review pass; all are cheap to keep
and expensive to lose:

- Flat colour fields, hard edges, no gradients, no shadows at rest, no glass.
- Headings are titles, not sentences: two lines maximum at 390/768/1440px.
- Nothing meant to be read below 13px; body text 17–18px on public pages.
- One accent action per screen; one button shape (square corners).
- Photographs are real and credited. Never substitute an illustration for a photo
  of a real place or person.
- Demo content is always labelled in the UI. If you add fixtures, label them.

## 7. Testing

```bash
npm run typecheck        # types
npm run lint             # eslint
npm run test:rls         # boots a real PostgreSQL, applies migrations, asserts every policy
npm run build            # static export must succeed — this is the deploy gate
```

The RLS harness is the important one: it is the only automated proof that the
directory, welfare queue, contributions and audit log cannot be read by the wrong
person. Run it after **any** migration change.

## 8. Deploy

`docs/DEPLOYMENT.md`. Short version: `npm run build && npx wrangler pages deploy out
--project-name kosa-website`, or connect the repo in Pages and let pushes deploy.

## 9. What is not built yet

`docs/UNCONFIGURED.md` lists every integration that still needs a human: the
Supabase project, SMTP, Turnstile secrets, a custom domain, and the official crest
and contact details.
