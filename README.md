# KOSA — Kakoma Old Students Association

Website and alumni management platform for the Kakoma Old Students Association
(Uganda). **United by Our Past, Committed to Our Future.** — Connect, Support,
Empower.

Free-tier-first and open source throughout: Next.js 16 (static export) +
TypeScript on Cloudflare Pages, Supabase Free for Postgres/auth/storage,
Cloudflare Turnstile for bot protection, GitHub for source control.
**Running cost: $0** (see `docs/COSTS.md`).

## What is in here

- **Public site** — home, about, membership, events, news & stories, welfare &
  projects, gallery, contact, with SEO metadata, sitemap, robots and JSON-LD.
- **Member portal** — registration, email verification, password recovery,
  membership application, profile and visibility controls, alumni directory,
  event RSVP and history, announcements, welfare requests, mentorship.
- **Administration** — role-based dashboards (super admin, membership officer,
  event manager, treasurer), application approvals, member management, event
  publishing, announcements, gallery, contribution records, reports with CSV
  exports, and an audit log.
- **Security** — every table behind Row Level Security, private contact details in
  a separate table, directory access restricted to active members, all privileged
  actions in `SECURITY DEFINER` functions, and a local PostgreSQL harness that
  proves each policy (`npm run test:rls`).

## Quick start

```bash
npm install
cp .env.example .env.local     # Supabase URL + anon key (optional — runs in demo mode without)
npm run dev
```

Without Supabase credentials the site builds and runs with clearly-labelled demo
content, and the portal/admin screens state that the backend is not configured
rather than pretending to work.

## Documentation

| File | What it covers |
| --- | --- |
| `docs/HANDOVER.md` | Setup, code layout, data model, common changes, testing |
| `docs/DEPLOYMENT.md` | Hosting decision record, deploy steps, backups, recovery runbook |
| `docs/COSTS.md` | Every service, its free allowance, limits and upgrade triggers |
| `docs/DESIGN.md` | Design system, tokens, photography, replacing the crest |
| `docs/SECURITY-MODEL.md` | Table-by-table access rules and what the harness proves |
| `docs/UNCONFIGURED.md` | What still needs a human, and what it costs |

## Scripts

```bash
npm run dev        # development server
npm run build      # static export to ./out (the deploy gate)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test:rls   # boot PostgreSQL, apply migrations, assert every RLS policy
```

## Licence

Application code: MIT. Photographs: CC BY-SA 4.0 / CC0 via Wikimedia Commons,
credited in the footer and beside each picture. Fonts: Manrope and Inter, SIL Open
Font License.
