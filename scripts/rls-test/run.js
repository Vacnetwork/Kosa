#!/usr/bin/env node
'use strict';

/**
 * KOSA RLS harness.
 *
 * Boots a throwaway PostgreSQL cluster (embedded-postgres, no root, no Docker),
 * installs a Supabase-shaped auth shim, applies supabase/migrations, loads test
 * fixtures, then runs the assertion matrix as anon / authenticated / owner
 * sessions. Exits 0 only when every assertion passes.
 */
const path = require('node:path');
const fs = require('node:fs');
const { Pool } = require('pg');
const {
  PROJECT_ROOT,
  SEED_FILE,
  findFreePort,
  bootCluster,
  connect,
  applySqlFile,
  applyMigrations,
  applyFixtures,
  applySeed,
  migrationFiles,
  tmpdir,
} = require('./lib/pg');
const { withSession } = require('./lib/harness');
const { buildTests } = require('./lib/assertions');

const RESET = '\u001b[0m';
const RED = '\u001b[31m';
const GREEN = '\u001b[32m';
const DIM = '\u001b[2m';
const BOLD = '\u001b[1m';

function line(text = '') {
  process.stdout.write(`${text}\n`);
}

async function seedCheck(port) {
  const name = 'seed.sql applies to a fresh database and is marked as demo';
  const database = 'kosa_seed';
  let client;
  try {
    client = await connect(port, 'postgres');
    await client.query(`create database ${database}`);
    await client.end();
    client = await connect(port, database);
    await applySqlFile(client, path.join(__dirname, 'sql', '000_shim.sql'));
    await applyMigrations(client);
    await applySeed(client);

    const events = Number((await client.query('select count(*) from public.events')).rows[0].count);
    const news = Number((await client.query('select count(*) from public.news_posts')).rows[0].count);
    const gallery = Number((await client.query('select count(*) from public.gallery_items')).rows[0].count);
    const contributions = Number((await client.query('select count(*) from public.contributions')).rows[0].count);
    const welfare = Number((await client.query('select count(*) from public.welfare_requests')).rows[0].count);
    const demoish = Number(
      (
        await client.query(
          `select count(*) from public.events where title ilike '%demo%' or summary ilike '%demo%'`,
        )
      ).rows[0].count,
    );
    if (!events || !news || !gallery || !contributions || !welfare) {
      return { name, ok: false, detail: `counts events=${events} news=${news} gallery=${gallery} contributions=${contributions} welfare=${welfare}` };
    }
    return {
      name,
      ok: demoish > 0,
      detail: `${events} events, ${news} news, ${gallery} gallery, ${contributions} contributions, ${welfare} welfare (demo-labelled)`,
    };
  } catch (err) {
    return { name, ok: false, detail: `seed failed: ${err.message}` };
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

async function main() {
  const started = Date.now();
  const port = await findFreePort();
  const dataDir = tmpdir();
  let server;
  let pool;
  let setupClient;

  line(`${BOLD}KOSA RLS harness${RESET} — login-free PostgreSQL policy proof`);
  line(`${DIM}project: ${PROJECT_ROOT}${RESET}`);

  try {
    server = await bootCluster({ port, databaseDir: dataDir });
    line(`${DIM}cluster: 127.0.0.1:${port} (temporary)${RESET}`);

    const setup = await connect(port, 'postgres');
    const version = (await setup.query('show server_version')).rows[0].server_version;
    line(`${DIM}server:  PostgreSQL ${version}${RESET}`);
    await setup.query('create database kosa_rls');
    await setup.end();

    const client = await connect(port, 'kosa_rls');
    setupClient = client;
    client.on('error', () => {});
    await applySqlFile(client, path.join(__dirname, 'sql', '000_shim.sql'));
    const migrations = await applyMigrations(client);
    await applyFixtures(client);
    line(`${DIM}migrations: ${migrations.length} files — ${migrations.join(', ')}${RESET}`);
    line(`${DIM}fixtures: 13 accounts (8 active members, 1 lapsed, 1 non-member, 1 applicant, 1 fresh, 1 officer)${RESET}`);
    line('');

    const seedResult = await seedCheck(port);

    pool = new Pool({ host: '127.0.0.1', port, user: 'postgres', password: 'postgres', database: 'kosa_rls', max: 4 });
    // Idle clients are killed when the cluster stops; that is expected teardown.
    pool.on('error', () => {});

    const results = [{ group: 'seed', name: seedResult.name, ok: seedResult.ok, detail: seedResult.detail }];
    line(`${BOLD}SEED${RESET}`);
    line(
      `   1. ${seedResult.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}  ${seedResult.name} ${DIM}(${seedResult.detail})${RESET}`,
    );
    const tests = buildTests();
    let group = null;
    for (const test of tests) {
      if (test.group !== group) {
        group = test.group;
        line(`${BOLD}${group.toUpperCase()}${RESET}`);
      }
      let outcome;
      try {
        outcome = await withSession(pool, test.session || {}, test.run);
      } catch (err) {
        outcome = { ok: false, detail: `harness error: ${err.message}` };
      }
      results.push({ group: test.group, name: test.name, ...outcome });
      const index = String(results.length).padStart(3, ' ');
      const mark = outcome.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
      line(` ${index}. ${mark}  ${test.name} ${DIM}(${outcome.detail})${RESET}`);
    }

    const passed = results.filter((r) => r.ok).length;
    const failed = results.length - passed;
    line('');
    line(`${BOLD}SUMMARY${RESET}`);
    line(`  assertions: ${results.length}`);
    line(`  passed:     ${passed}`);
    line(`  failed:     ${failed}`);
    line(`  duration:   ${((Date.now() - started) / 1000).toFixed(1)}s`);
    if (failed) {
      line('');
      line(`${RED}RESULT: FAIL — ${failed} of ${results.length} assertions failed${RESET}`);
      for (const r of results.filter((x) => !x.ok)) line(`  - [${r.group}] ${r.name}: ${r.detail}`);
      return 1;
    }
    line('');
    line(`${GREEN}RESULT: PASS — ${passed}/${results.length} assertions passed${RESET}`);
    line(`${DIM}seed file: ${SEED_FILE}${RESET}`);
    return 0;
  } catch (err) {
    line('');
    line(`${RED}RESULT: HARNESS ERROR — ${err.message}${RESET}`);
    if (process.env.DEBUG) line(err.stack || '');
    return 1;
  } finally {
    if (setupClient) await setupClient.end().catch(() => {});
    if (pool) await pool.end().catch(() => {});
    if (server) await server.stop().catch(() => {});
    if (!process.env.KEEP_DB) fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

main().then((code) => process.exit(code));
