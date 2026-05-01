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
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved:       'bg-green-100 text-green-800',
  rejected:       'bg-red-100 text-red-800',
  active:         'bg-blue-100 text-blue-800',
  completed:      'bg-gray-100 text-gray-800',
  cancelled:      'bg-red-50 text-red-600',
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <Icon size={16} className="text-gray-400 shrink-0" />
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
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
        <h1 className="mt-4 text-xl font-bold text-gray-900">Booking Submitted!</h1>
        <p className="mt-2 text-gray-500">
          Booking code: <span className="font-mono font-semibold text-gray-800">{bookingCode}</span>
        </p>
        <p className="mt-1 text-sm text-gray-400">
          The partner will review your booking shortly.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/booking/my-bookings')}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            View my bookings
          </button>
          <button
            onClick={() => navigate('/cars')}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-blue-300 transition"
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Booking Submitted!</h1>
        <p className="text-gray-500 mt-2 text-sm">
          The partner will review your request and confirm shortly.
        </p>
      </div>

      {/* Booking code */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest text-center mb-2">
          Booking Code
        </p>
        <p className="text-3xl font-mono font-bold text-blue-600 text-center tracking-wider">
          {booking.booking_code}
        </p>
        <div className="mt-3 flex justify-center">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLE[booking.booking_status] || STATUS_STYLE.pending_review}`}>
            {STATUS_LABEL[booking.booking_status] || 'Pending Review'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        {car && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            {car.primary_image ? (
              <img src={car.primary_image} alt={car.name}
                   className="w-16 h-12 object-cover rounded-xl shrink-0" />
            ) : (
              <div className="w-16 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                🚗
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 text-sm">{car.name}</p>
              {car.location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin size={11} />
                  <span>{car.location}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
        <DetailRow icon={Car} label="Total"
                   value={`₱${Number(booking.total_amount).toLocaleString()}`} />
      </div>

      {/* Info note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-700">
        💡 You'll be notified once the partner approves or rejects your booking.
        You can also check the status anytime in <strong>My Bookings</strong>.
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/booking/my-bookings')}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600
                     hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
        >
          <ClipboardList size={16} />
          View my bookings
        </button>
        <button
          onClick={() => navigate('/cars')}
          className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl
                     text-sm font-semibold hover:border-blue-300 transition"
        >
          Browse more cars
        </button>
      </div>

    </div>
  )
}