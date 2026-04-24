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
  destination: Position
  onDelivered: () => void
}

const STEP = 0.00005 

function MapUpdater({ position }: { position: Position }) {
  const map = useMap()
  useEffect(() => {
    map.setView([position.lat, position.lng], map.getZoom())
  }, [position, map])
  return null
}

export default function DeliveryMap({ orderId, destination, onDelivered }: DeliveryMapProps) {
  const [position, setPosition] = useState<Position>(destination)
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPosition = useRef<Position>(destination)


  const updatePosition = async (pos: Position) => {
    try {
   
      const res = await api.patch(`/api/orders/${orderId}/position`, {
        lat: pos.lat,
        lng: pos.lng
      })

  
      const channel = supabase.channel(`order:${orderId}`)
      await channel.send({
        type: 'broadcast',
        event: 'position-update',
        payload: { lat: pos.lat, lng: pos.lng }
      })
      supabase.removeChannel(channel)

    
      if (res.data.arrived) {
  
        const deliveredChannel = supabase.channel(`order:${orderId}`)
        await deliveredChannel.send({
          type: 'broadcast',
          event: 'order-delivered',
          payload: {}
        })
        supabase.removeChannel(deliveredChannel)
        onDelivered()
      }
    } catch (err) {
      console.error('Error al actualizar posición:', err)
    }
  }


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let { lat, lng } = position

      switch (e.key) {
        case 'ArrowUp':    lat += STEP; break
        case 'ArrowDown':  lat -= STEP; break
        case 'ArrowLeft':  lng -= STEP; break
        case 'ArrowRight': lng += STEP; break
        default: return
      }

      e.preventDefault() 
      setPosition({ lat, lng })
      pendingPosition.current = { lat, lng }

      if (throttleRef.current) return

     
      throttleRef.current = setTimeout(() => {
        updatePosition(pendingPosition.current)
        throttleRef.current = null
      }, 1000)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (throttleRef.current) clearTimeout(throttleRef.current)
    }
  }, [position, orderId])

  return (
    <div>
      <div className="keyboard-hint">
        <p>Usa las teclas <strong>↑ ↓ ← →</strong> para moverte en el mapa</p>
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