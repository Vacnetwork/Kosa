'use strict';

/**
 * Boots a throwaway PostgreSQL cluster, applies the Supabase auth shim, the
 * project migrations and the harness fixtures. Nothing here is imported by the
 * app: it is a test-only runner.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { Client } = require('pg');
const EmbeddedPostgres = require('embedded-postgres').default;

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'supabase', 'migrations');
const SEED_FILE = path.join(PROJECT_ROOT, 'supabase', 'seed.sql');
const SQL_DIR = path.join(__dirname, '..', 'sql');

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function bootCluster({ port, databaseDir }) {
  const server = new EmbeddedPostgres({
    databaseDir,
    port,
    user: 'postgres',
    password: 'postgres',
    persistent: false,
    onLog: () => {},
    onError: (err) => {
      const text = String(err && err.message ? err.message : err);
      if (!/already running|terminating/i.test(text)) process.stderr.write(`[postgres] ${text}\n`);
    },
  });
  await server.initialise();
  await server.start();
  return server;
}

async function connect(port, database) {
  const client = new Client({ host: '127.0.0.1', port, user: 'postgres', password: 'postgres', database });
  // Large policies make for long single statements; keep the default timeouts.
  await client.connect();
  return client;
}

async function applySqlFile(client, file) {
  const sql = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('commit');
  } catch (err) {
    await client.query('rollback').catch(() => {});
    err.message = `${name}: ${err.message}`;
    throw err;
  }
}

function migrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => path.join(MIGRATIONS_DIR, f));
}

async function applyMigrations(client) {
  const files = migrationFiles();
  for (const file of files) await applySqlFile(client, file);
  return files.map((f) => path.basename(f));
}

async function applyFixtures(client) {
  await applySqlFile(client, path.join(SQL_DIR, '900_fixtures.sql'));
}

async function applySeed(client) {
  await applySqlFile(client, SEED_FILE);
}

module.exports = {
  PROJECT_ROOT,
  MIGRATIONS_DIR,
  SEED_FILE,
  SQL_DIR,
  findFreePort,
  bootCluster,
  connect,
  applySqlFile,
  applyMigrations,
  applyFixtures,
  applySeed,
  migrationFiles,
  tmpdir: () => fs.mkdtempSync(path.join(os.tmpdir(), 'kosa-rls-')),
};
