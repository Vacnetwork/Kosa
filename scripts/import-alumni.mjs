#!/usr/bin/env node
/**
 * Import the association's alumni register into public.alumni_roster.
 *
 * The committee keeps its register in a spreadsheet; this script takes a CSV
 * export of it (first_name,last_name,start_year,end_year,phone,notes — header
 * required, order free) and inserts the people that are not already there.
 *
 * It is deliberately a one-way, additive import:
 *   • existing rows are matched on (first name, last name, year of entry) and
 *     left untouched, so re-running it never duplicates anyone;
 *   • nothing is deleted — correcting or removing a person is a decision the
 *     committee makes in the register itself, where it is audited;
 *   • the file is NOT in the repository. Personal data does not belong in git;
 *     keep the CSV outside the checkout (or in a gitignored `data/` folder).
 *
 * Usage:
 *   node scripts/import-alumni.mjs --file ~/kosa-alumni.csv --dry-run
 *   SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/import-alumni.mjs --file ~/kosa-alumni.csv
 *
 * The service-role key is required because the table is readable only by the
 * committee; run this from a trusted machine, never in a browser.
 */

import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const next = args[index + 1];
  return next && !next.startsWith("--") ? next : true;
};

const file = flag("file");
const dryRun = Boolean(flag("dry-run", false));
const url = String(flag("url", process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "")).replace(/\/$/, "");
const key = String(flag("key", process.env.SUPABASE_SERVICE_ROLE_KEY || ""));

if (!file) {
  console.error("Missing --file <csv>.");
  process.exit(1);
}
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or pass --url/--key).");
  process.exit(1);
}

/** Minimal RFC-4180 CSV parser: quotes, escaped quotes, embedded newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((entry) => entry.some((cell) => cell.trim() !== ""));
}

const headers = (line) => line.map((cell) => cell.trim().toLowerCase().replace(/\s+/g, "_"));

function toInt(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number.parseInt(String(value).replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

const request = async (path, init = {}) => {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 400)}`);
  }
  return response;
};

const main = async () => {
  const text = await readFile(file, "utf8");
  const [headerRow, ...dataRows] = parseCsv(text);
  const cols = headers(headerRow);
  const pick = (row, name) => {
    const index = cols.indexOf(name);
    return index === -1 ? "" : (row[index] ?? "").trim();
  };

  const people = [];
  const skipped = [];
  for (const row of dataRows) {
    const first_name = pick(row, "first_name");
    const last_name = pick(row, "last_name");
    if (!first_name && !last_name) continue;
    const start_year = toInt(pick(row, "start_year"));
    const end_year = toInt(pick(row, "end_year"));
    const phone = pick(row, "phone") || null;
    const notes = pick(row, "notes") || null;
    if (start_year !== null && (start_year < 1950 || start_year > 2100)) {
      skipped.push(`${first_name} ${last_name}: start year ${start_year}`);
      continue;
    }
    if (start_year !== null && end_year !== null && end_year < start_year) {
      skipped.push(`${first_name} ${last_name}: end year before start year`);
      continue;
    }
    people.push({ first_name, last_name, start_year, end_year, phone, notes });
  }

  const existing = await (async () => {
    const found = [];
    let offset = 0;
    for (;;) {
      const response = await request(
        `alumni_roster?select=first_name,last_name,start_year&order=id&limit=1000&offset=${offset}`,
        { method: "GET", headers: { Prefer: "return=representation" } },
      );
      const batch = await response.json();
      found.push(...batch);
      if (batch.length < 1000) break;
      offset += 1000;
    }
    return found;
  })();

  const seen = new Set(
    existing.map((row) => `${row.first_name.toLowerCase()}|${row.last_name.toLowerCase()}|${row.start_year ?? 0}`),
  );
  const fresh = people.filter((person) => {
    const identity = `${person.first_name.toLowerCase()}|${person.last_name.toLowerCase()}|${person.start_year ?? 0}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });

  console.log(
    JSON.stringify(
      {
        file,
        url,
        rows_in_file: dataRows.length,
        valid_people: people.length,
        already_in_register: people.length - fresh.length,
        to_insert: fresh.length,
        skipped,
        dry_run: dryRun,
      },
      null,
      1,
    ),
  );
  if (dryRun || fresh.length === 0) return;

  for (let i = 0; i < fresh.length; i += 200) {
    const batch = fresh.slice(i, i + 200);
    await request("alumni_roster", { method: "POST", body: JSON.stringify(batch) });
    console.log(`inserted ${i + batch.length}/${fresh.length}`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
