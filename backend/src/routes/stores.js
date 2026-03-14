const express = require('express')
const router = express.Router()
const pool = require('../config/db')
const { authenticateToken, requireRole } = require('../middleware/auth')

// GET /api/stores — todos pueden ver las tiendas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tiendas' })
  }
})

// GET /api/stores/my — la tienda del usuario store logueado
router.get('/my', authenticateToken, requireRole('store'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE user_id = $1', [req.user.id])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tienda' })
  }
})

// PATCH /api/stores/my/toggle — abrir o cerrar tienda
router.patch('/my/toggle', authenticateToken, requireRole('store'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE stores SET is_open = NOT is_open WHERE user_id = $1 RETURNING *',
      [req.user.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tienda' })
  }
})

module.exports = router