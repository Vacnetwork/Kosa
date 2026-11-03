# The alumni register

The association keeps its own list of old students. It came to us as a
spreadsheet (`KAKOMA_SS_ALUMNI_REORGANISED.xlsx`, sheets *Alumni by Year*,
*Cohort Summary*, *Original Data*) and lives in the database as
`public.alumni_roster`.

## What it is, and what it is not

| | Membership register | Alumni register |
| --- | --- | --- |
| Who is in it | People who applied and were approved | People the committee wrote down |
| Account | Yes | No |
| Consent to be listed | Yes, with a directory visibility setting | No |
| Who can read the names | Signed-in members (directory rules) | The committee only |
| Published on the public site | Aggregate figures | Aggregate figures |

They are never merged. A person in the alumni register becomes a member only
when they join through `/register/` and an officer approves the application;
the importer does not create accounts.

## Privacy

- Names and telephone numbers are personal data. They are readable only by
  `super_admin` and `membership_officer` (`private.is_admin`), enforced by RLS
  in `supabase/migrations/0016_alumni_roster.sql`.
- The public site can call two functions, `alumni_roster_stats()` and
  `alumni_roster_totals()`, which return counts only — never a name.
- The CSV never enters the repository. Keep it outside the checkout or in
  `data/`, which `.gitignore` excludes.
- The import is additive. Nothing is deleted by a script; corrections are made
  in the admin screen, where they are recorded against the officer who made them.

## Importing

```bash
# 1. export the spreadsheet to CSV with these headers:
#    first_name,last_name,start_year,end_year,phone,notes
# 2. check what would happen, without writing anything
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/import-alumni.mjs --file ~/kosa-alumni.csv --dry-run
# 3. import
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/import-alumni.mjs --file ~/kosa-alumni.csv
```

Re-running is safe: people already in the register are matched on
(first name, last name, year of entry) and skipped.

## What the 2026 import left behind

From 219 rows in the committee's sheet:

- 218 people imported (one duplicate row — the same person recorded twice for
  1985 — was merged).
- 212 carry a year of completion; 41 year groups, 1967–2025.
- 6 people have no year at all in the source. They are imported with a null year
  rather than dropped, and the public page reports them as unplaced so the
  committee can fill the gap.
- 1 end year reads `19997` in the source. It was imported with a null completion
  year and a note saying so, rather than guessed.
- 141 people have a telephone number on file.

## After an import

`src/content/register.ts` holds the same counts as a fallback for builds with no
backend. Regenerate it from `alumni_roster_stats()` so the deployed site quotes
the current figures.
