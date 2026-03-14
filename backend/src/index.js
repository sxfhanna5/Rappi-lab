const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Lista de dominios permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'https://rappi-lab-consumer.vercel.app',
  'https://rappi-lab-store.vercel.app',
  'https://rappi-lab-delivery.vercel.app'
]

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('No permitido por CORS'))
    }
  },
  credentials: true
}))

app.use(express.json())

// Rutas
app.use('/api/auth', require('./routes/auth'))
app.use('/api/stores', require('./routes/stores'))
app.use('/api/products', require('./routes/products'))
app.use('/api/orders', require('./routes/orders'))

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Rappi Lab funcionando ✓' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})