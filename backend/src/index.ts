import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
  if (req.method === 'OPTIONS') return res.status(200).end()
  next()
})

app.use(express.json())

import authRoutes from './routes/auth'
import storeRoutes from './routes/stores'
import productRoutes from './routes/products'
import orderRoutes from './routes/orders'

app.use('/api/auth', authRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'API Rappi Lab funcionando ✓' })
})

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`))
}

export default app