import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'


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

interface Position {
  lat: number
  lng: number
}

interface TrackingMapProps {
  destination: Position
  deliveryPosition: Position | null
}


function MapUpdater({ position }: { position: Position | null }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom())
    }
  }, [position, map])
  return null
}

export default function TrackingMap({ destination, deliveryPosition }: TrackingMapProps) {
  const center: [number, number] = deliveryPosition
    ? [deliveryPosition.lat, deliveryPosition.lng]
    : [destination.lat, destination.lng]

  return (
    <div style={{ height: '350px', borderRadius: '8px', overflow: 'hidden', marginTop: '1rem' }}>
      <MapContainer
        center={center}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {}
        <Marker position={[destination.lat, destination.lng]} icon={defaultIcon}>
          <Popup>📍 Tu punto de entrega</Popup>
        </Marker>

        {}
        {deliveryPosition && (
          <Marker position={[deliveryPosition.lat, deliveryPosition.lng]} icon={deliveryIcon}>
            <Popup>🚗 Repartidor</Popup>
          </Marker>
        )}

        <MapUpdater position={deliveryPosition} />
      </MapContainer>
    </div>
  )
}