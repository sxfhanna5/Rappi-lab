import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const statusLabel = {
  pending: '⏳ Pendiente',
  accepted: '🚗 Aceptada',
  preparing: '👨‍🍳 Preparando',
  ready: '✅ Lista',
  delivered: '📦 Entregada',
  declined: '❌ Rechazada'
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/api/orders/my').then(res => setOrders(res.data))
  }, [])

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={() => navigate('/stores')}>← Volver a tiendas</button>
      <h2 style={styles.title}>📋 Mis órdenes</h2>
      {orders.length === 0 && <p style={{ color: '#999' }}>No tienes órdenes aún</p>}
      {orders.map(order => (
        <div key={order.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.storeName}>🏪 {order.store_name}</span>
            <span style={styles.status}>{statusLabel[order.status] || order.status}</span>
          </div>
          <p style={styles.date}>{new Date(order.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

const styles = {
  container: { maxWidth: '700px', margin: '0 auto', padding: '2rem' },
  back: { background: 'none', border: 'none', color: '#FF6B35', cursor: 'pointer', fontSize: '1rem', marginBottom: '1rem', padding: 0 },
  title: { margin: '0 0 1.5rem', fontSize: '1.5rem' },
  card: { background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '1rem' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  storeName: { fontWeight: '600', fontSize: '1rem' },
  status: { fontSize: '0.9rem', color: '#555' },
  date: { margin: '0.5rem 0 0', color: '#999', fontSize: '0.85rem' }
}