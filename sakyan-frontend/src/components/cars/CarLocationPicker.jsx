import { useEffect, useState, useRef } from 'react'
import { Loader2, ChevronDown, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons broken by Vite asset bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── PSGC Data Cache (localStorage, 7-day TTL) ─────────────────────────────────
const PSGC = 'https://psgc.cloud/api'
const TTL  = 7 * 24 * 60 * 60 * 1000

async function psgcFetch(cacheKey, url) {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, expires } = JSON.parse(cached)
      if (Date.now() < expires) return data
    }
  } catch { /* corrupt cache — refetch */ }

  const data   = await fetch(url).then(r => r.json())
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data: sorted, expires: Date.now() + TTL }))
  } catch { /* storage full — skip caching */ }
  return sorted
}

// ── Auto-fly map to selected location ─────────────────────────────────────────
function MapFlyTo({ query, zoom }) {
  const map      = useMap()
  const lastQuery = useRef('')

  useEffect(() => {
    if (!query || query === lastQuery.current) return
    lastQuery.current = query
    fetch(
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({ q: query + ', Philippines', format: 'json', limit: 1 }),
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then(([result]) => {
        if (result) map.flyTo([+result.lat, +result.lon], zoom, { animate: true, duration: 1.2 })
      })
      .catch(() => {})
  }, [query])

  return null
}

// ── Fly to a specific lat/lng once (for edit pre-load) ────────────────────────
function MapFlyToPin({ lat, lng, zoom = 14 }) {
  const map   = useMap()
  const flown = useRef(false)

  useEffect(() => {
    if (flown.current || !lat || !lng) return
    flown.current = true
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 })
  }, [lat, lng])

  return null
}

// ── Click-to-pin handler ────────────────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

// ── Select dropdown helper ─────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder, loading, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full appearance-none border rounded-xl px-3 py-2.5 pr-9 text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition
                    ${disabled || loading
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-100 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer'
                    }`}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 size={14} className="text-brand-500 animate-spin" />
          : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * CarLocationPicker
 *
 * Props:
 *   onChange(address: string)           — called whenever the combined address string changes
 *   onCoordsChange(lat, lng)            — called when the user pins a location on the map
 *   error                               — validation error message string
 *   initialPin                          — optional { lat, lng } to pre-place the pin (Edit mode)
 */
export default function CarLocationPicker({ onChange, onCoordsChange, error, initialPin, initialAddress }) {
  const [provinces, setProvinces] = useState([])
  const [cities,    setCities]    = useState([])
  const [barangays, setBarangays] = useState([])

  const [province,  setProvince]  = useState('')
  const [city,      setCity]      = useState('')
  const [barangay,  setBarangay]  = useState('')

  const [loadingP, setLoadingP] = useState(true)
  const [loadingC, setLoadingC] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  const [pin,      setPin]      = useState(initialPin || null)
  const [pinLabel, setPinLabel] = useState('')

  const initPartsRef = useRef(null)

  // Pre-fetch reverse-geocode label and set state for an existing or async pin
  useEffect(() => {
    if (!initialPin?.lat || !initialPin?.lng) return
    if (!pin) setPin(initialPin)
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${initialPin.lat}&lon=${initialPin.lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then(d => setPinLabel(d.display_name || `${initialPin.lat.toFixed(5)}, ${initialPin.lng.toFixed(5)}`))
      .catch(() => setPinLabel(`${initialPin.lat.toFixed(5)}, ${initialPin.lng.toFixed(5)}`))
  }, [initialPin])

  const provName = provinces.find(p  => p.code === province)?.name  || ''
  const cityName = cities.find(c    => c.code === city)?.name       || ''
  const brgyName = barangays.find(b => b.code === barangay)?.name   || ''

  // Fly-to query
  const flyQuery = barangay ? `${brgyName}, ${cityName}` : city ? cityName : ''
  const flyZoom  = barangay ? 15 : 13

  // Trigger initialization when initialAddress arrives
  useEffect(() => {
    if (initialAddress && !initPartsRef.current && !province) {
      initPartsRef.current = initialAddress.split(',').map(s => s.trim())
      // If provinces are already loaded, select it immediately
      if (provinces.length > 0) {
        const pName = initPartsRef.current[initPartsRef.current.length - 1]
        const found = provinces.find(p => p.name === pName)
        if (found) setProvince(found.code)
      }
    }
  }, [initialAddress, provinces])

  // Load provinces
  useEffect(() => {
    psgcFetch('psgc_provinces', `${PSGC}/provinces/`)
      .then(data => {
        setProvinces(data)
        if (initPartsRef.current?.length > 0) {
          const pName = initPartsRef.current[initPartsRef.current.length - 1]
          const found = data.find(p => p.name === pName)
          if (found) setProvince(found.code)
        }
      })
      .finally(() => setLoadingP(false))
  }, [])

  // Load cities when province changes
  useEffect(() => {
    setCity(''); setCities([])
    setBarangay(''); setBarangays([])
    if (!province) return
    setLoadingC(true)
    psgcFetch(`psgc_cities_${province}`, `${PSGC}/provinces/${province}/cities-municipalities/`)
      .then(data => {
        setCities(data)
        if (initPartsRef.current?.length > 1) {
          const cName = initPartsRef.current[initPartsRef.current.length - 2]
          const found = data.find(c => c.name === cName)
          if (found) setCity(found.code)
        }
      })
      .finally(() => setLoadingC(false))
  }, [province])

  // Load barangays when city changes
  useEffect(() => {
    setBarangay(''); setBarangays([])
    if (!city) return
    setLoadingB(true)
    psgcFetch(`psgc_brgy_${city}`, `${PSGC}/cities-municipalities/${city}/barangays/`)
      .then(data => {
        setBarangays(data)
        if (initPartsRef.current?.length > 2) {
          const bName = initPartsRef.current[initPartsRef.current.length - 3]
          const found = data.find(b => b.name === bName)
          if (found) setBarangay(found.code)
        }
        initPartsRef.current = null // Done initializing
      })
      .finally(() => setLoadingB(false))
  }, [city])

  // Sync composed address string to parent form
  const isInitRender = useRef(true)
  useEffect(() => {
    const parts = [brgyName, cityName, provName].filter(Boolean)
    const newAddress = parts.join(', ')
    
    // Prevent overriding form state with empty string immediately on mount
    // if an initialAddress is expected
    if (isInitRender.current && !newAddress && initialAddress) {
       isInitRender.current = false
       return
    }

    onChange(newAddress)
  }, [brgyName, cityName, provName])

  // Map click → reverse-geocode and notify parent
  const handleMapClick = async ({ lat, lng }) => {
    setPin({ lat, lng })
    onCoordsChange(lat, lng)
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      setPinLabel(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } catch {
      setPinLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    }
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition ${error ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'}`}>

      {/* Dropdowns */}
      <div className="p-4 space-y-2.5 bg-gray-50 dark:bg-gray-800/40">
        <Select
          value={province}  onChange={setProvince}
          options={provinces} placeholder="Select Province" loading={loadingP}
        />
        <Select
          value={city} onChange={setCity}
          options={cities}
          placeholder={province ? 'Select City / Municipality' : '— Select Province first —'}
          loading={loadingC} disabled={!province}
        />
        <Select
          value={barangay} onChange={setBarangay}
          options={barangays}
          placeholder={city ? 'Select Barangay' : '— Select City first —'}
          loading={loadingB} disabled={!city}
        />

        {/* Address preview */}
        {cityName && (
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 px-0.5">
            <MapPin size={11} />
            {[brgyName, cityName, provName].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Map */}
      <div className="relative">
        {/* Hint pill */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs text-gray-500 dark:text-gray-400
                           px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            {city ? 'Click map to pin exact location' : 'Select a city to zoom the map'}
          </span>
        </div>

        <MapContainer
          center={[12.8797, 121.774]}
          zoom={6}
          style={{ height: '260px', width: '100%' }}
          zoomControl
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {flyQuery && <MapFlyTo query={flyQuery} zoom={flyZoom} />}
          {/* Fly to saved pin on first load (edit mode) */}
          {initialPin?.lat && !flyQuery && (
            <MapFlyToPin lat={initialPin.lat} lng={initialPin.lng} />
          )}
          <MapClickHandler onMapClick={handleMapClick} />
          {pin && <Marker position={[pin.lat, pin.lng]} />}
        </MapContainer>
      </div>

      {/* Pin label */}
      {pin && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border-t border-brand-100 dark:border-brand-800/40 px-4 py-2 flex items-start gap-2">
          <MapPin size={13} className="text-brand-500 mt-0.5 shrink-0" />
          <p className="text-xs text-brand-700 dark:text-brand-300 leading-snug">{pinLabel}</p>
        </div>
      )}
    </div>
  )
}
