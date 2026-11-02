import { getPool, ensureTable } from '../_db.js'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const { id } = req.query
  if (!id) {
    return res.status(400).json({ error: 'Missing id parameter' })
  }

  const pool = getPool()
  await ensureTable(pool)

  const workspace = (req.headers['x-workspace'] || req.query.workspace || 'default').toString().trim().toLowerCase()

  try {
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
      const { done } = body

      const result = await pool.query(`
        UPDATE todos
        SET done = $1
        WHERE id = $2 AND workspace = $3
        RETURNING id, title, description, category, to_char(date, 'YYYY-MM-DD') as date,
                  start_time, end_time, done, created_at, workspace
      `, [Boolean(done), id, workspace])

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Todo not found' })
      }
      return res.status(200).json(result.rows[0])
    }

    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM todos WHERE id = $1 AND workspace = $2', [id, workspace])
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('API Error in /api/todos/[id]:', err)
    return res.status(500).json({ error: err.message })
  }
}
