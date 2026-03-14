const express = require('express')
require('dotenv').config()

const app = express()

// CORS manual - debe ir PRIMERO antes de cualquier otra cosa
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
  
  // Responder inmediatamente a peticiones preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/stores', require('./routes/stores'))
app.use('/api/products', require('./routes/products'))
app.use('/api/orders', require('./routes/orders'))

app.get('/', (req, res) => {
  res.json({ message: 'API Rappi Lab funcionando ✓' })
})

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`))
}

module.exports = app