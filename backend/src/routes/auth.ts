import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, storeName } = req.body

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'Todos los campos son requeridos' })
    return
  }

  if (role === 'store' && !storeName) {
    res.status(400).json({ error: 'El nombre de la tienda es requerido' })
    return
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'El email ya está registrado' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const userResult = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    )
    const user = userResult.rows[0]

    if (role === 'store') {
      await pool.query(
        'INSERT INTO stores (name, user_id) VALUES ($1, $2)',
        [storeName, user.id]
      )
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' })
    return
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if (!user) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      res.status(401).json({ error: 'Credenciales incorrectas' })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

export default router