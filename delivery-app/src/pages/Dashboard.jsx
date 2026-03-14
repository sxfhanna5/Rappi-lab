import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const statusLabel = {
  pending: '⏳ Pendiente',
  accepted: '🚗 Aceptada',
  preparing: '👨‍🍳 Preparando',
  ready: '✅ Lista para recoger',
  delivered: '📦 Entregada',
  declined: '❌ Rechazada'
}

export default function Dashboard() {
  const [available, setAvailable] = useState([])
  const [accepted, setAccepted] = useState([])
  const [tab, setTab] = useState('available')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [availRes, accRes] = await Promise.all([
      api.get('/api/orders/available'),
      api.get('/api/orders/accepted')
    ])
    setAvailable(availRes.data)
    setAccepted(accRes.data)
  }

  const viewDetail = async (orderId) => {
    setSelectedOrder(orderId)
    const res = await api.get(`/api/orders/${orderId}`)
    setOrderDetail(res.data)
  }

  const updateStatus = async (orderId, status) => {
    await api.patch(`/api/orders/${orderId}/status`, { status })
    setSelectedOrder(null)
    setOrderDetail(null)
    loadData()
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🚗 Delivery App</h2>
        <div style={styles.headerRight}>
          <span style={styles.userName}>Hola, {user.name}</span>
          <button style={styles.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </div>

      {/* Detalle de orden */}
      {selectedOrder && orderDetail && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>Detalle de orden</h3>
            <p style={styles.modalInfo}><strong>Estado:</strong> {statusLabel[orderDetail.status]}</p>
            <p style={styles.modalInfo}><strong>Fecha:</strong> {new Date(orderDetail.created_at).toLocaleString()}</p>
            <h4 style={styles.itemsTitle}>Productos:</h4>
            {orderDetail.items?.map(item => (
              <div key={item.id} style={styles.item}>
                <span>{item.product_name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div style={styles.modalActions}>
              {orderDetail.status === 'pending' && (
                <>
                  <button style={styles.acceptBtn} onClick={() => updateStatus(selectedOrder, 'accepted')}>
                    ✅ Aceptar
                  </button>
                  <button style={styles.declineBtn} onClick={() => updateStatus(selectedOrder, 'declined')}>
                    ❌ Rechazar
                  </button>
                </>
              )}
              {orderDetail.status === 'ready' && (
                <button style={styles.acceptBtn} onClick={() => updateStatus(selectedOrder, 'delivered')}>
                  📦 Marcar como entregada
                </button>
              )}
              <button style={styles.closeBtn} onClick={() => { setSelectedOrder(null); setOrderDetail(null) }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'available' ? styles.activeTab : {}) }}
          onClick={() => setTab('available')}>Disponibles ({available.length})</button>
        <button style={{ ...styles.tab, ...(tab === 'accepted' ? styles.activeTab : {}) }}
          onClick={() => setTab('accepted')}>Mis órdenes ({accepted.length})</button>
      </div>

      {/* Lista */}
      <div style={styles.list}>
        {tab === 'available' && (
          available.length === 0
            ? <p style={{ color: '#999' }}>No hay órdenes disponibles</p>
            : available.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderId}>🏪 {order.store_name}</span>
                  <span style={styles.orderStatus}>{statusLabel[order.status]}</span>
                </div>
                <p style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</p>
                <button style={styles.detailBtn} onClick={() => viewDetail(order.id)}>
                  Ver detalle y aceptar
                </button>
              </div>
            ))
        )}
        {tab === 'accepted' && (
          accepted.length === 0
            ? <p style={{ color: '#999' }}>No tienes órdenes aceptadas</p>
            : accepted.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderId}>Orden #{order.id.slice(0, 8)}</span>
                  <span style={styles.orderStatus}>{statusLabel[order.status]}</span>
                </div>
                <p style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</p>
                <button style={styles.detailBtn} onClick={() => viewDetail(order.id)}>
                  Ver detalle
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '800px', margin: '0 auto', padding: '2rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  headerRight: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.5rem' },
  userName: { color: '#666' },
  logoutBtn: { padding: '0.5rem 1rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  tab: { padding: '0.6rem 1.25rem', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: 'white', fontSize: '0.95rem' },
  activeTab: { background: '#1565C0', color: 'white', border: '1px solid #1565C0' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  orderCard: { background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  orderId: { fontWeight: '600' },
  orderStatus: { fontSize: '0.9rem', color: '#555' },
  orderDate: { color: '#999', fontSize: '0.85rem', margin: '0 0 0.75rem' },
  detailBtn: { padding: '0.5rem 1rem', background: '#1565C0', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalCard: { background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '450px', width: '90%' },
  modalTitle: { margin: '0 0 1rem', fontSize: '1.2rem' },
  modalInfo: { margin: '0 0 0.5rem', color: '#444' },
  itemsTitle: { margin: '1rem 0 0.5rem', fontSize: '1rem' },
  item: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' },
  modalActions: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' },
  acceptBtn: { padding: '0.6rem 1.25rem', background: '#2E7D32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  declineBtn: { padding: '0.6rem 1.25rem', background: '#c62828', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  closeBtn: { padding: '0.6rem 1.25rem', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }
}