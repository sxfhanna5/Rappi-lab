import { Router, Response } from 'express'
import pool from '../config/db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tiendas' })
  }
})

router.get('/my', authenticateToken, requireRole('store'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM stores WHERE user_id = $1', [req.user!.id])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener tienda' })
  }
})

router.patch('/my/toggle', authenticateToken, requireRole('store'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'UPDATE stores SET is_open = NOT is_open WHERE user_id = $1 RETURNING *',
      [req.user!.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar tienda' })
  }
})

export default router