import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import api from '../api'
import { supabase } from '../supabase'


const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})


const deliveryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

L.Marker.prototype.options.icon = defaultIcon

interface Position {
  lat: number
  lng: number
}

interface DeliveryMapProps {
  orderId: string
  status: string
  destination: Position
  initialPosition?: Position | null
  onArrival: (arrived: boolean) => void
}

const STEP = 0.00005 

function MapUpdater({ position }: { position: Position }) {
  const map = useMap()
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom())
  }, [position, map])
  return null
}

export default function DeliveryMap({ orderId, status, destination, initialPosition, onArrival }: DeliveryMapProps) {
  // Si no hay posición inicial, empezamos en el centro de Cali (o cerca del destino pero no en él)
  const defaultPos = initialPosition || { lat: 3.4516, lng: -76.5320 }
  
  const [position, setPosition] = useState<Position>(defaultPos)
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const positionRef = useRef<Position>(defaultPos)
  const pendingPosition = useRef<Position>(defaultPos)
  const channelRef = useRef<any>(null)
  const canMoveRef = useRef(status === 'Listo para recoger')

  // Sincronizar los refs
  useEffect(() => {
    canMoveRef.current = status === 'Listo para recoger'
    console.log('¿Puede moverse? (Ref):', canMoveRef.current, 'Estado:', status)
  }, [status])

  useEffect(() => {
    positionRef.current = position
  }, [position])

  // Solo para la UI
  const canMoveUI = status === 'Listo para recoger'

  // Inicializar el canal de Supabase una sola vez
  useEffect(() => {
    console.log('Iniciando canal para orden:', orderId)
    const channel = supabase.channel(`order:${orderId}`)
    
    channel.subscribe((status) => {
      console.log('Estado de suscripción del canal:', status)
    })

    channelRef.current = channel

    return () => {
      console.log('Limpiando canal para orden:', orderId)
      supabase.removeChannel(channel)
    }
  }, [orderId])

  const updatePosition = async (pos: Position) => {
    try {
      console.log('Intentando actualizar posición en BD y Broadcast:', pos)
      // 1. Actualizar en BD
      const res = await api.patch(`/api/orders/${orderId}/position`, {
        lat: pos.lat,
        lng: pos.lng
      })

      // 2. Emitir broadcast a Supabase
      if (channelRef.current) {
        console.log('Emitiendo posición vía Broadcast:', pos)
        channelRef.current.send({
          type: 'broadcast',
          event: 'position-update',
          payload: { lat: pos.lat, lng: pos.lng }
        })
      }

      // 3. Notificar llegada
      onArrival(res.data.arrived)
    } catch (err) {
      console.error('Error al actualizar posición:', err)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        console.log('Flecha detectada:', e.key, '¿Puede moverse?:', canMoveRef.current)
      }

      if (!canMoveRef.current) return

      let { lat, lng } = positionRef.current

      switch (e.key) {
        case 'ArrowUp':    lat += STEP; break
        case 'ArrowDown':  lat -= STEP; break
        case 'ArrowLeft':  lng -= STEP; break
        case 'ArrowRight': lng += STEP; break
        default: return
      }

      e.preventDefault() 
      const newPos = { lat, lng }
      setPosition(newPos)
      pendingPosition.current = newPos

      if (throttleRef.current) return

      throttleRef.current = setTimeout(() => {
        updatePosition(pendingPosition.current)
        throttleRef.current = null
      }, 1000)
    }

    console.log('Registrando listener de teclado')
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      console.log('Eliminando listener de teclado')
      window.removeEventListener('keydown', handleKeyDown)
      if (throttleRef.current) clearTimeout(throttleRef.current)
    }
  }, [orderId]) // Solo depende de orderId para ser estable

  return (
    <div>
      <div className="keyboard-hint">
        {!canMoveUI ? (
          <p className="status-warning">⏳ Espera a que el restaurante marque el pedido como <strong>"Listo para recoger"</strong> para empezar a moverte.</p>
        ) : (
          <p>Usa las teclas <strong>↑ ↓ ← →</strong> para moverte en el mapa</p>
        )}
      </div>
      <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', marginTop: '0.75rem' }}>
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={17}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

         
          <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
            <Popup>📍 Punto de entrega</Popup>
          </Marker>

      
          <Marker position={[position.lat, position.lng]} icon={deliveryIcon}>
            <Popup>🚗 Tu posición</Popup>
          </Marker>

          <MapUpdater position={position} />
        </MapContainer>
      </div>
    </div>
  )
}