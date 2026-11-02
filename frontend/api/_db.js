import pg from 'pg'
const { Pool } = pg

let pool

export function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      'postgresql://neondb_owner:npg_QRbrD92TEXlc@ep-quiet-salad-aobbi34o-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  }
  return pool
}

export async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Idea',
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time TEXT NOT NULL DEFAULT '10:00'
    )
  `)
}
