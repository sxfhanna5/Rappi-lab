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
  accepted: '🚗 Aceptada',
  preparing: '👨‍🍳 Preparando',
  ready: '✅ Lista',
  delivered: '📦 Entregada',
  declined: '❌ Rechazada'
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/orders/my').then(res => setOrders(res.data))
  }, [])

  return (
    <div className="orders-container">
      <button className="back-btn" onClick={() => navigate('/stores')}>← Volver a tiendas</button>
      <h2 className="orders-title">📋 Mis órdenes</h2>
      {orders.length === 0 && <p className="empty-msg">No tienes órdenes aún</p>}
      {orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span className="order-store">🏪 {order.store_name}</span>
            <span className="order-status">{statusLabel[order.status] || order.status}</span>
          </div>
          <p className="order-date">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}