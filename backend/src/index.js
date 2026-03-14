const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())
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