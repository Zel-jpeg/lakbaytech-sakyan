import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DayPicker } from 'react-day-picker'
import { differenceInDays, format, startOfToday } from 'date-fns'
import {
  ArrowLeft, CalendarDays, CreditCard, Banknote,
  MapPin, ShieldCheck, FileText, User, Phone, Calendar,
  Truck, Building2, MessageCircle, ChevronDown, Loader2, Info,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import toast from 'react-hot-toast'
import { useCar, useCarBookedDates } from '@/hooks/useCars'
import { useCreateBooking } from '@/hooks/useBookings'
import { useAuthStore } from '@/store/authStore'
import api from '@/config/axios'
import 'react-day-picker/dist/style.css'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── helpers ──────────────────────────────────────────────────────────────────
const today = startOfToday()

const inputCls = `w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all duration-200`

const ID_TYPE_LABELS = {
  passport: 'Passport', sss: 'SSS ID', philhealth: 'PhilHealth ID',
  postal: 'Postal ID', voters: "Voter's ID", prc: 'PRC ID', umid: 'UMID',
}

// ─── PSGC cache helper ─────────────────────────────────────────────────────────
const PSGC = 'https://psgc.cloud/api'
const TTL  = 7 * 24 * 60 * 60 * 1000
async function psgcFetch(cacheKey, url) {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, expires } = JSON.parse(cached)
      if (Date.now() < expires) return data
    }
  } catch { /* corrupt */ }
  const data   = await fetch(url).then(r => r.json())
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
  try { localStorage.setItem(cacheKey, JSON.stringify({ data: sorted, expires: Date.now() + TTL })) } catch { /* full */ }
  return sorted
}

// ─── Map helpers ──────────────────────────────────────────────────────────────
function MapFlyTo({ lat, lng, zoom = 14 }) {
  const map  = useMap()
  const last = useRef('')
  useEffect(() => {
    const key = `${lat},${lng}`
    if (!lat || !lng || key === last.current) return
    last.current = key
    map.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 })
  }, [lat, lng])
  return null
}

function MapFlyToQuery({ query, zoom }) {
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
      .then(([result]) => { if (result) map.flyTo([+result.lat, +result.lon], zoom, { animate: true, duration: 1.2 }) })
      .catch(() => {})
  }, [query])
  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

// ─── PSGC Select ───────────────────────────────────────────────────────────────
function PsgcSelect({ value, onChange, options, placeholder, loading, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full appearance-none border rounded-xl px-3 py-2.5 pr-9 text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition
                    ${ disabled || loading
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

// ─── Delivery Address Picker ───────────────────────────────────────────────────
function DeliveryAddressPicker({ onAddressChange }) {
  const [provinces, setProvinces] = useState([])
  const [cities,    setCities]    = useState([])
  const [barangays, setBarangays] = useState([])
  const [province,  setProvince]  = useState('')
  const [city,      setCity]      = useState('')
  const [barangay,  setBarangay]  = useState('')
  const [loadingP, setLoadingP] = useState(true)
  const [loadingC, setLoadingC] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [pin,   setPin]   = useState(null)
  const [label, setLabel] = useState('')

  const provName = provinces.find(p  => p.code === province)?.name || ''
  const cityName = cities.find(c    => c.code === city)?.name      || ''
  const brgyName = barangays.find(b => b.code === barangay)?.name  || ''
  const flyQuery = barangay ? `${brgyName}, ${cityName}` : city ? cityName : ''
  const flyZoom  = barangay ? 15 : 13

  useEffect(() => {
    const parts = [brgyName, cityName, provName].filter(Boolean)
    const addr  = parts.join(', ')
    if (addr) onAddressChange({ address: addr, lat: pin?.lat ?? null, lng: pin?.lng ?? null })
  }, [brgyName, cityName, provName])

  useEffect(() => {
    psgcFetch('psgc_provinces', `${PSGC}/provinces/`)
      .then(setProvinces).finally(() => setLoadingP(false))
  }, [])

  useEffect(() => {
    setCity(''); setCities([]); setBarangay(''); setBarangays([])
    if (!province) return
    setLoadingC(true)
    psgcFetch(`psgc_cities_${province}`, `${PSGC}/provinces/${province}/cities-municipalities/`)
      .then(setCities).finally(() => setLoadingC(false))
  }, [province])

  useEffect(() => {
    setBarangay(''); setBarangays([])
    if (!city) return
    setLoadingB(true)
    psgcFetch(`psgc_brgy_${city}`, `${PSGC}/cities-municipalities/${city}/barangays/`)
      .then(setBarangays).finally(() => setLoadingB(false))
  }, [city])

  const handleMapClick = async ({ lat, lng }) => {
    setPin({ lat, lng })
    const resolved = await reverseGeocode(lat, lng)
    setLabel(resolved)
    const parts = [brgyName, cityName, provName].filter(Boolean)
    const baseAddr = parts.join(', ') || resolved
    onAddressChange({ address: baseAddr, lat, lng })
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 space-y-2.5 bg-gray-50 dark:bg-gray-800/40">
        <PsgcSelect value={province} onChange={setProvince} options={provinces}
          placeholder="Select Province" loading={loadingP} />
        <PsgcSelect value={city} onChange={setCity} options={cities}
          placeholder={province ? 'Select City / Municipality' : '— Select Province first —'}
          loading={loadingC} disabled={!province} />
        <PsgcSelect value={barangay} onChange={setBarangay} options={barangays}
          placeholder={city ? 'Select Barangay' : '— Select City first —'}
          loading={loadingB} disabled={!city} />
        {cityName && (
          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1 px-0.5">
            <MapPin size={11} />
            {[brgyName, cityName, provName].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
      <div className="relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs text-gray-500 dark:text-gray-400
                           px-3 py-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            {city ? 'Click map to pin exact delivery location' : 'Select a city to zoom the map'}
          </span>
        </div>
        <MapContainer center={[12.8797, 121.774]} zoom={6} style={{ height: '240px', width: '100%' }} zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {flyQuery && <MapFlyToQuery query={flyQuery} zoom={flyZoom} />}
          <MapClickHandler onMapClick={handleMapClick} />
          {pin && <Marker position={[pin.lat, pin.lng]} />}
          {pin && <MapFlyTo lat={pin.lat} lng={pin.lng} />}
        </MapContainer>
        {pin && label && (
          <div className="bg-brand-50 dark:bg-brand-900/20 border-t border-brand-100 dark:border-brand-800/40 px-4 py-2 flex items-start gap-2">
            <MapPin size={13} className="text-brand-500 mt-0.5 shrink-0" />
            <p className="text-xs text-brand-700 dark:text-brand-300 leading-snug">{label}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Pickup Map ────────────────────────────────────────────────────────────────
function PickupMap({ lat, lng, locationStr }) {
  const [coords, setCoords] = useState(lat && lng ? { lat, lng } : null)

  useEffect(() => {
    if (lat && lng) return
    if (!locationStr) return
    fetch(
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({ q: locationStr + ', Philippines', format: 'json', limit: 1 }),
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then(([result]) => { if (result) setCoords({ lat: +result.lat, lng: +result.lon }) })
      .catch(() => {})
  }, [lat, lng, locationStr])

  if (!coords) {
    return (
      <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        <MapPin size={16} className="mr-2 opacity-50" /> Locating on map…
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer center={[coords.lat, coords.lng]} zoom={15}
        style={{ height: '190px', width: '100%' }} zoomControl={false}
        dragging={false} scrollWheelZoom={false} doubleClickZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[coords.lat, coords.lng]} />
      </MapContainer>
    </div>
  )
}

// ─── Verified Info Card ────────────────────────────────────────────────────────
function VerifiedInfoCard({ profile }) {
  if (!profile) return null
  const rows = [
    { icon: User,     label: 'Birthday',     value: profile.birthday },
    { icon: Phone,    label: 'Contact',       value: profile.contact_number },
    { icon: MapPin,   label: 'Address',       value: profile.address },
    { icon: FileText, label: 'License #',     value: profile.drivers_license_number },
    { icon: Calendar, label: 'Expiry',        value: profile.license_expiry },
    { icon: FileText, label: 'Valid ID',      value: ID_TYPE_LABELS[profile.valid_id_type] || profile.valid_id_type },
  ].filter(r => r.value)

  return (
    <div>
      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl mb-4">
        <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">Identity Verified</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5">
            Your verified info will be shared with the partner for this booking.
          </p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon size={13} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">{label}</span>
              <p className="text-gray-800 dark:text-gray-200 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Price Summary ─────────────────────────────────────────────────────────────
function PriceSummary({ pricePerDay, totalDays, bookingFee = 0, paymentMethod }) {
  const subtotal = pricePerDay * totalDays
  const total    = subtotal + Number(bookingFee)
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2.5 text-sm">
      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>₱{Number(pricePerDay).toLocaleString()} × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
        <span>₱{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-500 dark:text-gray-400">
        <span>Platform booking fee</span>
        <span>₱{Number(bookingFee).toLocaleString()}</span>
      </div>
      <hr className="border-gray-200 dark:border-gray-700" />
      <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base">
        <span>Total to pay partner</span>
        <span>₱{total.toLocaleString()}</span>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed pt-1">
        {paymentMethod === 'gcash'
          ? '💬 After approval, coordinate payment with the partner via chat. They will share their GCash number.'
          : '💵 Pay the full amount in cash to the partner on pickup/delivery day.'}
      </p>
    </div>
  )
}

// ─── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ step, children }) {
  return (
    <h2 className="flex items-center gap-3 text-base font-bold text-gray-900 dark:text-white mb-4">
      <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {step}
      </span>
      {children}
    </h2>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { carId }  = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()

  const { data: car,     isLoading: carLoading }     = useCar(carId)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn:  () => api.get('/auth/me/').then(r => r.data),
    enabled:  !!user,
  })
  const { data: settingsData } = useQuery({
    queryKey: ['platform-settings'],
    queryFn:  () => api.get('/admin/settings/').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })

  const bookingFee      = Number(settingsData?.find(s => s.key === 'booking_fee')?.value ?? 100)
  const customerProfile = profile?.customer_profile

  const { data: bookedRanges = [] } = useCarBookedDates(carId)

  // ── KYC guard: both customers and partners must be verified before booking ──
  useEffect(() => {
    if (!user || !profile) return  // wait for profile to load
    const kycStatus = profile?.customer_profile?.kyc_status
    if (kycStatus === 'approved') return  // all good
    if (kycStatus === 'pending') {
      navigate('/kyc/pending', { replace: true })
    } else {
      navigate('/kyc/verify', { state: { from: `/booking/checkout/${carId}` }, replace: true })
    }
  }, [user, profile, carId, navigate])



  // ── Expand booked ranges into local Date arrays (avoid UTC timezone shift) ──
  const bookedDates  = []   // confirmed → blocked + styled red
  const pendingDates = []   // pending   → styled amber, still selectable
  const bookedDateStrings  = new Set()
  const pendingDateStrings = new Set()

  bookedRanges.forEach(({ start, end, status }) => {
    // Parse as LOCAL date (not UTC) to avoid day-off-by-one in UTC+8
    const [sy, sm, sd] = start.split('-').map(Number)
    const [ey, em, ed] = end.split('-').map(Number)
    const cur  = new Date(sy, sm - 1, sd)
    const last = new Date(ey, em - 1, ed)
    while (cur <= last) {
      const key = cur.toLocaleDateString('en-CA') // YYYY-MM-DD in local tz
      if (status === 'confirmed') {
        bookedDates.push(new Date(cur))
        bookedDateStrings.add(key)
      } else {
        pendingDates.push(new Date(cur))
        pendingDateStrings.add(key)
      }
      cur.setDate(cur.getDate() + 1)
    }
  })

  // ── Form state ──
  const [range, setRange]                 = useState({ from: undefined, to: undefined })
  const [paymentMethod, setPaymentMethod] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [fulfillmentType, setFulfillmentType] = useState('pickup')
  const [deliveryInfo, setDeliveryInfo]       = useState({ address: '', lat: null, lng: null })

  const createBooking = useCreateBooking()

  const totalDays = range?.from && range?.to
    ? Math.max(1, differenceInDays(range.to, range.from))
    : 0

  // Check if selected range overlaps with a pending booking (string comparison, tz-safe)
  const hasOverlapWithPending = range?.from && range?.to && (() => {
    const cur  = new Date(range.from)
    const last = new Date(range.to)
    while (cur <= last) {
      if (pendingDateStrings.has(cur.toLocaleDateString('en-CA'))) return true
      cur.setDate(cur.getDate() + 1)
    }
    return false
  })()

  const canSubmit =
    range.from &&
    range.to &&
    totalDays > 0 &&
    paymentMethod &&
    (fulfillmentType === 'pickup' || deliveryInfo.address.trim())

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!range.from || !range.to) { toast.error('Please select your rental dates.'); return }
    if (!paymentMethod)           { toast.error('Please choose a payment method.'); return }
    if (fulfillmentType === 'delivery' && !deliveryInfo.address.trim()) {
      toast.error('Please provide your delivery address.'); return
    }

    try {
      const booking = await createBooking.mutateAsync({
        car:              carId,
        start_date:       format(range.from, 'yyyy-MM-dd'),
        end_date:         format(range.to,   'yyyy-MM-dd'),
        payment_method:   paymentMethod,
        special_requests: specialRequests || undefined,
        fulfillment_type: fulfillmentType,
        delivery_address: fulfillmentType === 'delivery' ? deliveryInfo.address : '',
        delivery_lat:     fulfillmentType === 'delivery' ? deliveryInfo.lat : null,
        delivery_lng:     fulfillmentType === 'delivery' ? deliveryInfo.lng : null,
      })

      // GCash → go to messages so customer can coordinate with partner
      if (paymentMethod === 'gcash') {
        navigate(`/messages?booking=${booking.id}`, {
          state: { booking, car, justBooked: true }
        })
      } else {
        navigate(`/booking/confirmation/${booking.booking_code}`, { state: { booking, car } })
      }
    } catch {
      // handled by hook
    }
  }

  if (carLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 dark:text-gray-400">Car not found.</p>
        <button onClick={() => navigate('/cars')} className="mt-4 text-brand-600 dark:text-brand-400 text-sm hover:underline">
          Browse cars
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <button onClick={() => navigate(`/cars/${carId}`)}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition">
        <ArrowLeft size={16} /> Back to car
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Complete your booking</h1>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── LEFT ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* STEP 1: Dates */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading step="1">Pick your dates</SectionHeading>
              <div className="mt-4">
                <div className="rdp-custom-container w-full">
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={r => setRange(r || { from: undefined, to: undefined })}
                    disabled={[{ before: today }, ...bookedDates]}
                    modifiers={{ booked: bookedDates, pending: pendingDates }}
                    modifiersClassNames={{ booked: 'rdp-day_booked', pending: 'rdp-day_pending' }}
                    numberOfMonths={1}
                    className="!font-sans rdp w-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Availability legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 px-1">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900/50 border border-red-300 dark:border-red-800" />
                  Booked (unavailable)
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-800" />
                  Pending confirmation
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-3 h-3 rounded-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600" />
                  Available
                </span>
              </div>

              {/* Pending overlap warning */}
              {hasOverlapWithPending && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-3 py-2.5">
                  <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Heads up:</strong> Some of your selected dates have an existing booking request pending review.
                    Your booking may be declined if that one gets approved first.
                  </p>
                </div>
              )}
              {range.from && range.to && (
                <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-5 py-3.5 rounded-xl border border-brand-100 dark:border-brand-800/50">
                  <CalendarDays size={17} className="shrink-0" />
                  {format(range.from, 'MMM d')} → {format(range.to, 'MMM d, yyyy')}
                  <span className="opacity-50 mx-0.5">•</span>
                  {totalDays} day{totalDays !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* STEP 2: Pickup or Delivery */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading step="2">How do you want the car?</SectionHeading>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { value: 'pickup',   label: 'Self-Pickup',    sub: 'Pick up at partner location', icon: Building2 },
                  { value: 'delivery', label: 'Delivery',       sub: 'Deliver to my location',      icon: Truck },
                ].map(({ value, label, sub, icon: Icon }) => (
                  <button
                    key={value} type="button"
                    onClick={() => setFulfillmentType(value)}
                    className={`flex flex-col items-center gap-2 py-5 rounded-2xl border-2 text-center font-medium transition ${
                      fulfillmentType === value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon size={22} className={fulfillmentType === value ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'} />
                    <span className="text-sm font-bold">{label}</span>
                    <span className="text-[11px] opacity-60 leading-snug">{sub}</span>
                  </button>
                ))}
              </div>

              {fulfillmentType === 'pickup' && car.location && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={14} className="text-brand-500 dark:text-brand-400 shrink-0" />
                    <span className="font-medium">Pickup at:</span>
                    <span>{car.location}</span>
                  </div>
                  <PickupMap lat={car.location_lat} lng={car.location_lng} locationStr={car.location} />
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Coordinate the exact pickup time with the partner via in-app chat after they approve your booking.
                  </p>
                </div>
              )}

              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your delivery address
                  </label>
                  <DeliveryAddressPicker onAddressChange={setDeliveryInfo} />
                </div>
              )}
            </div>

            {/* STEP 3: Your verified details */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading step="3">Your details</SectionHeading>
              <VerifiedInfoCard profile={customerProfile} />
            </div>

            {/* STEP 4: Payment method */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading step="4">How will you pay?</SectionHeading>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { value: 'gcash', label: 'GCash', icon: CreditCard },
                  { value: 'cash',  label: 'Cash',  icon: Banknote  },
                ].map(({ value, label, icon: Icon }) => (
                  <button key={value} type="button" onClick={() => setPaymentMethod(value)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 text-sm font-medium transition ${
                      paymentMethod === value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                    <Icon size={18} className={paymentMethod === value ? 'text-brand-600' : 'text-gray-400'} />
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'gcash' && (
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4">
                  <MessageCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">After approval, coordinate payment via chat</p>
                    <p className="text-xs leading-relaxed opacity-90">
                      Once the partner approves your booking, you'll be directed to your chat with them.
                      The partner will share their GCash number there so you can send the full payment.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <Info size={18} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Pay in cash on {fulfillmentType === 'delivery' ? 'delivery' : 'pickup'} day</p>
                    <p className="text-xs leading-relaxed">
                      The full amount (rental + ₱{bookingFee} booking fee) is paid in cash directly to the partner.
                      No upfront payment needed to submit your request.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 5: Special Requests */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading step="5">
                Special requests <span className="font-normal text-gray-400 dark:text-gray-500 text-sm ml-1">(optional)</span>
              </SectionHeading>
              <textarea
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                rows={3}
                placeholder="E.g. preferred pickup time, need child seats…"
                className={inputCls + ' resize-y'}
              />
            </div>

          </div>

          {/* ── RIGHT: sticky summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sticky top-24 space-y-5">

              {/* Car */}
              <div className="flex gap-4">
                {car.primary_image ? (
                  <img src={car.primary_image} alt={car.name}
                    className="w-24 h-20 object-cover rounded-xl shrink-0 border border-gray-100 dark:border-gray-700"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-24 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 text-3xl">🚗</div>
                )}
                <div className="min-w-0 py-1">
                  <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{car.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{car.year} • {car.brand}</p>
                  {car.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                      <MapPin size={11} /> {car.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Fulfillment badge */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                fulfillmentType === 'delivery'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700'
              }`}>
                {fulfillmentType === 'delivery' ? <Truck size={13}/> : <Building2 size={13}/>}
                {fulfillmentType === 'delivery' ? 'Delivery requested' : 'Self-pickup at partner location'}
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              {totalDays > 0 ? (
                <PriceSummary
                  pricePerDay={car.price_per_day}
                  totalDays={totalDays}
                  bookingFee={bookingFee}
                  paymentMethod={paymentMethod}
                />
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <CalendarDays size={22} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">Select dates to see total</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || createBooking.isPending}
                className={`w-full py-4 rounded-xl text-base font-bold transition shadow-sm ${
                  canSubmit && !createBooking.isPending
                    ? 'bg-brand-600 hover:bg-brand-700 text-white hover:shadow-md active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {createBooking.isPending
                  ? 'Submitting…'
                  : paymentMethod === 'gcash'
                    ? 'Submit & Go to Chat →'
                    : 'Submit Booking Request'}
              </button>

              <p className="text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                {paymentMethod === 'gcash'
                  ? "You'll be taken to chat with the partner after submitting."
                  : 'No payment needed now. Pay the partner on pickup day.'}
              </p>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}