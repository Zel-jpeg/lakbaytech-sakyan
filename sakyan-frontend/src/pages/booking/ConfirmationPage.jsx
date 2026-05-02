import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CheckCircle2, CalendarDays, CreditCard,
  Banknote, MapPin, ClipboardList, Car,
} from 'lucide-react'

const STATUS_LABEL = {
  pending_review: 'Pending Review',
  approved:       'Approved',
  rejected:       'Rejected',
  active:         'Active',
  completed:      'Completed',
  cancelled:      'Cancelled',
}

const STATUS_STYLE = {
  pending_review: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  approved:       'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  rejected:       'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  active:         'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  completed:      'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
  cancelled:      'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800/60 last:border-0">
      <Icon size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
      <span className="text-sm text-gray-500 dark:text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 text-right md:text-left flex-1 break-all">{value}</span>
    </div>
  )
}

export default function ConfirmationPage() {
  const { bookingCode } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const booking = state?.booking
  const car     = state?.car

  // Fallback — if someone lands here directly without state
  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <span className="text-6xl">🎉</span>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">Booking Submitted!</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Booking code: <span className="font-mono font-semibold text-gray-800 dark:text-gray-300">{bookingCode}</span>
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          The partner will review your booking shortly.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/booking/my-bookings')}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition shadow-sm"
          >
            View my bookings
          </button>
          <button
            onClick={() => navigate('/cars')}
            className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1d2e] rounded-xl text-sm font-semibold hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Browse more cars
          </button>
        </div>
      </div>
    )
  }

  const startDate = format(new Date(booking.start_date), 'MMM d, yyyy')
  const endDate   = format(new Date(booking.end_date),   'MMM d, yyyy')

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">

      {/* Success header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
          <CheckCircle2 size={40} className="text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Booking Submitted!</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
          The partner will review your request and confirm shortly.
        </p>
      </div>

      {/* Booking code */}
      <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-6">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-2">
          Booking Code
        </p>
        <p className="text-4xl font-mono font-bold text-brand-600 dark:text-brand-500 text-center tracking-wider py-2">
          {booking.booking_code}
        </p>
        <div className="mt-4 flex justify-center">
          <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${STATUS_STYLE[booking.booking_status] || STATUS_STYLE.pending_review}`}>
            {STATUS_LABEL[booking.booking_status] || 'Pending Review'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 mb-8">
        {car && (
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            {car.primary_image ? (
              <img src={car.primary_image} alt={car.name}
                   className="w-20 h-16 object-cover rounded-xl shrink-0 border border-gray-100 dark:border-gray-700" />
            ) : (
              <div className="w-20 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
                🚗
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-base leading-snug">{car.name}</p>
              {car.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{car.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1">
          <DetailRow icon={CalendarDays} label="Dates"
                     value={`${startDate} → ${endDate}`} />
          <DetailRow icon={CalendarDays} label="Duration"
                     value={`${booking.total_days} day${booking.total_days !== 1 ? 's' : ''}`} />
          <DetailRow
            icon={booking.payment_method === 'gcash' ? CreditCard : Banknote}
            label="Payment"
            value={booking.payment_method === 'gcash' ? 'GCash' : 'Cash on pickup'}
          />
          {booking.gcash_reference && (
            <DetailRow icon={CreditCard} label="GCash Ref" value={booking.gcash_reference} />
          )}
          <DetailRow icon={Car} label="Total Amount"
                     value={`₱${Number(booking.total_amount).toLocaleString()}`} />
        </div>
      </div>

      {/* Info note */}
      <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/50 rounded-2xl p-5 mb-8 text-sm text-brand-800 dark:text-brand-300 leading-relaxed shadow-sm">
        <span className="text-base mr-2">💡</span> You'll be notified via email once the partner approves or rejects your booking.
        You can also check the status anytime in <strong>My Bookings</strong>.
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/booking/my-bookings')}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-brand-600
                     hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition active:scale-[0.98]"
        >
          <ClipboardList size={18} />
          View my bookings
        </button>
        <button
          onClick={() => navigate('/cars')}
          className="flex-1 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1d2e] rounded-xl
                     text-sm font-bold hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm"
        >
          Browse more cars
        </button>
      </div>

    </div>
  )
}