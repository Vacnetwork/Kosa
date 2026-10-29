'use strict';

/**
 * Session runner: every assertion opens its own connection, switches into the
 * role PostgREST would use (`SET LOCAL role anon|authenticated`), sets the JWT
 * claims the app's helpers read, and rolls back unless the test opts into a
 * commit (needed for the rate limiter, whose ledger must outlive a statement).
 */

const PERMISSION_CODES = new Set(['42501', '42P01', '3F000']);

function isPermissionError(err) {
  if (!err) return false;
  if (PERMISSION_CODES.has(err.code)) return true;
  return /permission denied|row-level security/i.test(err.message || '');
}

function api(client) {
  return {
    query: (sql, params) => client.query(sql, params),
    rows: async (sql, params) => (await client.query(sql, params)).rows,
    one: async (sql, params) => (await client.query(sql, params)).rows[0],
    scalar: async (sql, params) => {
      const res = await client.query(sql, params);
      if (!res.rows.length) return null;
      return res.rows[0][Object.keys(res.rows[0])[0]];
    },
    count: async (sql, params) => Number(await api(client).scalar(sql, params)),
    exec: async (sql, params) => (await client.query(sql, params)).rowCount,
    try: async (sql, params) => {
      try {
        const res = await client.query(sql, params);
        return { ok: true, rows: res.rows, rowCount: res.rowCount };
      } catch (error) {
        return { ok: false, error, rows: [], rowCount: 0 };
      }
    },
  };
}

async function withSession(pool, session, fn) {
  const client = await pool.connect();
  const commit = Boolean(session.commit);
  try {
    if (commit) {
      if (session.role) await client.query(`set role ${session.role}`);
      await client.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(session.claims || {})]);
    } else {
      await client.query('begin');
      if (session.role) await client.query(`set local role ${session.role}`);
      await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(session.claims || {})]);
    }
    return await fn(api(client));
  } finally {
    try {
      if (commit) {
        await client.query('reset role');
        await client.query("select set_config('request.jwt.claims', '', false)");
      } else {
        await client.query('rollback');
      }
    } catch {
      /* the connection is discarded by pg if the server died */
    }
    client.release();
  }
}

const pass = (detail) => ({ ok: true, detail });
const fail = (detail) => ({ ok: false, detail });

/** Select must return exactly `expected` rows. */
function expectRows(name, session, sql, params, expected) {
  return {
    name,
    session,
    run: async (c) => {
      const rows = await c.rows(sql, params);
      return rows.length === expected
        ? pass(`${rows.length} row(s)`)
        : fail(`expected ${expected} row(s), got ${rows.length}`);
    },
  };
}

/** Select must be blocked: either zero rows or a permission/RLS error. */
function expectBlocked(name, session, sql, params) {
  return {
    name,
    session,
    run: async (c) => {
      try {
        const res = await c.query(sql, params);
        return res.rows.length === 0
          ? pass('0 rows (RLS filtered)')
          : fail(`leaked ${res.rows.length} row(s): ${JSON.stringify(res.rows[0]).slice(0, 160)}`);
      } catch (err) {
        return isPermissionError(err)
          ? pass(`blocked (${err.code}: ${short(err.message)})`)
          : fail(`unexpected error ${err.code}: ${err.message}`);
      }
    },
  };
}

/** Statement must fail, optionally with a message matching `pattern`. */
function expectError(name, session, sql, params, pattern) {
  return {
    name,
    session,
    run: async (c) => {
      try {
        const res = await c.query(sql, params);
        return fail(`expected an error, statement succeeded (${res.rowCount} rows)`);
      } catch (err) {
        if (pattern && !pattern.test(err.message)) {
          return fail(`error did not match ${pattern}: ${short(err.message)}`);
        }
        return pass(`rejected (${err.code}: ${short(err.message)})`);
      }
    },
  };
}

/** UPDATE/DELETE must affect exactly `expected` rows. */
function expectAffected(name, session, sql, params, expected) {
  return {
    name,
    session,
    run: async (c) => {
      try {
        const affected = await c.exec(sql, params);
        return affected === expected
          ? pass(`${affected} row(s) affected`)
          : fail(`expected ${expected} row(s) affected, got ${affected}`);
      } catch (err) {
        return fail(`unexpected error ${err.code}: ${err.message}`);
      }
    },
  };
}

/** Statement must succeed. */
function expectOk(name, session, sql, params) {
  return {
    name,
    session,
    run: async (c) => {
      try {
        const res = await c.query(sql, params);
        return pass(`accepted (${res.rowCount} row(s))`);
      } catch (err) {
        return fail(`rejected: ${err.code} ${short(err.message)}`);
      }
    },
  };
}

function short(message) {
  return String(message || '').replace(/\s+/g, ' ').slice(0, 120);
}

module.exports = { api, withSession, isPermissionError, pass, fail, expectRows, expectBlocked, expectError, expectOk, expectAffected, short };
