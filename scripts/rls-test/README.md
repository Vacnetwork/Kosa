# RLS harness

Proves the policies in `supabase/migrations` behave as documented, without a
Supabase project, Docker, root or network access at run time.

```bash
./run.sh          # first run installs embedded-postgres (~60 MB binary)
npm test          # same thing, if dependencies are already installed
KEEP_DB=1 ./run.sh  # leave the throwaway cluster on disk for inspection
```

What it does:

1. boots a throwaway PostgreSQL 17 cluster via `embedded-postgres` on a free
   local port;
2. installs `sql/000_shim.sql` — the `anon`, `authenticated` and `service_role`
   roles plus an `auth` schema with `auth.users`, `auth.uid()`, `auth.jwt()`,
   `auth.role()` that read `current_setting('request.jwt.claims', true)`, which
   is exactly what PostgREST sets;
3. applies every `supabase/migrations/*.sql` in filename order;
4. loads `sql/900_fixtures.sql` (fake people, `.invalid` addresses);
5. applies `supabase/seed.sql` to a second, empty database to prove the demo
   seed runs;
6. runs `lib/assertions.js`: each case opens its own connection, does
   `SET LOCAL role anon|authenticated`, sets the JWT claims, runs the statement
   and rolls back — except the rate-limit cases, whose ledger must commit.

Layout:

| File | Purpose |
| --- | --- |
| `run.js` | orchestration, PASS/FAIL output, exit code |
| `lib/pg.js` | cluster boot, database creation, SQL file application |
| `lib/harness.js` | session runner and assertion helpers |
| `lib/assertions.js` | the assertion matrix, grouped by role |
| `sql/000_shim.sql` | Supabase auth shim (test-only, never deployed) |
| `sql/900_fixtures.sql` | fixture accounts and rows (test-only) |

Expectations are per assertion: `expectRows` for exact counts,
`expectBlocked` for "0 rows or permission denied", `expectError` for writes that
must raise, `expectAffected` for UPDATE/DELETE row counts. The exit code is 0
only when every assertion passes.
