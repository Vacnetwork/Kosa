# What still needs a human (and what it costs)

Nothing here is hidden behind a fake success state: where an integration is
missing, the app says so in the UI.

| # | Integration | Current state | What to do | Cost |
| --- | --- | --- | --- | --- |
| 1 | **Supabase project** | Not created — no credentials were available in this environment, so the app runs on the demo fixtures and the portal shows "backend not configured". The SQL, policies and functions are written and proved locally (`scripts/rls-test`). | Create a free project, run `supabase/migrations` in order, optionally `supabase/seed.sql`, then set `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` and rebuild | $0 (free plan) |
| 2 | **Transactional email** | Supabase's built-in sender is rate-limited (~2/hour) and reaches project members only until custom SMTP is configured. | Add Resend free as custom SMTP: verify the sending domain, then Supabase → Auth → SMTP with `smtp.resend.com:465`, user `resend`, password = API key | $0 up to 3,000/month, 100/day |
| 3 | **Turnstile secret** | A free Turnstile widget exists for `kosa-website.pages.dev` and `localhost`; its **site key** is in the build. The **secret** belongs in Supabase's auth settings, not in this repo. | Supabase → Authentication → Attack protection → enable Turnstile → paste the secret | $0 |
| 4 | **Custom domain** | The site runs on a free `*.pages.dev` hostname. | Register a domain, attach it in Pages → Custom domains, set `NEXT_PUBLIC_SITE_URL`, rebuild | ~$10–15/year — **the only unavoidable cost** |
| 5 | **Official KOSA crest** | Supplied and in place (`public/brand/`), used in the header, footer and app icon. | Nothing — replace the file only if the artwork is updated | $0 |
| 6 | **Official contact details** | Published from the association's own material: P.O. Box 123, Kakoma – Rakai District, Uganda · 0752328735 · info@kosa.or.ug · kosa.or.ug, and the Centenary bank / mobile-money payment details on the membership page. Still needed: a monitored inbox for `contact_messages` | Point `contact_messages` at an address the secretariat reads | $0 |
| 7 | **Real association records** | Demo data throughout, labelled. Events, stories, projects, year totals and pictures are sample content. The association's objectives, vision, mission, core values, membership categories, joining steps and payment details are the real published ones. | Import the real register through the officer/treasurer screens, or replace `supabase/seed.sql` | $0 |
| 8 | **First super administrator** | By design nobody can grant themselves `super_admin`. | After signing up, run once in the SQL editor: `select public.bootstrap_super_admin('your-email@example.com');` | $0 |
| 9 | **Rebuild-on-publish hook** | Public pages are pre-rendered, so new events and stories appear publicly after the next deployment. | Pages → Settings → Builds → Deploy hook; call it from a scheduled job or a button | $0 |
| 10 | **Backups** | No automated off-site backup on the free plan. | Follow `docs/DEPLOYMENT.md` §5 weekly | $0 (local/cloud drive) |
