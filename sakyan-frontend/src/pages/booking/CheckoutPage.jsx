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
    <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{children}</h2>
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
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>
      {url ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <CheckCircle2 size={16} className="text-green-600 dark:text-green-500 shrink-0" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 dark:text-green-400 hover:underline truncate flex-1"
          >
            View uploaded file
          </a>
          <button onClick={onClear} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition shrink-0">
            <X size={15} />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 p-4
                           border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800/50
                           hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-900/20 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload size={20} className="text-gray-400 dark:text-gray-500" />
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">{uploading ? 'Uploading…' : 'Click to upload'}</span>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}

// ─── KYC form ─────────────────────────────────────────────────────────────────

const inputClsKyc = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/40 focus:border-brand-500 transition-all duration-200"

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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Birthday</label>
          <input
            type="date"
            {...register('birthday')}
            className={inputClsKyc}
          />
          <FieldError message={errors.birthday?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Valid ID Type</label>
          <select
            {...register('valid_id_type')}
            className={inputClsKyc + " appearance-none"}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">License Number</label>
          <input
            type="text"
            {...register('drivers_license_number')}
            placeholder="e.g. N01-23-456789"
            className={inputClsKyc}
          />
          <FieldError message={errors.drivers_license_number?.message} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">License Expiry</label>
          <input
            type="date"
            {...register('license_expiry')}
            className={inputClsKyc}
          />
          <FieldError message={errors.license_expiry?.message} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Home Address</label>
        <textarea
          {...register('address')}
          rows={2}
          placeholder="Complete address including city and province"
          className={inputClsKyc + " resize-y"}
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

function PriceSummary({ pricePerDay, totalDays, bookingFee = 0 }) {
  const subtotal = pricePerDay * totalDays
  const total = subtotal + Number(bookingFee)

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2.5 text-sm">
      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>₱{Number(pricePerDay).toLocaleString()} × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
        <span>₱{subtotal.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-gray-600 dark:text-gray-400">
        <span>Booking fee</span>
        <span className="font-medium">₱{Number(bookingFee).toLocaleString()}</span>
      </div>
      <hr className="border-gray-200 dark:border-gray-700" />
      <div className="flex justify-between font-semibold text-gray-900 dark:text-white text-base">
        <span>Total</span>
        <span>₱{total.toLocaleString()}</span>
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

  const { data: settingsData } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => api.get('/admin/settings/').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
  const bookingFee = Number(
    settingsData?.find(s => s.key === 'booking_fee')?.value ?? 100
  )

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
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={16} />
        Back to car
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Complete your booking</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── LEFT ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* 1. Dates */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading>
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                    <CalendarDays size={16} />
                  </span>
                  Pick your dates
                </span>
              </SectionHeading>

              <div className="rdp-wrapper mt-6 flex justify-center sm:block">
                 <div className="rdp-custom-container dark:[--rdp-color-background:#374151] dark:[--rdp-color-foreground:white] dark:[--rdp-color-background-active:#4F6BF6] dark:[--rdp-color-foreground-active:white]">
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={setRange}
                        disabled={{ before: today }}
                        numberOfMonths={1}
                        className="!font-sans rdp"
                    />
                 </div>
              </div>

              {range.from && range.to && (
                <div className="mt-6 flex items-center gap-3 text-sm font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-5 py-3.5 rounded-xl border border-brand-100 dark:border-brand-800/50">
                  <CalendarDays size={18} className="shrink-0" />
                  <span>
                    {format(range.from, 'MMM d')} → {format(range.to, 'MMM d, yyyy')} <span className="opacity-50 mx-1">•</span> {totalDays} day{totalDays !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* 2. KYC */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <SectionHeading>Your details</SectionHeading>
                {kycDone && (
                  <button
                    type="button"
                    onClick={() => setShowKycForm(v => !v)}
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    {showKycForm ? <><ChevronUp size={16} /> Hide</> : <><ChevronDown size={16} /> Edit my info</>}
                  </button>
                )}
              </div>

              {kycDone && !showKycForm && (
                <div className="flex items-start gap-4 p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-2xl">
                  <CheckCircle2 size={24} className="text-green-600 dark:text-green-500 shrink-0" />
                  <div>
                    <p className="text-base font-medium text-green-900 dark:text-green-400 mb-1">Your info is on file</p>
                    <p className="text-sm text-green-700 dark:text-green-500/80 leading-relaxed">
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
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading>Payment method</SectionHeading>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { value: 'gcash', label: 'GCash', icon: CreditCard },
                  { value: 'cash',  label: 'Cash on Pickup',  icon: Banknote  },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl
                                border-2 text-base font-medium transition ${
                      paymentMethod === value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    <Icon size={20} className={paymentMethod === value ? 'text-brand-600 dark:text-brand-500' : 'text-gray-400 dark:text-gray-500'} />
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'gcash' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GCash Reference Number
                  </label>
                  <input
                    type="text"
                    value={gcashRef}
                    onChange={e => setGcashRef(e.target.value)}
                    placeholder="e.g. 1234567890"
                    className={inputClsKyc}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex gap-1.5 items-start">
                    <span className="text-blue-500 shrink-0">ℹ️</span> 
                    <span>You'll be able to message the partner to ask for their GCash number after they approve this request. Then, enter the reference number.</span>
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex gap-3 items-start animate-in fade-in duration-300">
                   <div className="text-xl">💵</div>
                   <p className="pt-0.5">Cash payment is settled directly with the partner on the pickup day. Please prepare exact amount.</p>
                </div>
              )}
            </div>

            {/* 4. Special Requests */}
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <SectionHeading>Special requests <span className="font-normal text-gray-400 dark:text-gray-500 ml-1">(optional)</span></SectionHeading>
              <textarea
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                rows={4}
                placeholder="Any requests for the partner — e.g. preferred pickup time, need child seats, etc."
                className={inputClsKyc + " resize-y"}
              />
            </div>

          </div>

          {/* ── RIGHT: Summary card ── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 sticky top-24 space-y-6">

              <div className="flex gap-4">
                {car.primary_image ? (
                  <img src={car.primary_image} alt={car.name}
                       className="w-24 h-20 object-cover rounded-xl shrink-0 border border-gray-100 dark:border-gray-700" />
                ) : (
                  <div className="w-24 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0 text-3xl">
                    🚗
                  </div>
                )}
                <div className="min-w-0 py-1">
                  <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{car.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{car.year} • {car.brand}</p>
                  {car.location && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="truncate">{car.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              {totalDays > 0 ? (
                <PriceSummary pricePerDay={car.price_per_day} totalDays={totalDays} bookingFee={bookingFee} />
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <CalendarDays size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Select dates to see total
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || createBooking.isPending}
                className={`w-full py-4 rounded-xl text-base font-bold transition shadow-sm ${
                  canSubmit && !createBooking.isPending
                    ? 'bg-brand-500 hover:bg-brand-600 text-white hover:shadow-md active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {createBooking.isPending ? 'Submitting…' : 'Confirm Booking'}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed">
                You won't be charged yet.<br/>Your booking will be reviewed by the partner first.
              </p>

            </div>
          </div>

        </div>
      </form>
    </div>
  )
}