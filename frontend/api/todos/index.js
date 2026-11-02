import { getPool, ensureTable } from '../_db.js'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const pool = getPool()
  await ensureTable(pool)

  try {
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT id, title, description, category, to_char(date, 'YYYY-MM-DD') as date,
               start_time, end_time, done, created_at
        FROM todos
        ORDER BY id
      `)
      return res.status(200).json(result.rows || [])
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
      const { title, description = '', category = 'Idea', date, start_time = '09:00', end_time = '10:00' } = body

      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' })
      }

      const taskDate = date || new Date().toISOString().slice(0, 10)

      const result = await pool.query(`
        INSERT INTO todos (title, description, category, date, start_time, end_time, done)
        VALUES ($1, $2, $3, $4, $5, $6, false)
        RETURNING id, title, description, category, to_char(date, 'YYYY-MM-DD') as date,
                  start_time, end_time, done, created_at
      `, [title.trim(), description.trim(), category, taskDate, start_time, end_time])

      return res.status(201).json(result.rows[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API Error in /api/todos:', err)
    return res.status(500).json({ error: err.message })
  }
}
