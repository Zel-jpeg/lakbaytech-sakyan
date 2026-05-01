import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DayPicker } from 'react-day-picker'
import { differenceInDays, format, addDays, startOfToday } from 'date-fns'
import {
  ArrowLeft, CalendarDays, CreditCard, Banknote,
  ChevronDown, ChevronUp, CheckCircle2, Upload, X,
  MapPin,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useCar } from '@/hooks/useCars'
import { useCreateBooking } from '@/hooks/useBookings'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useAuthStore } from '@/store/authStore'
import { kycSchema } from '@/utils/validators'
import api from '@/config/axios'
import 'react-day-picker/dist/style.css'

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = startOfToday()

function isKycComplete(profile) {
  if (!profile) return false
  return !!(
    profile.birthday &&
    profile.address &&
    profile.drivers_license_number &&
    profile.license_expiry &&
    profile.valid_id_type &&
    profile.drivers_license_url &&
    profile.valid_id_url
  )
}

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 className="text-base font-semibold text-gray-900 mb-4">{children}</h2>
  )
}

function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

function FileUploadBox({ label, url, onUpload, onClear, uploading }) {
  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUpload(file)
    e.target.value = ''
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>
      {url ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:underline truncate flex-1"
          >
            View uploaded file
          </a>
          <button onClick={onClear} className="text-gray-400 hover:text-red-500 transition shrink-0">
            <X size={15} />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 p-4
                           border-2 border-dashed border-gray-200 rounded-xl cursor-pointer
                           hover:border-blue-400 hover:bg-blue-50/40 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={20} className="text-gray-400" />
          )}
          <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : 'Click to upload'}</span>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}

// ─── KYC form ─────────────────────────────────────────────────────────────────

function KycForm({ register, errors, licenseUrl, setLicenseUrl, idUrl, setIdUrl }) {
  const { uploadFile, uploading } = useFileUpload('documents')

  const handleLicenseUpload = async (file) => {
    const url = await uploadFile(file)
    if (url) setLicenseUrl(url)
  }
  const handleIdUpload = async (file) => {
    const url = await uploadFile(file)
    if (url) setIdUrl(url)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Birthday</label>
          <input
            type="date"
            {...register('birthday')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FieldError message={errors.birthday?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Valid ID Type</label>
          <select
            {...register('valid_id_type')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select ID type</option>
            <option value="passport">Passport</option>
            <option value="sss">SSS ID</option>
            <option value="philhealth">PhilHealth ID</option>
            <option value="postal">Postal ID</option>
            <option value="voters">Voter's ID</option>
            <option value="prc">PRC ID</option>
            <option value="umid">UMID</option>
          </select>
          <FieldError message={errors.valid_id_type?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number</label>
          <input
            type="text"
            {...register('drivers_license_number')}
            placeholder="e.g. N01-23-456789"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FieldError message={errors.drivers_license_number?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">License Expiry</label>
          <input
            type="date"
            {...register('license_expiry')}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FieldError message={errors.license_expiry?.message} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Home Address</label>
        <textarea
          {...register('address')}
          rows={2}
          placeholder="Complete address including city and province"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <FieldError message={errors.address?.message} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileUploadBox
          label="Driver's License Photo"
          url={licenseUrl}
          onUpload={handleLicenseUpload}
          onClear={() => setLicenseUrl('')}
          uploading={uploading}
        />
        <FileUploadBox
          label="Valid Government ID"
          url={idUrl}
          onUpload={handleIdUpload}
          onClear={() => setIdUrl('')}
          uploading={uploading}
        />
      </div>
    </div>
  )
}

// ─── price summary ────────────────────────────────────────────────────────────

function PriceSummary({ pricePerDay, totalDays }) {
  const subtotal = pricePerDay * totalDays

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
      <div className="flex justify-between text-gray-600">
        <span>₱{Number(pricePerDay).toLocaleString()} × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
        <span>₱{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Service fee</span>
        <span className="text-green-600">Free</span>
      </div>
      <hr className="border-gray-200" />
      <div className="flex justify-between font-semibold text-gray-900 text-base">
        <span>Total</span>
        <span>₱{subtotal.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { carId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: car, isLoading: carLoading } = useCar(carId)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/auth/me/').then(r => r.data),
    enabled: !!user,
  })

  const kycDone = isKycComplete(profile?.customer_profile)

  const [showKycForm, setShowKycForm] = useState(false)
  useEffect(() => {
    if (!profileLoading) setShowKycForm(!kycDone)
  }, [profileLoading, kycDone])

  const [licenseUrl, setLicenseUrl] = useState('')
  const [idUrl, setIdUrl] = useState('')

  useEffect(() => {
    if (profile?.customer_profile) {
      setLicenseUrl(profile.customer_profile.drivers_license_url || '')
      setIdUrl(profile.customer_profile.valid_id_url || '')
    }
  }, [profile])

  const [range, setRange] = useState({ from: undefined, to: undefined })
  const totalDays = range.from && range.to
    ? Math.max(1, differenceInDays(range.to, range.from))
    : 0

  const [paymentMethod, setPaymentMethod] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [gcashRef, setGcashRef] = useState('')

  const createBooking = useCreateBooking()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      birthday: profile?.customer_profile?.birthday || '',
      address: profile?.customer_profile?.address || '',
      drivers_license_number: profile?.customer_profile?.drivers_license_number || '',
      license_expiry: profile?.customer_profile?.license_expiry || '',
      valid_id_type: profile?.customer_profile?.valid_id_type || '',
    },
  })

  if (carLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!car) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Car not found.</p>
        <button onClick={() => navigate('/cars')} className="mt-4 text-blue-600 text-sm hover:underline">
          Browse cars
        </button>
      </div>
    )
  }

  const canSubmit =
    range.from &&
    range.to &&
    totalDays > 0 &&
    paymentMethod &&
    (paymentMethod !== 'gcash' || gcashRef.trim()) &&
    (!showKycForm || (licenseUrl && idUrl))

  const onSubmit = async (kycData) => {
    if (!range.from || !range.to) { toast.error('Please select your rental dates.'); return }
    if (!paymentMethod) { toast.error('Please choose a payment method.'); return }
    if (showKycForm && (!licenseUrl || !idUrl)) {
      toast.error('Please upload both your license and valid ID.')
      return
    }

    try {
      if (showKycForm) {
        await api.post('/bookings/kyc/', {
          ...kycData,
          drivers_license_url: licenseUrl,
          valid_id_url: idUrl,
        })
      }

      const booking = await createBooking.mutateAsync({
        car: carId,
        start_date: format(range.from, 'yyyy-MM-dd'),
        end_date: format(range.to, 'yyyy-MM-dd'),
        payment_method: paymentMethod,
        gcash_reference: gcashRef || undefined,
        special_requests: specialRequests || undefined,
      })

      navigate(`/booking/confirmation/${booking.booking_code}`, { state: { booking, car } })
    } catch {
      // errors handled in useCreateBooking onError toast
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <button
        onClick={() => navigate(`/cars/${carId}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft size={16} />
        Back to car
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Complete your booking</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── LEFT ── */}
          <div className="lg:col-span-3 space-y-8">

            {/* 1. Dates */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeading>
                <span className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-blue-500" />
                  Pick your dates
                </span>
              </SectionHeading>

              <DayPicker
                mode="range"
                selected={range}
                onSelect={setRange}
                disabled={{ before: addDays(today, 1) }}
                numberOfMonths={1}
                className="!font-sans"
              />

              {range.from && range.to && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-2.5 rounded-xl">
                  <CalendarDays size={15} />
                  <span>
                    {format(range.from, 'MMM d')} → {format(range.to, 'MMM d, yyyy')} · {totalDays} day{totalDays !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* 2. KYC */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionHeading>Your details</SectionHeading>
                {kycDone && (
                  <button
                    type="button"
                    onClick={() => setShowKycForm(v => !v)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                  >
                    {showKycForm ? <><ChevronUp size={15} /> Hide</> : <><ChevronDown size={15} /> Edit my info</>}
                  </button>
                )}
              </div>

              {kycDone && !showKycForm && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Your info is on file</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      We'll use your saved license and ID for this booking.
                      You can update it anytime using the edit button above.
                    </p>
                  </div>
                </div>
              )}

              {showKycForm && (
                <KycForm
                  register={register}
                  errors={errors}
                  licenseUrl={licenseUrl}
                  setLicenseUrl={setLicenseUrl}
                  idUrl={idUrl}
                  setIdUrl={setIdUrl}
                />
              )}
            </div>

            {/* 3. Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeading>Payment method</SectionHeading>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { value: 'gcash', label: 'GCash', icon: CreditCard },
                  { value: 'cash',  label: 'Cash',  icon: Banknote  },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-center justify-center gap-2.5 py-3.5 rounded-xl
                                border-2 text-sm font-medium transition ${
                      paymentMethod === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-blue-200'
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'gcash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    GCash Reference Number
                  </label>
                  <input
                    type="text"
                    value={gcashRef}
                    onChange={e => setGcashRef(e.target.value)}
                    placeholder="e.g. 1234567890"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Send payment to the partner's GCash first, then enter the reference number here.
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3.5">
                  💵 Cash payment is settled directly with the partner on pickup day.
                </div>
              )}
            </div>

            {/* 4. Special Requests */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <SectionHeading>Special requests <span className="font-normal text-gray-400">(optional)</span></SectionHeading>
              <textarea
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                rows={3}
                placeholder="Any notes for the partner — preferred pickup time, child seats, etc."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

          </div>

          {/* ── RIGHT: Summary card ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-20 space-y-5">

              <div className="flex gap-3">
                {car.primary_image ? (
                  <img src={car.primary_image} alt={car.name}
                       className="w-20 h-14 object-cover rounded-xl shrink-0" />
                ) : (
                  <div className="w-20 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-2xl">
                    🚗
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{car.name}</p>
                  {car.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin size={11} />
                      <span className="truncate">{car.location}</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {car.transmission && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {car.transmission}
                      </span>
                    )}
                    {car.seats && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        {car.seats} seats
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {totalDays > 0 ? (
                <PriceSummary pricePerDay={car.price_per_day} totalDays={totalDays} />
              ) : (
                <p className="text-sm text-gray-400 text-center py-2">
                  Select dates to see total
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || createBooking.isPending}
                className={`w-full py-3.5 rounded-xl text-sm font-semibold transition ${
                  canSubmit && !createBooking.isPending
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {createBooking.isPending ? 'Submitting…' : 'Confirm Booking'}
              </button>

              <p className="text-xs text-center text-gray-400">
                Your booking will be reviewed by the partner before confirmation.
              </p>

            </div>
          </div>

        </div>
      </form>
    </div>
  )
}