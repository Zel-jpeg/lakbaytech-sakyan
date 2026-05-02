import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CalendarDays, MapPin, CreditCard,
  Banknote, ChevronRight, ClipboardList,
} from 'lucide-react'
import { useMyBookings } from '@/hooks/useBookings'

const STATUS_LABEL = {
  pending_review: 'Pending Review',
  approved:       'Approved',
  rejected:       'Rejected',
  active:         'Active',
  completed:      'Completed',
  cancelled:      'Cancelled',
}

const STATUS_STYLE = {
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved:       'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected:       'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  active:         'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed:      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelled:      'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}

const FILTERS = ['all', 'pending_review', 'approved', 'active', 'completed', 'rejected', 'cancelled']

function BookingCard({ booking }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/cars/${booking.car_id}`)}
      className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5
                 hover:shadow-md dark:hover:shadow-dark-card transition cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {booking.car_image ? (
          <img src={booking.car_image} alt={booking.car_name}
               className="w-20 h-14 object-cover rounded-xl shrink-0" />
        ) : (
          <div className="w-20 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
            🚗
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{booking.car_name}</p>
              {booking.car_location && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <MapPin size={11} />
                  <span className="truncate">{booking.car_location}</span>
                </div>
              )}
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[booking.booking_status]}`}>
              {STATUS_LABEL[booking.booking_status]}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <CalendarDays size={12} />
              <span>
                {format(new Date(booking.start_date), 'MMM d')} → {format(new Date(booking.end_date), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {booking.payment_method === 'gcash' ? <CreditCard size={12} /> : <Banknote size={12} />}
              <span>{booking.payment_method === 'gcash' ? 'GCash' : 'Cash'}</span>
            </div>
          </div>
        </div>

        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition shrink-0 mt-1" />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{booking.booking_code}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          ₱{Number(booking.total_amount).toLocaleString()}
        </p>
      </div>

      {booking.booking_status === 'rejected' && booking.admin_notes && (
        <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          Reason: {booking.admin_notes}
        </div>
      )}
    </div>
  )
}

function BookingSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')

  const { data, isLoading } = useMyBookings()
  const bookings = data?.results || data || []

  const filtered = activeFilter === 'all'
    ? bookings
    : bookings.filter(b => b.booking_status === activeFilter)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {isLoading ? 'Loading…' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              activeFilter === f
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <BookingSkeleton key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(b => <BookingCard key={b.id} booking={b} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <ClipboardList size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No bookings yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {activeFilter === 'all'
              ? "You haven't made any bookings yet."
              : `No ${STATUS_LABEL[activeFilter]?.toLowerCase()} bookings.`}
          </p>
          {activeFilter === 'all' && (
            <button
              onClick={() => navigate('/cars')}
              className="mt-6 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition"
            >
              Browse cars
            </button>
          )}
        </div>
      )}

    </div>
  )
}