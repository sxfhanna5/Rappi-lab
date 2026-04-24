import { Router, Request, Response } from 'express'
import pool from '../config/db'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import { OrderStatus } from '../types/enums'

const router = Router()

router.post('/', authenticateToken, requireRole('consumer'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { storeId, items, destination } = req.body

  if (!storeId || !items?.length) {
    res.status(400).json({ error: 'storeId e items requeridos' })
    return
  }

  if (!destination?.lat || !destination?.lng) {
    res.status(400).json({ error: 'Destino de entrega requerido' })
    return
  }

  try {
    const orderResult = await pool.query(
      `INSERT INTO orders (consumer_id, store_id, status, destination)
       VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
       RETURNING *`,
      [req.user!.id, storeId, OrderStatus.CREATED, destination.lng, destination.lat]
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
    console.error(err)
    res.status(500).json({ error: 'Error al crear orden' })
  }
})

router.get('/my', authenticateToken, requireRole('consumer'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*,
        s.name as store_name,
        ST_Y(o.destination::geometry) as destination_lat,
        ST_X(o.destination::geometry) as destination_lng,
        ST_Y(o.delivery_position::geometry) as delivery_lat,
        ST_X(o.delivery_position::geometry) as delivery_lng
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.consumer_id = $1
       ORDER BY o.created_at DESC`,
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
      `SELECT o.*,
        ST_Y(o.destination::geometry) as destination_lat,
        ST_X(o.destination::geometry) as destination_lng
       FROM orders o
       WHERE o.store_id = $1
       ORDER BY o.created_at DESC`,
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
      `SELECT o.*,
        s.name as store_name,
        ST_Y(o.destination::geometry) as destination_lat,
        ST_X(o.destination::geometry) as destination_lng
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.status = $1
       ORDER BY o.created_at DESC`,
      [OrderStatus.ACCEPTED]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes disponibles' })
  }
})

router.get('/accepted', authenticateToken, requireRole('delivery'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*,
        s.name as store_name,
        ST_Y(o.destination::geometry) as destination_lat,
        ST_X(o.destination::geometry) as destination_lng
       FROM orders o
       JOIN stores s ON o.store_id = s.id
       WHERE o.delivery_id = $1
       ORDER BY o.created_at DESC`,
      [req.user!.id]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener órdenes aceptadas' })
  }
})

router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
 
    const orderResult = await pool.query(
      `SELECT *,
        ST_Y(destination::geometry) as destination_lat,
        ST_X(destination::geometry) as destination_lng,
        ST_Y(delivery_position::geometry) as delivery_lat,
        ST_X(delivery_position::geometry) as delivery_lng
       FROM orders WHERE id = $1`,
      [req.params.id]
    )
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
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

router.patch('/:id/accept', authenticateToken, requireRole('delivery'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Permitir aceptar si la orden está 'Aceptada', 'Preparando' o ya 'Lista para recoger'
    const result = await pool.query(
      'UPDATE orders SET delivery_id = $1 WHERE id = $2 AND (status = $3 OR status = $4 OR status = $5) RETURNING *',
      [req.user!.id, req.params.id, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY]
    )
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Orden no encontrada o no está disponible para entrega' })
      return
    }

    // Si el estado era 'Aceptada', cambiarlo a 'En entrega'
    // Si ya era 'Preparando' o 'Listo para recoger', mantener el estado actual para no interrumpir el flujo de la tienda
    if (result.rows[0].status === OrderStatus.ACCEPTED) {
      await pool.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        [OrderStatus.IN_DELIVERY, req.params.id]
      )
      result.rows[0].status = OrderStatus.IN_DELIVERY
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al aceptar orden' })
  }
})



router.patch('/:id/position', authenticateToken, requireRole('delivery'), async (req: AuthRequest, res: Response): Promise<void> => {
  const { lat, lng } = req.body

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat y lng requeridos' })
    return
  }

  try {
  
    await pool.query(
      `UPDATE orders 
       SET delivery_position = ST_SetSRID(ST_MakePoint($1, $2), 4326)
       WHERE id = $3`,
      [lng, lat, req.params.id]
    )

  
    const arrivalCheck = await pool.query(
      `SELECT id FROM orders
       WHERE id = $1
       AND delivery_position IS NOT NULL
       AND destination IS NOT NULL
       AND ST_DWithin(delivery_position, destination, 15)`,
      [req.params.id]
    )

 
    if (arrivalCheck.rows.length > 0) {
      res.json({ arrived: true })
      return
    }

    res.json({ arrived: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar posición' })
  }
})

export default router