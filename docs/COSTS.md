# Cost model — free tier first

The brief requires that nothing is introduced which could generate a bill without
being documented and approved first. This is the current bill of materials.

**Current monthly cost: $0.00.** No paid service, plugin, subscription or
usage-based resource is enabled anywhere in this stack.

## What the build uses

| Service | Plan | Free allowance | What happens at the limit | Upgrade trigger |
| --- | --- | --- | --- | --- |
| **Cloudflare Pages** (hosting) | Free | Unlimited requests and bandwidth on static assets; 500 builds/month; 20,000 files per deployment; 25 MiB per file | A build fails until the next month, or the file/file-count limit is hit; the live site keeps serving | Only if you need >500 builds/month (Pro, $20/mo) — realistically never for a site this size |
| **Supabase** (Postgres + auth + storage) | Free | 2 active projects; 500 MB database; 1 GB file storage; 5 GB egress/month; 50,000 monthly active users; 500k edge-function invocations (unused here) | Writes fail when the database or storage quota is hit; the API stops serving at the egress cap until the next month | >500 MB of data, >1 GB of pictures, >5 GB/month egress, or >50k monthly active users → Pro, $25/mo |
| **Cloudflare Turnstile** (bot protection) | Free | Unlimited challenges, unlimited sites | n/a — there is no paid tier | None |
| **GitHub** (source control, private repo) | Free | Unlimited private repos; 2,000 Actions minutes/month (only if CI is added) | CI stops until the next month if Actions are used heavily | Only if CI minutes exceed 2,000/month |
| **Transactional email** — Supabase's built-in sender, or Resend free | Free | Supabase built-in: ~2 emails/hour, for project members first; Resend free: 3,000 emails/month, 100/day | Email stops for the period; auth emails bounce | Custom SMTP is needed for real member volumes: Resend free covers a 486-member association comfortably; beyond 3,000/month → $20/mo |
| **Fonts** (Manrope, Inter) | Open source (SIL OFL) | Self-hosted at build time by `next/font` | n/a | None |
| **Photographs** | Wikimedia Commons, CC BY-SA 4.0 | Free with credit (credit line is rendered in the footer and under each picture) | n/a | None |

## Deliberate non-choices (and why)

- **Cloudflare Workers / `@opennextjs/cloudflare`** — the obvious "run Next.js on
  Cloudflare" route. Not used: the Workers *free* plan gives 10 ms of CPU per
  request, which server-rendered Next.js pages routinely exceed, so the free tier
  is not a safe home for it. Pages + static export is unlimited and free. See
  `docs/DEPLOYMENT.md` for the full comparison.
- **Vercel Hobby** — free and Next-native, but Hobby is licensed for
  non-commercial use only and the association may later run paid events or
  merchandise through the same account. Documented as a fallback, not the target.
- **Supabase Pro, Cloudflare Pro, Sentry, PostHog, Mailchimp, Auth0, paid
  component libraries** — none are installed, imported or referenced.
- **No paid shadcn/ui blocks or templates** — the component layer is hand-written
  against Radix primitives (MIT) and `class-variance-authority` (Apache-2.0).

## The only cost that is hard to avoid

A **custom domain** (e.g. `kosa.org`) costs roughly **$10–15 per year** from any
registrar. Nothing in this build requires it: the site runs on the free
`*.pages.dev` hostname, and a custom domain can be attached later at the
Cloudflare dashboard with no code change (only `NEXT_PUBLIC_SITE_URL` changes and
a rebuild).

## Before anyone turns on a paid resource

1. Write down which limit is being hit, with the actual number (database MB,
   egress GB, emails sent).
2. Check the free alternative first: prune old pictures from storage, archive
   audit rows to CSV, move cover images to smaller WebP sizes.
3. Only then enable a paid plan, and record the date, the plan, the price and who
   approved it in this file.
