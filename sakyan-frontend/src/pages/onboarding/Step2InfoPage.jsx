import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft, ChevronDown, Loader2, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import OnboardingLayout from './OnboardingLayout'
import { useOnboardingStore } from '@/store/onboardingStore'

// Fix Leaflet marker icons broken by Vite asset bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── PSGC Data Cache (localStorage, 7-day TTL) ─────────────────────────────────
const PSGC     = 'https://psgc.cloud/api'
const TTL      = 7 * 24 * 60 * 60 * 1000

async function psgcFetch(cacheKey, url) {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, expires } = JSON.parse(cached)
      if (Date.now() < expires) return data
    }
  } catch { /* corrupt cache — refetch */ }

  const data = await fetch(url).then(r => r.json())
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data: sorted, expires: Date.now() + TTL }))
  } catch { /* storage full — skip caching */ }
  return sorted
}

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  business_name:    z.string().min(2, 'Business name is required'),
  business_address: z.string().min(5, 'Please complete the address selection'),
  contact_person:   z.string().min(2, 'Contact person name is required'),
  contact_phone:    z.string().min(10, 'Enter a valid phone number'),
})

// ── UI Helpers ────────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Select({ value, onChange, options, placeholder, loading, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full appearance-none border rounded-xl px-3 py-2.5 pr-9 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white
                    ${disabled || loading
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100'
                      : 'border-gray-200 text-gray-700 cursor-pointer'}`}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 size={14} className="text-blue-500 animate-spin" />
          : <ChevronDown size={14} className="text-gray-400" />}
      </div>
    </div>
  )
}

// ── Map: auto-fly to selected location (debounced) ───────────────────────────
function MapFlyTo({ query, zoom }) {
  const map = useMap()
  const lastQuery = useRef('')
  const timer = useRef(null)

  useEffect(() => {
    if (!query || query === lastQuery.current) return
    // Debounce: wait 400 ms after the last selection before calling Nominatim
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      lastQuery.current = query
      fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({ q: query + ', Philippines', format: 'json', limit: 1 }),
        { headers: { 'Accept-Language': 'en' } }
      )
        .then(r => r.json())
        .then(([result]) => {
          if (result) map.flyTo([+result.lat, +result.lon], zoom, { animate: true, duration: 0.8 })
        })
        .catch(() => {})
    }, 400)
    return () => clearTimeout(timer.current)
  }, [query])

  return null
}

// ── Map: click to pin ─────────────────────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

// ── Address + Map Picker ──────────────────────────────────────────────────────
function AddressPicker({ onChange, onCoordsChange, error }) {
  const [provinces,  setProvinces]  = useState([])
  const [cities,     setCities]     = useState([])
  const [barangays,  setBarangays]  = useState([])

  const [province,  setProvince]  = useState('')
  const [city,      setCity]      = useState('')
  const [barangay,  setBarangay]  = useState('')

  const [loadingP, setLoadingP] = useState(true)
  const [loadingC, setLoadingC] = useState(false)
  const [loadingB, setLoadingB] = useState(false)

  const [pin,      setPin]      = useState(null)
  const [pinLabel, setPinLabel] = useState('')

  const provName = provinces.find(p => p.code === province)?.name || ''
  const cityName = cities.find(c => c.code === city)?.name        || ''
  const brgyName = barangays.find(b => b.code === barangay)?.name || ''

  // Fly-to query: barangay > city > none
  const flyQuery = barangay ? `${brgyName}, ${cityName}` : city ? cityName : ''
  const flyZoom  = barangay ? 15 : 13

  // Load provinces (cached)
  useEffect(() => {
    psgcFetch('psgc_provinces', `${PSGC}/provinces/`)
      .then(setProvinces)
      .finally(() => setLoadingP(false))
  }, [])

  // Load cities (cached per province)
  useEffect(() => {
    setCity(''); setCities([])
    setBarangay(''); setBarangays([])
    if (!province) return
    setLoadingC(true)
    psgcFetch(`psgc_cities_${province}`, `${PSGC}/provinces/${province}/cities-municipalities/`)
      .then(setCities)
      .finally(() => setLoadingC(false))
  }, [province])

  // Load barangays (cached per city)
  useEffect(() => {
    setBarangay(''); setBarangays([])
    if (!city) return
    setLoadingB(true)
    psgcFetch(`psgc_brgy_${city}`, `${PSGC}/cities-municipalities/${city}/barangays/`)
      .then(setBarangays)
      .finally(() => setLoadingB(false))
  }, [city])

  // Sync address to react-hook-form
  useEffect(() => {
    const parts = [brgyName, cityName, provName].filter(Boolean)
    onChange(parts.join(', '))
  }, [brgyName, cityName, provName])

  // Map pin click → show coords instantly, then reverse-geocode in background
  const handleMapClick = useCallback(async ({ lat, lng }) => {
    setPin({ lat, lng })
    onCoordsChange(lat, lng)
    // Show coords immediately for instant feedback
    setPinLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.display_name) setPinLabel(data.display_name)
    } catch { /* keep coordinate label */ }
  }, [onCoordsChange])

  return (
    <div className={`rounded-2xl border overflow-hidden ${error ? 'border-red-300' : 'border-gray-200'}`}>

      {/* Dropdowns */}
      <div className="p-4 space-y-2.5 bg-gray-50/60">
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

        {/* Live address preview */}
        {cityName && (
          <p className="text-xs text-blue-600 font-medium flex items-center gap-1 px-0.5">
            <MapPin size={11} />
            {[brgyName, cityName, provName].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {/* Map — lazy-mounted only after province is chosen to avoid loading tiles on first render */}
      {province ? (
        <div>
          <div className="relative">
            {/* Hint pill */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
              <span className="bg-white/90 backdrop-blur text-xs text-gray-500 px-3 py-1
                               rounded-full shadow-sm border border-gray-100">
                {city ? 'Click to pin exact location' : 'Select a city to zoom the map'}
              </span>
            </div>

            <MapContainer
              center={[12.8797, 121.774]}
              zoom={6}
              style={{ height: '250px', width: '100%' }}
              zoomControl
            >
              {/* CartoDB Positron: lighter tiles, fewer requests, faster load */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                subdomains="abcd"
                maxZoom={19}
              />
              {/* Auto-fly when city/barangay changes (debounced) */}
              {flyQuery && <MapFlyTo query={flyQuery} zoom={flyZoom} />}
              <MapClickHandler onMapClick={handleMapClick} />
              {pin && <Marker position={[pin.lat, pin.lng]} />}
            </MapContainer>
          </div>

          {/* Pin label */}
          {pin && (
            <div className="bg-blue-50 border-t border-blue-100 px-4 py-2 flex items-start gap-2">
              <MapPin size={13} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 leading-snug">{pinLabel}</p>
            </div>
          )}
        </div>
      ) : (
        /* Placeholder shown before province is picked — avoids loading map tiles early */
        <div className="flex flex-col items-center justify-center gap-2 h-[250px] bg-gray-50 border-t border-gray-100">
          <MapPin size={28} className="text-gray-300" />
          <p className="text-xs text-gray-400">Select a province to load the map</p>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Step2InfoPage() {
  const navigate = useNavigate()
  const store    = useOnboardingStore()

  useEffect(() => {
    if (!store.isStep1Complete()) navigate('/onboarding/step1')
  }, [])

  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      business_name:    store.business_name    || '',
      business_address: store.business_address || '',
      contact_person:   store.contact_person   || '',
      contact_phone:    store.contact_phone    || '',
    },
  })

  const onSubmit = (data) => {
    store.setStep2(data)
    navigate('/onboarding/step3')
  }

  return (
    <OnboardingLayout currentStep={2}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Business information</h1>
        <p className="text-gray-500 mt-1.5 text-sm">Tell us about your rental operation.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <Field label="Business / Trade Name" error={errors.business_name?.message}>
          <input
            {...register('business_name')}
            placeholder={store.partner_type === 'company'
              ? 'e.g. Juan Dela Cruz Car Rentals'
              : "e.g. Juan's Cars"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Business Address" error={errors.business_address?.message}>
          <Controller
            name="business_address"
            control={control}
            render={({ field }) => (
              <AddressPicker
                onChange={field.onChange}
                onCoordsChange={(lat, lng) =>
                  store.setStep2({ business_lat: lat, business_lng: lng })
                }
                error={errors.business_address?.message}
              />
            )}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Contact Person" error={errors.contact_person?.message}>
            <input
              {...register('contact_person')}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Contact Phone" error={errors.contact_phone?.message}>
            <input
              {...register('contact_phone')}
              placeholder="e.g. 09171234567"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding/step1')}
            className="flex items-center gap-1.5 px-5 py-3 border border-gray-200
                       rounded-xl text-sm font-medium text-gray-600 hover:border-blue-300 transition"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600
                       hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </OnboardingLayout>
  )
}