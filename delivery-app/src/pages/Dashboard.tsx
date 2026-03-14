import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import './Dashboard.css'

interface Order {
  id: string
  store_name?: string
  status: string
  created_at: string
}

interface OrderDetail extends Order {
  items?: Array<{
    id: string
    product_name: string
    price: number
    quantity: number
  }>
}

const statusLabel: Record<string, string> = {
  pending: '⏳ Pendiente',
  accepted: 'En camino',
  preparing: 'Preparando',
  ready: 'Lista para recoger',
  delivered: '✅ Entregada',
  declined: 'Rechazada'
}

export default function Dashboard() {
  const [available, setAvailable] = useState<Order[]>([])
  const [accepted, setAccepted] = useState<Order[]>([])
  const [tab, setTab] = useState<'available' | 'accepted'>('available')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
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

  const viewDetail = async (orderId: string) => {
    setSelectedOrder(orderId)
    const res = await api.get(`/api/orders/${orderId}`)
    setOrderDetail(res.data)
  }

  const updateStatus = async (orderId: string, status: string) => {
    await api.patch(`/api/orders/${orderId}/status`, { status })
    setSelectedOrder(null)
    setOrderDetail(null)
    loadData()
  }

  const closeModal = () => {
    setSelectedOrder(null)
    setOrderDetail(null)
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">

      {/* Header igual que Consumer y Store */}
      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <h2 className="dashboard-title">Mis entregas</h2>
          <p className="dashboard-greeting">
            Hola, <span className="dashboard-greeting-name">{user.name}</span>
          </p>
        </div>
        <div className="dashboard-header-right">
          <button className="btn-secondary" onClick={logout}>Salir</button>
        </div>
      </div>

      {/* Modal detalle */}
      {selectedOrder && orderDetail && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Detalle de orden</h3>
            <p className="modal-info">
              <strong>Estado:</strong> {statusLabel[orderDetail.status]}
            </p>
            <p className="modal-info">
              <strong>Fecha:</strong> {new Date(orderDetail.created_at).toLocaleString()}
            </p>
            <h4 className="modal-items-title">Productos</h4>
            {orderDetail.items?.map(item => (
              <div key={item.id} className="modal-item">
                <span>{item.product_name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
              </div>
            ))}
            <div className="modal-actions">
              {orderDetail.status === 'pending' && (
                <>
                  <button className="btn-green" onClick={() => updateStatus(selectedOrder, 'accepted')}>
                    Aceptar
                  </button>
                  <button className="btn-red" onClick={() => updateStatus(selectedOrder, 'declined')}>
                    Rechazar
                  </button>
                </>
              )}
              {orderDetail.status === 'ready' && (
                <button className="btn-green" onClick={() => updateStatus(selectedOrder, 'delivered')}>
                  Marcar como entregada
                </button>
              )}
              <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'available' ? 'active' : ''}`}
          onClick={() => setTab('available')}
        >
          Disponibles ({available.length})
        </button>
        <button
          className={`tab ${tab === 'accepted' ? 'active' : ''}`}
          onClick={() => setTab('accepted')}
        >
          Mis órdenes ({accepted.length})
        </button>
      </div>

      {/* Lista */}
      <div className="orders-list">
        {tab === 'available' && (
          available.length === 0
            ? <p className="empty-msg">No hay órdenes disponibles</p>
            : available.map(order => (
              <div key={order.id} className="item-card">
                <div className="item-info">
                  <p className="item-name">{order.store_name}</p>
                  <p className="item-status">{statusLabel[order.status]}</p>
                  <p className="item-date">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <button className="btn-black" onClick={() => viewDetail(order.id)}>
                  Ver detalle
                </button>
              </div>
            ))
        )}

        {tab === 'accepted' && (
          accepted.length === 0
            ? <p className="empty-msg">No tienes órdenes aceptadas</p>
            : accepted.map(order => (
              <div key={order.id} className="item-card">
                <div className="item-info">
                  <p className="item-name">Orden #{order.id.slice(0, 8)}</p>
                  <p className="item-status">{statusLabel[order.status]}</p>
                  <p className="item-date">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <button className="btn-black" onClick={() => viewDetail(order.id)}>
                  Ver detalle
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  )
}