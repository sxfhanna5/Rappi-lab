import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Orders.css'

interface Order {
  id: string
  store_name: string
  status: string
  created_at: string
}

const statusLabel: Record<string, string> = {
  pending: '⏳ Pendiente',
  accepted: '✅ Aceptada',
  preparing: '🚗 En camino',
  ready: '📦 Lista para recoger',
  delivered: '🎉 Entregada',
  declined: '❌ Rechazada'
}

export default function Orders() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [orders, setOrders] = useState<Order[]>([])
  const navigate = useNavigate()

  useEffect(() => {
  api.get('/api/orders/my').then(res => setOrders(res.data))

  const interval = setInterval(() => {
    api.get('/api/orders/my').then(res => setOrders(res.data))
  }, 10000)

  return () => clearInterval(interval)
}, [])

 return (
  <div className="orders-container">
    <div className="orders-header">
      <div className="orders-header-left">
        <h2 className="orders-title">Mis órdenes</h2>
        <p className="orders-greeting">Hola, <span className="orders-greeting-name">{user.name}</span></p>
      </div>
      <div className="orders-header-right">
        <button className="btn-secondary-orders" onClick={() => navigate('/stores')}>
          ← Volver a tiendas
        </button>
      </div>
    </div>

    {orders.length === 0
      ? <p className="empty-msg-centered">No tienes órdenes aún</p>
      : orders.map(order => (
          <div key={order.id} className="order-card">
            <p className="order-store">{order.store_name}</p>
            <p className="order-status">{statusLabel[order.status] || order.status}</p>
            <p className="order-date">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        ))
    }
  </div>
)
}
