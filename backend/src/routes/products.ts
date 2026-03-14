import { Router, Request, Response } from 'express'
import pool from '../config/db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { storeId } = req.query
  if (!storeId) {
    res.status(400).json({ error: 'storeId requerido' })
    return
  }
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

router.post('/', authenticateToken, requireRole('store'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, price, description } = req.body
  if (!name || !price) {
    res.status(400).json({ error: 'Nombre y precio requeridos' })
    return
  }
  try {
    const storeResult = await pool.query('SELECT id FROM stores WHERE user_id = $1', [req.user!.id])
    const storeId = storeResult.rows[0]?.id
    if (!storeId) {
      res.status(404).json({ error: 'Tienda no encontrada' })
      return
    }
    const result = await pool.query(
      'INSERT INTO products (name, price, description, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, price, description, storeId]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

export default router