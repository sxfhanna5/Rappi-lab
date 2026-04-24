import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { supabase } from '../supabase'
import TrackingMap from '../components/TrackingMap'
import './Orders.css'

interface Position {
  lat: number
  lng: number
}

interface Order {
  id: string
  store_name: string
  status: string
  created_at: string
  destination_lat?: number
  destination_lng?: number
  delivery_lat?: number
  delivery_lng?: number
}

const statusLabel: Record<string, string> = {
  pending: '⏳ Pendiente',
  Creado: '⏳ Creado',
  accepted: '✅ Aceptada',
  'En entrega': '🚗 En entrega',
  preparing: '🧑‍🍳 Preparando',
  ready: '📦 Lista para recoger',
  Entregado: '🎉 Entregado',
  delivered: '🎉 Entregada',
  declined: '❌ Rechazada'
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [deliveryPosition, setDeliveryPosition] = useState<Position | null>(null)
  const [arrived, setArrived] = useState(false)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    const res = await api.get('/api/orders/my')
    setOrders(res.data)
  }

  const loadOrderDetail = async (orderId: string) => {
    const res = await api.get(`/api/orders/${orderId}`)
    const order = res.data
    setSelectedOrder(order)

   
    if (order.delivery_lat && order.delivery_lng) {
      setDeliveryPosition({ lat: order.delivery_lat, lng: order.delivery_lng })
    }
  }

  
  useEffect(() => {
    if (!selectedOrder) return

    setArrived(false)
    setDeliveryPosition(null)

    
    const channel = supabase.channel(`order:${selectedOrder.id}`)

    channel.on('broadcast', { event: 'position-update' }, (payload) => {
      const { lat, lng } = payload.payload as Position
      setDeliveryPosition({ lat, lng })
    })

    channel.on('broadcast', { event: 'order-delivered' }, () => {
      setArrived(true)
      loadOrders()
    })

    channel.subscribe()

    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedOrder?.id])

  const closeDetail = () => {
    setSelectedOrder(null)
    setDeliveryPosition(null)
    setArrived(false)
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <div className="orders-header-left">
          <h2 className="orders-title">Mis órdenes</h2>
          <p className="orders-greeting">
            Hola, <span className="orders-greeting-name">{user.name}</span>
          </p>
        </div>
        <div className="orders-header-right">
          <button className="btn-secondary-orders" onClick={() => navigate('/stores')}>
            ← Volver a tiendas
          </button>
        </div>
      </div>

      
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="tracking-modal">
            <div className="tracking-header">
              <h3 className="tracking-title">Seguimiento de orden</h3>
              <button className="close-btn" onClick={closeDetail}>✕</button>
            </div>

            <p className="tracking-store">{selectedOrder.store_name}</p>
            <p className="tracking-status">
              {statusLabel[selectedOrder.status] || selectedOrder.status}
            </p>

            
            {arrived && (
              <div className="arrived-banner">
                🎉 ¡Tu repartidor ha llegado!
              </div>
            )}

            
            {selectedOrder.destination_lat && selectedOrder.destination_lng ? (
              <>
                <p className="map-hint">
                  {deliveryPosition
                    ? '🚗 El repartidor está en camino'
                    : '⏳ Esperando que el repartidor acepte la orden'}
                </p>
                <TrackingMap
                  destination={{
                    lat: selectedOrder.destination_lat,
                    lng: selectedOrder.destination_lng
                  }}
                  deliveryPosition={deliveryPosition}
                />
              </>
            ) : (
              <p className="map-hint">Esta orden no tiene punto de entrega registrado</p>
            )}
          </div>
        </div>
      )}

      
      {orders.length === 0
        ? <p className="empty-msg-centered">No tienes órdenes aún</p>
        : orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <p className="order-store">{order.store_name}</p>
              <p className="order-status">{statusLabel[order.status] || order.status}</p>
            </div>
            <p className="order-date">{new Date(order.created_at).toLocaleString()}</p>
            <button
              className="track-btn"
              onClick={() => loadOrderDetail(order.id)}
            >
              Ver seguimiento
            </button>
          </div>
        ))
      }
    </div>
  )
}