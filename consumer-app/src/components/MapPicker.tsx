import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'


import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})
L.Marker.prototype.options.icon = defaultIcon

interface Position {
  lat: number
  lng: number
}

interface MapPickerProps {
  position: Position | null
  onSelect: (pos: Position) => void
}


function ClickHandler({ onSelect }: { onSelect: (pos: Position) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

export default function MapPicker({ position, onSelect }: MapPickerProps) {

  const center: [number, number] = position
    ? [position.lat, position.lng]
    : [3.4516, -76.5320]

  return (
    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <ClickHandler onSelect={onSelect} />
        {position && (
          <Marker position={[position.lat, position.lng]} />
        )}
      </MapContainer>
    </div>
  )
}