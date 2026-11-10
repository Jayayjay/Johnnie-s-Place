import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed } from 'lucide-react'
import { BAR_LOCATION } from '../config'
import styles from './LocationPicker.module.css'

// divIcons avoid Leaflet's broken default marker-image paths under bundlers.
const dropIcon = L.divIcon({ className: 'jp-dropicon', html: '<span class="jp-pin"></span>', iconSize: [26, 26], iconAnchor: [13, 24] })
const barIcon = L.divIcon({ className: 'jp-baricon', html: '<span class="jp-bar">Bar</span>', iconSize: [44, 22], iconAnchor: [22, 11] })

function ClickCapture({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], Math.max(map.getZoom(), 14))
  }, [center?.lat, center?.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function LocationPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const center = value || BAR_LOCATION

  function useMyLocation() {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported on this device.'); return }
    setGeoError('')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => { setGeoError('Couldn\'t get your location — drop the pin manually.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <button type="button" className={styles.locate} onClick={useMyLocation} disabled={locating}>
          <LocateFixed size={16} /> {locating ? 'Locating…' : 'Use my location'}
        </button>
        <span className={styles.hint}>or tap the map / drag the pin</span>
      </div>

      <div className={styles.mapBox}>
        <MapContainer center={[center.lat, center.lng]} zoom={14} className={styles.map} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[BAR_LOCATION.lat, BAR_LOCATION.lng]} icon={barIcon} interactive={false} />
          {value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={dropIcon}
              draggable
              eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange({ lat: p.lat, lng: p.lng }) } }}
            />
          )}
          <ClickCapture onPick={onChange} />
          <Recenter center={value} />
        </MapContainer>
      </div>

      {geoError && <p className={styles.geoError}>{geoError}</p>}
      {value && (
        <p className={styles.coords}>
          Pin: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  )
}
