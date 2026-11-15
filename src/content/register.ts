/**
 * The association's alumni register, as counts.
 *
 * These are AGGREGATES ONLY, a year of completion and how many people the
 * association has for it. No names, no phone numbers: personal data belongs in
 * the database (`public.alumni_roster`, readable by the committee alone), never
 * in this repository.
 *
 * The live figures come from `alumni_roster_stats()` / `alumni_roster_totals()`
 * when a backend is configured. This file is the fallback for a build with no
 * backend, so the public page can still say how many alumni the register holds.
 *
 * Regenerate it after an import:
 *   node scripts/import-alumni.mjs --file <csv> --dry-run   (check the rows)
 *   psql "$SUPABASE_DB_URL" -c "select * from alumni_roster_stats()" > stats.csv
 */
import type { RosterTotals, RosterYear } from "@/lib/types";

export const REGISTER_TOTALS: RosterTotals = {
  alumni: 218,
  years: 41,
  with_phone: 141,
  earliest: 1967,
  latest: 2025,
  unplaced: 6,
};

export const REGISTER_YEARS: RosterYear[] = [
  { year: 2025, alumni: 1, with_phone: 1 },
  { year: 2019, alumni: 1, with_phone: 1 },
  { year: 2018, alumni: 1, with_phone: 1 },
  { year: 2016, alumni: 1, with_phone: 1 },
  { year: 2014, alumni: 4, with_phone: 4 },
  { year: 2013, alumni: 1, with_phone: 0 },
  { year: 2012, alumni: 1, with_phone: 1 },
  { year: 2011, alumni: 5, with_phone: 4 },
  { year: 2010, alumni: 1, with_phone: 1 },
  { year: 2009, alumni: 1, with_phone: 0 },
  { year: 2008, alumni: 2, with_phone: 2 },
  { year: 2007, alumni: 1, with_phone: 1 },
  { year: 2006, alumni: 7, with_phone: 7 },
  { year: 2005, alumni: 1, with_phone: 1 },
  { year: 2004, alumni: 7, with_phone: 2 },
  { year: 2003, alumni: 2, with_phone: 2 },
  { year: 2002, alumni: 6, with_phone: 5 },
  { year: 2001, alumni: 1, with_phone: 1 },
  { year: 2000, alumni: 1, with_phone: 1 },
  { year: 1998, alumni: 7, with_phone: 6 },
  { year: 1997, alumni: 15, with_phone: 10 },
  { year: 1996, alumni: 7, with_phone: 6 },
  { year: 1995, alumni: 7, with_phone: 5 },
  { year: 1994, alumni: 9, with_phone: 7 },
  { year: 1993, alumni: 8, with_phone: 4 },
  { year: 1992, alumni: 6, with_phone: 4 },
  { year: 1991, alumni: 4, with_phone: 1 },
  { year: 1990, alumni: 2, with_phone: 2 },
  { year: 1989, alumni: 12, with_phone: 10 },
  { year: 1988, alumni: 14, with_phone: 9 },
  { year: 1987, alumni: 24, with_phone: 12 },
  { year: 1986, alumni: 9, with_phone: 5 },
  { year: 1985, alumni: 4, with_phone: 3 },
  { year: 1984, alumni: 10, with_phone: 3 },
  { year: 1983, alumni: 2, with_phone: 0 },
  { year: 1982, alumni: 6, with_phone: 5 },
  { year: 1981, alumni: 1, with_phone: 0 },
  { year: 1980, alumni: 6, with_phone: 2 },
  { year: 1979, alumni: 12, with_phone: 4 },
  { year: 1968, alumni: 1, with_phone: 1 },
  { year: 1967, alumni: 1, with_phone: 1 },
];
