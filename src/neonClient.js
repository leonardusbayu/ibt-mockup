import { Pool } from 'pg'
import dotenv from 'dotenv'
import QueryStream from 'pg-query-stream'

dotenv.config()

if (!process.env.DATABASE_URL) throw new Error('Missing env var: DATABASE_URL')
if (!process.env.NETLIFY_ENV) throw new Error('Missing env var: NETLIFY_ENV')

const {
  DATABASE_URL,
  NODE_ENV = 'development',
  DB_MAX_POOL_SIZE = '10',
  DB_IDLE_TIMEOUT_MS = '30000',
  DB_CONNECTION_TIMEOUT_MS = '2000'
} = process.env

const poolConfig = {
  connectionString: DATABASE_URL,
  max: parseInt(DB_MAX_POOL_SIZE, 10),
  idleTimeoutMillis: parseInt(DB_IDLE_TIMEOUT_MS, 10),
  connectionTimeoutMillis: parseInt(DB_CONNECTION_TIMEOUT_MS, 10),
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}

let pool

export function connect() {
  if (!pool) {
    pool = new Pool(poolConfig)
    pool.on('error', err => {
      console.error('Unexpected error on idle client', err)
    })
  }
  return pool
}

export async function disconnect() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export async function query(text, params = []) {
  const db = connect()
  const start = Date.now()
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await db.query(text, params)
      const duration = Date.now() - start
      console.info('Executed query', { text, duration, rowCount: res.rowCount })
      return res
    } catch (error) {
      lastError = error
      console.warn(`Query attempt ${attempt} failed`, error)
      const backoff = Math.pow(2, attempt) * 100
      await new Promise(r => setTimeout(r, backoff))
    }
  }
  console.error('All query attempts failed', lastError)
  throw lastError
}

export async function transaction(callback) {
  const db = connect()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function streamQuery(text, params = []) {
  const db = connect()
  const client = await db.connect()
  try {
    const stream = client.query(new QueryStream(text, params))
    stream.on('end', () => {
      client.release()
    })
    return stream
  } catch (error) {
    client.release()
    throw error
  }
}