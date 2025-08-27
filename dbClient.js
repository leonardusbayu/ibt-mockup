/**
 * @module dbClient
 * @description
 * Database client module for Neon Postgres. Provides methods to connect, query,
 * run transactions, and close the pool. Validates required environment variables.
 *
 * Public API:
 *  - connect(): Acquire a client from the pool.
 *  - query(text: string, params?: any[]): Execute a parameterized SQL query.
 *  - withTransaction(fn: Function): Execute function within a transaction.
 *  - close(): Gracefully shut down the pool.
 *
 * Environment Variables:
 *  - DATABASE_URL: Connection string for the Postgres database (required).
 *  - NODE_ENV: Application environment ('development' | 'production') (required).
 *  - NETLIFY_ENV: Netlify environment ('dev' | 'prod' | others) (required).
 *  - DB_MAX_POOL_SIZE: Maximum number of clients in the pool (optional, default=10).
 *  - DB_IDLE_TIMEOUT: Idle timeout in ms (optional, default=30000).
 *  - DB_CONNECTION_TIMEOUT: Connection acquire timeout in ms (optional, default=2000).
 *
 * Usage Example:
 *   const db = require('./dbClient');
 *   await db.query('SELECT * FROM users WHERE id = $1', [userId]);
 *   await db.withTransaction(async (client) => {
 *     await client.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
 *   });
 *   await db.close();
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// I1: Environment variable integrity checks
if (!process.env.NETLIFY_ENV) {
  console.error('NETLIFY_ENV environment variable is not set.');
  process.exit(1);
}
if (!process.env.NODE_ENV) {
  console.error('NODE_ENV environment variable is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 10,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000
});

pool.on('error', (err) => {
  console.error('[dbClient] Unexpected error on idle client', err);
  process.exit(-1);
});

async function connect() {
  try {
    const client = await pool.connect();
    return client;
  } catch (err) {
    console.error('[dbClient] Error acquiring client', {
      message: err.message,
      code: err.code,
      name: err.name,
      type: 'ConnectionError'
    });
    throw err;
  }
}

async function query(text, params) {
  const start = process.hrtime();
  try {
    const res = await pool.query(text, params);
    const duration = process.hrtime(start);
    const ms = (duration[0] * 1e3) + (duration[1] / 1e6);
    console.log(`[dbClient] Query executed in ${ms.toFixed(3)}ms: ${text}`);
    return res;
  } catch (err) {
    console.error('[dbClient] Error executing query', {
      message: err.message,
      code: err.code,
      name: err.name,
      text,
      params,
      type: 'QueryError'
    });
    throw err;
  }
}

async function withTransaction(fn) {
  const client = await connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[dbClient] Transaction error, rolled back.', {
      message: err.message,
      code: err.code,
      name: err.name,
      type: 'TransactionError'
    });
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  try {
    await pool.end();
    console.log('[dbClient] Pool has been closed.');
  } catch (err) {
    console.error('[dbClient] Error closing pool', err);
  }
}

process.on('SIGINT', () => {
  close().then(() => process.exit(0));
});
process.on('SIGTERM', () => {
  close().then(() => process.exit(0));
});

module.exports = {
  connect,
  query,
  withTransaction,
  close
};