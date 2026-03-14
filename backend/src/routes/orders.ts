import { Router, Request, Response } from 'express'
import pool from '../config/db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/', authenticateToken, requireRole('consumer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId, items } = req.body
  if (!storeId || !items?.length) {
    res.status(400).json({ error: 'storeId e items requeridos' })
    return
  }
  try {
    const orderResult = await pool.query(
      'INSERT INTO orders (consumer_id, store_id) VALUES ($1, $2) RETURNING *',
      [req.user!.id, storeId]
    )
    const order = orderResult.rows[0]
    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
        [order.id, item.productId, item.quantity]
      )
    }
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: 'Error al crear orden' })
  }
})

router.get('/my', authenticateToken, requireRole('consumer'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*, s.name as store_name FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.consumer_id = $1 ORDER BY o.created_at DESC`,
      [req.user!.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes' })
  }
})

router.get('/store', authenticateToken, requireRole('store'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeResult = await pool.query('SELECT id FROM stores WHERE user_id = $1', [req.user!.id])
    const storeId = storeResult.rows[0]?.id
    const result = await pool.query(
      'SELECT * FROM orders WHERE store_id = $1 ORDER BY created_at DESC',
      [storeId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes' })
  }
})

router.get('/available', authenticateToken, requireRole('delivery'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*, s.name as store_name FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.status = 'pending' ORDER BY o.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes disponibles' })
  }
})

router.get('/accepted', authenticateToken, requireRole('delivery'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE delivery_id = $1 ORDER BY created_at DESC',
      [req.user!.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes aceptadas' })
  }
})

router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id])
    const order = orderResult.rows[0]
    if (!order) {
      res.status(404).json({ error: 'Orden no encontrada' })
      return
    }
    const itemsResult = await pool.query(
      `SELECT oi.*, p.name as product_name, p.price FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [req.params.id]
    )
    res.json({ ...order, items: itemsResult.rows })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener orden' })
  }
})

router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body
  try {
    let result
    if (status === 'accepted' && req.user!.role === 'delivery') {
      result = await pool.query(
        'UPDATE orders SET status = $1, delivery_id = $2 WHERE id = $3 RETURNING *',
        [status, req.user!.id, req.params.id]
      )
    } else {
      result = await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, req.params.id]
      )
    }
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

export default router