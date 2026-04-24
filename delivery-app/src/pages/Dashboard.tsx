import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { supabase } from '../supabase'
import DeliveryMap from '../components/DeliveryMap'
import './Dashboard.css'

interface Order {
  id: string
  store_id?: string
  store_name?: string
  status: string
  created_at: string
}

interface OrderDetail extends Order {
  destination_lat?: number
  destination_lng?: number
  delivery_lat?: number
  delivery_lng?: number
  items?: Array<{
    id: string
    product_name: string
    price: number
    quantity: number
  }>
}

const statusLabel: Record<string, string> = {
  pending: '⏳ Pendiente',
  Creado: '⏳ Creado',
  Aceptada: '✅ Aceptada',
  accepted: '✅ Aceptada',
  'Listo para recoger': '📦 Listo para recoger',
  'En entrega': '🚗 En entrega',
  preparing: '🧑‍🍳 Preparando',
  ready: '🛵 Lista para recoger',
  Entregado: '🎉 Entregado',
  delivered: '🎉 Entregada',
  declined: '❌ Rechazada'
}

export default function Dashboard() {
  const [available, setAvailable] = useState<Order[]>([])
  const [accepted, setAccepted] = useState<Order[]>([])
  const [tab, setTab] = useState<'available' | 'accepted'>('available')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  const [activeDelivery, setActiveDelivery] = useState<OrderDetail | null>(null)
  const [delivered, setDelivered] = useState(false)
  const [isNearDestination, setIsNearDestination] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!activeDelivery) return

    const channel = supabase.channel(`order:${activeDelivery.id}`)
    
    channel.on('broadcast', { event: 'order-status-update' }, (payload) => {
      const { status } = payload.payload
      setActiveDelivery(prev => prev ? { ...prev, status } : null)
      loadData()
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeDelivery?.id])

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

  const acceptOrder = async (orderId: string) => {
    try {
      await api.patch(`/api/orders/${orderId}/accept`)
      const res = await api.get(`/api/orders/${orderId}`)
      const orderData = res.data
      setActiveDelivery(orderData)
      setIsMinimized(false)
      setSelectedOrder(null)
      setOrderDetail(null)
      setDelivered(false)
      loadData()

      // Notificar a la tienda del cambio de estado
        if (orderData.store_id) {
          const storeChannel = supabase.channel(`store:${orderData.store_id}`)
          storeChannel.send({
            type: 'broadcast',
            event: 'order-status-update',
            payload: { orderId, status: 'En entrega' }
          })
        }

       // Notificar al consumidor
        const orderChannel = supabase.channel(`order:${orderId}`)
        orderChannel.send({
          type: 'broadcast',
          event: 'order-accepted',
          payload: { orderId, status: 'En entrega' }
        })
    } catch (err) {
      console.error('Error al aceptar orden:', err)
    }
  }

  const closeModal = () => {
    setSelectedOrder(null)
    setOrderDetail(null)
  }

  const handleArrival = (arrived: boolean) => {
    setIsNearDestination(arrived)
  }

  const markAsDelivered = async () => {
    if (!activeDelivery) return
    try {
      await api.patch(`/api/orders/${activeDelivery.id}/status`, { status: 'Entregado' })
      
      // Notificar a todos vía Broadcast
      const orderChannel = supabase.channel(`order:${activeDelivery.id}`)
      await orderChannel.send({
        type: 'broadcast',
        event: 'order-delivered',
        payload: {}
      })
      supabase.removeChannel(orderChannel)

      if (activeDelivery.store_id) {
        const storeChannel = supabase.channel(`store:${activeDelivery.store_id}`)
        await storeChannel.send({
          type: 'broadcast',
          event: 'order-status-update',
          payload: { orderId: activeDelivery.id, status: 'Entregado' }
        })
        supabase.removeChannel(storeChannel)
      }

      setDelivered(true)
      loadData()
      setTimeout(() => {
        setActiveDelivery(null)
        setDelivered(false)
        setIsNearDestination(false)
      }, 3000)
    } catch (err) {
      console.error('Error al marcar como entregado:', err)
    }
  }

  const resumeDelivery = (order: OrderDetail) => {
    setActiveDelivery(order)
    setIsMinimized(false)
    setSelectedOrder(null)
    setOrderDetail(null)
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="dashboard-container">

      
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

   
      {activeDelivery && (
        <div className={`active-delivery-card ${isMinimized ? 'minimized' : ''}`}>
          <div className="active-delivery-header">
            <h3 className="active-delivery-title">
              {isMinimized 
                ? `📦 Entrega en curso: #${activeDelivery.id.slice(0, 8)}`
                : `Entregando orden #${activeDelivery.id.slice(0, 8)}`}
            </h3>
            {!delivered && (
              <button
                className="btn-secondary"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? 'Ver mapa' : 'Minimizar'}
              </button>
            )}
          </div>

          {!isMinimized && (
            delivered ? (
              <div className="delivered-banner">
                🎉 ¡Entrega completada exitosamente!
              </div>
            ) : (
              <>
                {activeDelivery.destination_lat && activeDelivery.destination_lng ? (
                  <>
                    <DeliveryMap
                      orderId={activeDelivery.id}
                      status={activeDelivery.status}
                      destination={{
                        lat: activeDelivery.destination_lat,
                        lng: activeDelivery.destination_lng
                      }}
                      initialPosition={
                        activeDelivery.delivery_lat && activeDelivery.delivery_lng
                          ? { lat: activeDelivery.delivery_lat, lng: activeDelivery.delivery_lng }
                          : null
                      }
                      onArrival={handleArrival}
                    />
                    {isNearDestination && !delivered && (
                      <div className="delivery-actions">
                        <button className="btn-green full-width" onClick={markAsDelivered}>
                          🏁 Marcar como entregada
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="empty-msg">Esta orden no tiene destino registrado</p>
                )}
              </>
            )
          )}
        </div>
      )}

     
      {selectedOrder && orderDetail && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Detalle de orden</h3>
            <p className="modal-info">
              <strong>Tienda:</strong> {orderDetail.store_name}
            </p>
            <p className="modal-info">
              <strong>Estado:</strong> {statusLabel[orderDetail.status] || orderDetail.status}
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
              {orderDetail.status === 'Aceptada' && (
                <button
                  className="btn-green"
                  onClick={() => acceptOrder(orderDetail.id)}
                >
                  ✅ Aceptar y comenzar entrega
                </button>
              )}
              {(orderDetail.status === 'En entrega' || orderDetail.status === 'Listo para recoger') && (
                <button
                  className="btn-green"
                  onClick={() => resumeDelivery(orderDetail)}
                >
                  🚗 Reanudar entrega
                </button>
              )}
              <button className="btn-secondary" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      
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

     
      <div className="orders-list">
        {tab === 'available' && (
          available.length === 0
            ? <p className="empty-msg">No hay órdenes disponibles</p>
            : available.map(order => (
              <div key={order.id} className="item-card">
                <div className="item-info">
                  <p className="item-name">{order.store_name}</p>
                  <p className="item-status">{statusLabel[order.status] || order.status}</p>
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
                  <p className="item-status">{statusLabel[order.status] || order.status}</p>
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