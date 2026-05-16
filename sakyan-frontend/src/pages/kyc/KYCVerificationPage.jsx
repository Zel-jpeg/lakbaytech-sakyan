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
  { value: 'national_id', label: 'Philippine National ID (PhilSys)' },
  { value: 'passport',    label: 'Passport' },
  { value: 'sss',         label: 'SSS ID' },
  { value: 'philhealth',  label: 'PhilHealth ID' },
  { value: 'postal',      label: 'Postal ID' },
  { value: 'voters',      label: "Voter's ID" },
  { value: 'prc',         label: 'PRC ID' },
  { value: 'umid',        label: 'UMID' },
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

// ── Rental Agreement Sections (structured data for modern rendering) ──────────
const AGREEMENT_SECTIONS = [
  {
    num: 1, title: 'Identification of Parties',
    body: 'The Renter confirms that all identity documents submitted during KYC verification are authentic, valid, and belong to them. Any fraudulent submission is grounds for immediate account termination and legal action under applicable Philippine laws.',
  },
  {
    num: 2, title: 'Permitted Vehicle Use',
    body: 'The rented vehicle shall be used solely for lawful purposes within the Republic of the Philippines. The Renter agrees not to use the vehicle for any illegal activities, including but not limited to: drug trafficking, criminal transport, unauthorized racing, or any activity that violates Philippine law.',
  },
  {
    num: 3, title: 'Driver Responsibility',
    body: 'Only the Renter (whose name appears in the KYC verification) is authorized to operate the rented vehicle, unless a written authorization from the Partner is obtained prior to the rental. The Renter assumes full legal liability for any unauthorized use of the vehicle by a third party.',
  },
  {
    num: 4, title: 'Damage Liability',
    body: 'The Renter is fully liable for any physical damage, mechanical damage, vandalism, theft, or loss of the vehicle that occurs during the rental period. This includes damage caused by weather events if proper precautions were not taken. The Renter agrees to compensate the Partner for the full cost of repair or replacement of the vehicle at fair market value. Documentation of the vehicle\'s condition before and after rental (photos/videos) as provided by the Partner shall serve as primary evidence.',
  },
  {
    num: 5, title: 'Traffic Violations & Penalties',
    body: 'The Renter is solely responsible for all traffic violations, fines, penalties, and fees incurred during the rental period, including but not limited to: speeding tickets, illegal parking fines, MMDA/LTO violations, and road toll charges. The Renter agrees to indemnify and hold the Partner harmless from any liability arising from such violations.',
  },
  {
    num: 6, title: 'Fuel Policy',
    body: 'The vehicle must be returned with the same fuel level as at the time of pickup, as documented by the Partner. Failure to return the vehicle with the same fuel level will result in a fuel reimbursement charge at the prevailing market rate plus an applicable service fee determined by the Partner.',
  },
  {
    num: 7, title: 'Late Return Policy',
    body: 'The vehicle must be returned at the agreed date and time as specified in the booking confirmation. Late returns will be subject to additional charges at the Partner\'s daily rate, prorated per hour or per day depending on the Partner\'s policy. The Renter must notify the Partner at least 2 hours before the scheduled return time if an extension is needed.',
  },
  {
    num: 8, title: 'Prohibited Uses',
    body: null,
    list: [
      'Subletting or re-renting the vehicle to any third party',
      'Using the vehicle for off-road or rough terrain driving unless explicitly permitted by the Partner',
      'Transporting hazardous, illegal, or prohibited goods',
      'Using the vehicle for paid driving services (e.g., Grab, Lalamove) without prior Partner consent',
      'Tampering with, modifying, or removing any part of the vehicle',
    ],
  },
  {
    num: 9, title: 'Insurance Acknowledgment',
    body: 'The Renter acknowledges that no comprehensive insurance coverage is included in the rental fee unless explicitly stated by the Partner in writing. The Renter is encouraged to secure personal accident insurance or comprehensive rental insurance at their own expense. The minimum CTPL (Compulsory Third Party Liability) insurance required by Philippine law shall be maintained by the Partner at their expense; however, any claim exceeding CTPL coverage due to the Renter\'s negligence shall be the Renter\'s sole responsibility.',
  },
  {
    num: 10, title: 'Governing Law & Dispute Resolution',
    body: 'This Agreement shall be governed by the laws of the Republic of the Philippines. In the event of a dispute between the Renter and the Partner, both parties agree to first attempt resolution through good-faith negotiation. If unresolved within 15 days, disputes shall be referred to the Barangay Lupon ng Tagapamayapa for mediation before escalating to court proceedings, in accordance with the Katarungang Pambarangay Law (RA 7160).',
  },
  {
    num: 11, title: 'Platform Role',
    body: 'Sakyan acts solely as a technology platform connecting Renters and Partners. Sakyan is not a party to the rental transaction and is not liable for disputes arising from the rental. Sakyan reserves the right to suspend or terminate accounts that violate platform policies.',
  },
  {
    num: 12, title: 'Agreement to Terms',
    body: 'By typing your full legal name below and checking the acknowledgment box, you confirm that:',
    list: [
      'You have read, understood, and agree to all terms of this Agreement',
      'The information submitted in your KYC is accurate and authentic',
      'You understand that this constitutes a legally binding digital signature',
    ],
  },
]

// ── Rental Agreement Step Component (Modern UI) ─────────────────────────────
function RentalAgreementStep({ onBack, onSubmit, isSubmitting }) {
  const { user } = useAuthStore()
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const [hasScrolled, setHasScrolled] = useState(false)
  const scrollRef = useRef(null)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    if (atBottom) setHasScrolled(true)
  }

  const expectedName = user?.full_name?.toLowerCase().trim() || ''
  const signatureMatch = signature.toLowerCase().trim() === expectedName
  const canSubmit = agreed && signatureMatch && hasScrolled

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Rental Agreement
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Please read the agreement carefully and sign below to proceed.
        </p>
      </div>

      {/* Scrollable modern agreement */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-80 overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-700
                   bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900/60
                   scroll-smooth"
      >
        {/* Agreement Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900
                        border-b border-gray-200 dark:border-gray-700
                        px-5 py-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight uppercase">
            Car Rental Agreement
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sakyan Platform &middot; Effective upon KYC submission</p>
        </div>

        <div className="px-5 py-4">
          {/* Preamble */}
          <div className="mb-5 p-4 rounded-xl bg-brand-50/60 dark:bg-brand-900/15
                          border border-brand-100 dark:border-brand-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              This Car Rental Agreement ("Agreement") is entered into between the <strong>Renter</strong> (the individual completing this KYC verification) and the <strong>Car Rental Partner</strong> listed on the Sakyan platform, facilitated by <strong>Sakyan</strong> ("Platform").
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              By completing this KYC verification, the Renter agrees to be legally bound by the following terms and conditions.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {AGREEMENT_SECTIONS.map((section) => (
              <div key={section.num}
                className="group rounded-xl border border-gray-100 dark:border-gray-700/60
                           bg-white dark:bg-gray-800/40 p-4 transition
                           hover:border-brand-200 dark:hover:border-brand-700/50
                           hover:shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700/60
                                   flex items-center justify-center text-[11px] font-bold
                                   text-gray-500 dark:text-gray-400">
                    {section.num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {section.title}
                    </h4>
                    {section.body && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mt-1.5">
                        {section.body}
                      </p>
                    )}
                    {section.list && (
                      <ul className="mt-2 space-y-1">
                        {section.list.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <span className="text-brand-400 mt-0.5 shrink-0">•</span>
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!hasScrolled && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5
                      bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800
                      rounded-lg px-3 py-2">
          <Info size={12} /> Please scroll through the entire agreement to continue.
        </p>
      )}
      {hasScrolled && (
        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5
                      bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800
                      rounded-lg px-3 py-2">
          <CheckCircle2 size={12} /> You have read the full agreement.
        </p>
      )}

      {/* Checkbox */}
      <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
        agreed
          ? 'border-brand-300 dark:border-brand-600 bg-brand-50 dark:bg-brand-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
      } ${!hasScrolled ? 'opacity-50 pointer-events-none' : ''}`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-brand-500 shrink-0"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
          I have <span className="font-semibold">read, understood, and agree</span> to the Sakyan Rental Agreement. I understand this constitutes a legally binding agreement for all future car rentals made through the Sakyan platform.
        </span>
      </label>

      {/* Digital Signature */}
      <div className={!hasScrolled || !agreed ? 'opacity-50 pointer-events-none' : ''}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Digital Signature
          <span className="text-xs text-gray-400 font-normal ml-1">(Type your full legal name exactly as registered)</span>
        </label>
        <div className="relative">
          <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={signature}
            onChange={e => setSignature(e.target.value)}
            placeholder={user?.full_name || 'Your full legal name'}
            className={`${inputCls} pl-9 font-medium ${
              signature && !signatureMatch
                ? 'border-red-300 dark:border-red-700 focus:ring-red-400'
                : signature && signatureMatch
                ? 'border-green-300 dark:border-green-700 focus:ring-green-400'
                : ''
            }`}
          />
          {signature && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {signatureMatch
                ? <CheckCircle2 size={16} className="text-green-500" />
                : <X size={16} className="text-red-400" />}
            </div>
          )}
        </div>
        {signature && !signatureMatch && (
          <p className="text-xs text-red-500 mt-1">
            Name must match exactly: <strong>{user?.full_name}</strong>
          </p>
        )}
        {signature && signatureMatch && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Signature matches your registered name.</p>
        )}
      </div>

      {/* Legal note */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
        <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          This agreement is legally binding under Philippine law. Your typed name serves as your digital signature and will be recorded with a timestamp upon submission. Rental partners can view that you have signed this agreement.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onBack}
          className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 dark:border-gray-700
                     rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400
                     hover:border-brand-300 dark:hover:border-brand-600 transition">
          <ArrowLeft size={15} /> Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                      text-sm font-semibold transition ${
            canSubmit && !isSubmitting
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md shadow-brand-500/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          }`}>
          {isSubmitting ? 'Submitting…' : 'Submit Verification'}
          {!isSubmitting && canSubmit && <ArrowRight size={16} />}
        </button>
      </div>
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

  const onStep1Submit = (data) => { setStep1Data(data); setStep(1) }
  const onStep2Submit = (data) => { setStep2Data(data); setStep(2) }

  const handleFinalSubmit = async () => {
    if (!licenseUrl) { toast.error("Please upload your Driver's License."); return }
    if (!validIdUrl) { toast.error('Please upload a valid ID.'); return }
    if (!step1Data)  { setStep(0); return }
    if (!step2Data)  { setStep(1); return }

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
      agreement_accepted:     true,
      agreement_signature:    user?.full_name,
      agreement_signed_at:    new Date().toISOString(),
    }, {
      onSuccess: async () => {
        await refreshUser()
        navigate('/kyc/pending')
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-start justify-center py-6 sm:py-12 px-4">
      <div className="w-full max-w-xl">

        {/* Header with cancel */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600
                            flex items-center justify-center shadow-md shadow-brand-500/20">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Identity Verification</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Required before you can book a car</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 border border-gray-200 dark:border-gray-700
                       rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400
                       hover:border-red-300 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20 transition group"
          >
            <X size={15} className="group-hover:text-red-500 dark:group-hover:text-red-400 transition" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 sm:p-8">
          <StepDots current={step} total={4} />

          {/* ── STEP 0: Personal Information ─── */}
          {step === 0 && (
            <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Personal Information</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your contact details and home address.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Birthday" error={step1Form.formState.errors.birthday?.message}>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" {...step1Form.register('birthday')} className={`${inputCls} pl-9`} />
                  </div>
                </Field>
                <Field label="Contact Number" error={step1Form.formState.errors.contact_number?.message}>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input {...step1Form.register('contact_number')} placeholder="e.g. 09171234567" className={`${inputCls} pl-9`} />
                  </div>
                </Field>
              </div>
              <Field label="Home Address" error={step1Form.formState.errors.address?.message}>
                <Controller name="address" control={step1Form.control} render={({ field }) => (
                  <AddressPicker onChange={field.onChange} onCoordsChange={(lat, lng) => setCoords({ lat, lng })} error={step1Form.formState.errors.address?.message} />
                )} />
              </Field>
              <div className="flex gap-3 pt-1">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-brand-500/20">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 1: License & ID Details ─── */}
          {step === 1 && (
            <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">License & ID Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your driver's license information and select your government ID type.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="License Number" error={step2Form.formState.errors.drivers_license_number?.message}>
                  <input type="text" {...step2Form.register('drivers_license_number')} placeholder="e.g. N01-23-456789" className={inputCls} />
                </Field>
                <Field label="License Expiry" error={step2Form.formState.errors.license_expiry?.message}>
                  <input type="date" {...step2Form.register('license_expiry')} className={inputCls} />
                </Field>
              </div>
              <Field label="Valid ID Type" error={step2Form.formState.errors.valid_id_type?.message}>
                <select {...step2Form.register('valid_id_type')} className={`${inputCls} appearance-none`}>
                  <option value="">Select ID type</option>
                  {ID_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1.5 px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-600 transition">
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-brand-500/20">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Upload Documents ─── */}
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
                  onClick={() => {
                    if (!licenseUrl) { toast.error("Please upload your Driver's License."); return }
                    if (!validIdUrl) { toast.error('Please upload a valid ID.'); return }
                    setStep(3)
                  }}
                  disabled={!licenseUrl || !validIdUrl}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                              text-sm font-semibold transition ${
                    licenseUrl && validIdUrl
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-md shadow-brand-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  }`}>
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Rental Agreement ─── */}
          {step === 3 && (
            <RentalAgreementStep
              onBack={() => setStep(2)}
              onSubmit={handleFinalSubmit}
              isSubmitting={submitKYC.isPending}
            />
          )}
        </div>
      </div>
    </div>
  )
}
