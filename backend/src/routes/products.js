const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const { authenticateToken, requireRole } = require('../middleware/auth')

// GET /api/products?storeId=xxx — productos de una tienda
router.get('/', authenticateToken, async (req, res) => {
  const { storeId } = req.query
  if (!storeId) return res.status(400).json({ error: 'storeId requerido' })
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE store_id = $1 ORDER BY created_at DESC',
      [storeId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// POST /api/products — solo stores pueden crear productos
router.post('/', authenticateToken, requireRole('store'), async (req, res) => {
  const { name, price, description } = req.body
  if (!name || !price) return res.status(400).json({ error: 'Nombre y precio requeridos' })
  try {
    const storeResult = await pool.query('SELECT id FROM stores WHERE user_id = $1', [req.user.id])
    const storeId = storeResult.rows[0]?.id
    if (!storeId) return res.status(404).json({ error: 'Tienda no encontrada' })

    const result = await pool.query(
      'INSERT INTO products (name, price, description, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, description, storeId]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

module.exports = router