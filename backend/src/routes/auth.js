const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, storeName } = req.body

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }

  if (role === 'store' && !storeName) {
    return res.status(400).json({ error: 'El nombre de la tienda es requerido' })
  }

  try {
    // Verificar si el email ya existe
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    )
    const user = userResult.rows[0]

    // Si es tienda, crear la tienda asociada
    if (role === 'store') {
      await pool.query(
        'INSERT INTO stores (name, user_id) VALUES ($1, $2)',
        [storeName, user.id]
      )
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' })
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

module.exports = router