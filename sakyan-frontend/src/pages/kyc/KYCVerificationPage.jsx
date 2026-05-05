import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Upload, X,
  Info, FileText, ShieldCheck, ChevronDown, Loader2, MapPin, User, Phone, Calendar,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import toast from 'react-hot-toast'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useSubmitKYC } from '@/hooks/useAdmin'
import { useAuthStore } from '@/store/authStore'

// Fix Leaflet marker icons broken by Vite asset bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── PSGC Data Cache ───────────────────────────────────────────────────────────
const PSGC = 'https://psgc.cloud/api'
const TTL  = 7 * 24 * 60 * 60 * 1000

async function psgcFetch(cacheKey, url) {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, expires } = JSON.parse(cached)
      if (Date.now() < expires) return data
    }
  } catch { /* corrupt cache */ }
  const data   = await fetch(url).then(r => r.json())
  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name))
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data: sorted, expires: Date.now() + TTL }))
  } catch { /* storage full */ }
  return sorted
}

// ── Schemas ───────────────────────────────────────────────────────────────────
const step1Schema = z.object({
  birthday:                z.string().min(1, 'Birthday is required'),
  contact_number:          z.string().min(10, 'Enter a valid phone number'),
  address:                 z.string().min(5, 'Please complete the address selection'),
})

const step2Schema = z.object({
  drivers_license_number:  z.string().min(3, 'License number is required'),
  license_expiry:          z.string().min(1, 'License expiry date is required'),
  valid_id_type:           z.string().min(1, 'Please select a valid ID type'),
})

const ID_TYPE_OPTIONS = [
  { value: 'passport',   label: 'Passport' },
  { value: 'sss',        label: 'SSS ID' },
  { value: 'philhealth', label: 'PhilHealth ID' },
  { value: 'postal',     label: 'Postal ID' },
  { value: 'voters',     label: "Voter's ID" },
  { value: 'prc',        label: 'PRC ID' },
  { value: 'umid',       label: 'UMID' },
]

// ── Shared input classname ────────────────────────────────────────────────────
const inputCls = `w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-brand-500 transition`

// ── UI Helpers ────────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function PSGCSelect({ value, onChange, options, placeholder, loading, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`w-full appearance-none border rounded-xl px-3 py-2.5 pr-9 text-sm
                    focus:outline-none focus:ring-2 focus:ring-brand-500 transition
                    dark:bg-gray-800 dark:text-gray-200
                    ${disabled || loading
                      ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700'
                      : 'bg-white border-gray-200 dark:border-gray-700 text-gray-700 cursor-pointer'}`}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        {loading
          ? <Loader2 size={14} className="text-brand-500 animate-spin" />
          : <ChevronDown size={14} className="text-gray-400" />}
      </div>
    </div>
  )
}

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

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: e => onMapClick(e.latlng) })
  return null
}

// ── Address Picker ────────────────────────────────────────────────────────────
function AddressPicker({ onChange, onCoordsChange, error }) {
  const [provinces, setProvinces] = useState([])
  const [cities,    setCities]    = useState([])
  const [barangays, setBarangays] = useState([])
  const [province,  setProvince]  = useState('')
  const [city,      setCity]      = useState('')
  const [barangay,  setBarangay]  = useState('')
  const [loadingP,  setLoadingP]  = useState(true)
  const [loadingC,  setLoadingC]  = useState(false)
  const [loadingB,  setLoadingB]  = useState(false)
  const [pin,       setPin]       = useState(null)
  const [pinLabel,  setPinLabel]  = useState('')

  const provName = provinces.find(p => p.code === province)?.name || ''
  const cityName = cities.find(c => c.code === city)?.name        || ''
  const brgyName = barangays.find(b => b.code === barangay)?.name || ''
  const flyQuery = barangay ? `${brgyName}, ${cityName}` : city ? cityName : ''
  const flyZoom  = barangay ? 15 : 13

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

  useEffect(() => {
    const parts = [brgyName, cityName, provName].filter(Boolean)
    onChange(parts.join(', '))
  }, [brgyName, cityName, provName])

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
    <div className={`rounded-2xl border overflow-hidden ${error ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="p-4 space-y-2.5 bg-gray-50/60 dark:bg-gray-800/40">
        <PSGCSelect value={province} onChange={setProvince} options={provinces}
          placeholder="Select Province" loading={loadingP} />
        <PSGCSelect value={city} onChange={setCity} options={cities}
          placeholder={province ? 'Select City / Municipality' : '— Select Province first —'}
          loading={loadingC} disabled={!province} />
        <PSGCSelect value={barangay} onChange={setBarangay} options={barangays}
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
          <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs text-gray-500 px-3 py-1
                           rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            {city ? 'Click to pin exact location' : 'Select a city to zoom the map'}
          </span>
        </div>
        <MapContainer center={[12.8797, 121.774]} zoom={6}
          style={{ height: '220px', width: '100%' }} zoomControl>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {flyQuery && <MapFlyTo query={flyQuery} zoom={flyZoom} />}
          <MapClickHandler onMapClick={handleMapClick} />
          {pin && <Marker position={[pin.lat, pin.lng]} />}
        </MapContainer>
      </div>
      {pin && (
        <div className="bg-brand-50 dark:bg-brand-900/20 border-t border-brand-100 dark:border-brand-800 px-4 py-2 flex items-start gap-2">
          <MapPin size={13} className="text-brand-500 mt-0.5 shrink-0" />
          <p className="text-xs text-brand-700 dark:text-brand-300 leading-snug">{pinLabel}</p>
        </div>
      )}
    </div>
  )
}

// ── File Upload Box ───────────────────────────────────────────────────────────
function FileUploadBox({ label, hint, url, onUploaded, onClear, required }) {
  const { uploadFile, uploading, deleteFile } = useFileUpload('uploads')
  const [localPreview, setLocalPreview] = useState(null)

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) setLocalPreview(URL.createObjectURL(file))
    const uploaded = await uploadFile(file, url || null)
    if (uploaded) {
      onUploaded(uploaded)
    } else {
      setLocalPreview(null)
    }
    e.target.value = ''
  }

  const handleClear = async () => {
    if (url) await deleteFile(url)
    setLocalPreview(null)
    onClear()
  }

  const previewUrl = localPreview || url

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {required && <span className="text-xs text-red-500">*</span>}
      </div>
      {hint && (
        <p className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Info size={11} />{hint}
        </p>
      )}

      {url ? (
        <div className="border border-green-200 dark:border-green-800 rounded-xl overflow-hidden bg-green-50 dark:bg-green-900/20">
          <div className="relative group bg-gray-100 dark:bg-gray-800">
            <img src={previewUrl} alt="Uploaded ID"
              className="w-full max-h-48 object-contain p-2" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                            transition flex items-center justify-center gap-3">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                View full
              </a>
              <button type="button" onClick={handleClear}
                className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition">
                Remove
              </button>
            </div>
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 size={14} className="text-white" />
            </div>
          </div>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 p-6
                           border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer
                           hover:border-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-900/10 transition
                           ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading
            ? <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            : <Upload size={20} className="text-gray-400" />}
          <span className="text-sm text-gray-500 dark:text-gray-400">{uploading ? 'Uploading…' : 'Click to upload'}</span>
          <span className="text-xs text-gray-400">JPG or PNG · Max 5 MB</span>
          <input type="file" className="hidden" accept="image/*" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}

// ── Step Indicator ────────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${
          i < current ? 'bg-brand-500 w-8' :
          i === current ? 'bg-brand-500 w-12' :
          'bg-gray-200 dark:bg-gray-700 w-8'
        }`} />
      ))}
      <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">Step {current + 1} of {total}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Main Page ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export default function KYCVerificationPage() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { user, refreshUser } = useAuthStore()
  const submitKYC   = useSubmitKYC()

  const [step,        setStep]        = useState(0)
  const [coords,      setCoords]      = useState({ lat: null, lng: null })
  const [licenseUrl,  setLicenseUrl]  = useState('')
  const [validIdUrl,  setValidIdUrl]  = useState('')

  // Save destination — so KYCPendingPage can redirect there after approval
  const destination = location.state?.from || '/cars'

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login')
    if (user?.customer_profile?.kyc_status === 'approved') navigate(destination, { replace: true })
    if (user?.customer_profile?.kyc_status === 'pending')  navigate('/kyc/pending')
  }, [user, destination, navigate])

  // ── Step 1 form: personal info ──────────────────────────────────────────────
  const step1Form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      birthday:       user?.customer_profile?.birthday || '',
      contact_number: user?.phone || '',
      address:        '',
    },
  })

  // ── Step 2 form: license & ID info ──────────────────────────────────────────
  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      drivers_license_number: '',
      license_expiry:         '',
      valid_id_type:          '',
    },
  })

  const [step1Data, setStep1Data] = useState(null)
  const [step2Data, setStep2Data] = useState(null)

  const onStep1Submit = (data) => {
    setStep1Data(data)
    setStep(1)
  }

  const onStep2Submit = (data) => {
    setStep2Data(data)
    setStep(2)
  }

  const handleFinalSubmit = async () => {
    if (!licenseUrl) { toast.error("Please upload your Driver's License."); return }
    if (!validIdUrl) { toast.error('Please upload a valid ID.'); return }
    if (!step1Data)  { setStep(0); return }
    if (!step2Data)  { setStep(1); return }

    // Persist where they were trying to go so the pending page can redirect
    localStorage.setItem('kyc_return_to', destination)

    submitKYC.mutate({
      birthday:               step1Data.birthday,
      contact_number:         step1Data.contact_number,
      address:                step1Data.address,
      address_lat:            coords.lat,
      address_lng:            coords.lng,
      drivers_license_number: step2Data.drivers_license_number,
      license_expiry:         step2Data.license_expiry,
      valid_id_type:          step2Data.valid_id_type,
      drivers_license_url:    licenseUrl,
      valid_id_url:           validIdUrl,
    }, {
      onSuccess: async () => {
        await refreshUser()
        navigate('/kyc/pending')
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600
                          flex items-center justify-center shadow-md shadow-brand-500/20">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Identity Verification</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Required before you can book a car</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
          <StepDots current={step} total={3} />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── STEP 0: Personal Information ───────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 0 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter your contact details and home address.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Birthday" error={step1Form.formState.errors.birthday?.message}>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      {...step1Form.register('birthday')}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>

                <Field label="Contact Number" error={step1Form.formState.errors.contact_number?.message}>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      {...step1Form.register('contact_number')}
                      placeholder="e.g. 09171234567"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                </Field>
              </div>

              <Field label="Home Address" error={step1Form.formState.errors.address?.message}>
                <Controller
                  name="address"
                  control={step1Form.control}
                  render={({ field }) => (
                    <AddressPicker
                      onChange={field.onChange}
                      onCoordsChange={(lat, lng) => setCoords({ lat, lng })}
                      error={step1Form.formState.errors.address?.message}
                    />
                  )}
                />
              </Field>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 dark:border-gray-700
                             rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400
                             hover:border-brand-300 dark:hover:border-brand-600 transition">
                  <ArrowLeft size={15} /> Cancel
                </button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3
                             bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700
                             text-white text-sm font-semibold rounded-xl transition shadow-md shadow-brand-500/20">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── STEP 1: License & ID Details ───────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">License & ID Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter your driver's license information and select your government ID type.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="License Number" error={step2Form.formState.errors.drivers_license_number?.message}>
                  <input
                    type="text"
                    {...step2Form.register('drivers_license_number')}
                    placeholder="e.g. N01-23-456789"
                    className={inputCls}
                  />
                </Field>

                <Field label="License Expiry" error={step2Form.formState.errors.license_expiry?.message}>
                  <input
                    type="date"
                    {...step2Form.register('license_expiry')}
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Valid ID Type" error={step2Form.formState.errors.valid_id_type?.message}>
                <select
                  {...step2Form.register('valid_id_type')}
                  className={`${inputCls} appearance-none`}
                >
                  <option value="">Select ID type</option>
                  {ID_TYPE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 dark:border-gray-700
                             rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400
                             hover:border-brand-300 dark:hover:border-brand-600 transition">
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3
                             bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700
                             text-white text-sm font-semibold rounded-xl transition shadow-md shadow-brand-500/20">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── STEP 2: Upload Documents ───────────────────────────────── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upload Documents</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Kept private. Used only for identity verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FileUploadBox
                  label="Driver's License"
                  hint="Front side of your driver's license"
                  url={licenseUrl}
                  onUploaded={setLicenseUrl}
                  onClear={() => setLicenseUrl('')}
                  required
                />

                <FileUploadBox
                  label="Valid Government ID"
                  hint="SSS, PhilHealth, UMID, Passport, etc."
                  url={validIdUrl}
                  onUploaded={setValidIdUrl}
                  onClear={() => setValidIdUrl('')}
                  required
                />
              </div>

              {/* Submission info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800
                              rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
                ℹ️ Your documents will be reviewed by our team within 1–2 business days.
                You'll be notified once verified.
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 dark:border-gray-700
                             rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400
                             hover:border-brand-300 dark:hover:border-brand-600 transition">
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!licenseUrl || !validIdUrl || submitKYC.isPending}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                              text-sm font-semibold transition ${
                    licenseUrl && validIdUrl && !submitKYC.isPending
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md shadow-brand-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}>
                  {submitKYC.isPending ? 'Submitting…' : 'Submit Verification'}
                  {!submitKYC.isPending && <ArrowRight size={16} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
