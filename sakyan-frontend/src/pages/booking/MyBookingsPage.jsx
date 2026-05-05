import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CalendarDays, MapPin, CreditCard, Banknote, ClipboardList,
  Truck, Building2, MessageCircle, CheckCircle2, X, Timer,
  ChevronRight, Clock, Flag, LayoutGrid, List,
} from 'lucide-react'
import { useMyBookings } from '@/hooks/useBookings'
import { useResponsiveView } from '@/hooks/useResponsiveView'

// ─── constants ────────────────────────────────────────────────────────────────

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
  approved:       'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  rejected:       'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  active:         'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed:      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelled:      'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
}

const STATUS_DOT = {
  pending_review: 'bg-yellow-500',
  approved:       'bg-blue-500',
  rejected:       'bg-red-500',
  active:         'bg-emerald-500',
  completed:      'bg-gray-400',
  cancelled:      'bg-red-400',
}

const FILTERS = ['all', 'pending_review', 'approved', 'active', 'completed', 'rejected', 'cancelled']

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatPHTime(isoStr) {
  if (!isoStr) return null
  try {
    return new Date(isoStr).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch {
    return new Date(isoStr).toLocaleString()
  }
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] || 'bg-gray-400'}`} />
      {STATUS_LABEL[status] || status}
    </span>
  )
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────

function BookingDetailModal({ booking, onClose }) {
  const navigate = useNavigate()
  const canMessage = ['pending_review', 'approved', 'active'].includes(booking.booking_status)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-[#1a1d2e] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Booking Details</h2>
              <StatusBadge status={booking.booking_status} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">#{booking.booking_code}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-2 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Car banner */}
          <div className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            {booking.car_image ? (
              <img src={booking.car_image} alt={booking.car_name}
                className="w-20 h-14 object-cover rounded-xl shrink-0 border border-gray-200 dark:border-gray-700"
                onError={e => { e.target.style.display = 'none' }} />
            ) : (
              <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl shrink-0">🚗</div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 dark:text-white truncate">{booking.car_name}</p>
              {booking.car_location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <MapPin size={11} /> <span className="truncate">{booking.car_location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rental Timeline */}
          {booking.actual_start_time && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-3">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Timer size={12} /> Rental Timeline
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Car received
                  </span>
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">{formatPHTime(booking.actual_start_time)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Flag size={11} /> Must return by
                  </span>
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">{booking.end_date}</span>
                </div>
                {booking.actual_return_time && (
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <CheckCircle2 size={11} /> Returned
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formatPHTime(booking.actual_return_time)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-4 pt-3 pb-2 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Booking Summary</p>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><CalendarDays size={12} /> Dates</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {format(new Date(booking.start_date), 'MMM d')} → {format(new Date(booking.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Clock size={12} /> Duration</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{booking.total_days} day{booking.total_days !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  {booking.fulfillment_type === 'delivery' ? <Truck size={12} /> : <Building2 size={12} />} Fulfillment
                </span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  booking.fulfillment_type === 'delivery'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                  {booking.fulfillment_type === 'delivery' ? '🚚 Delivery' : '🏢 Self-Pickup'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 text-xs">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  {booking.payment_method === 'gcash' ? <CreditCard size={12} /> : <Banknote size={12} />} Payment
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {booking.payment_method === 'gcash' ? '💳 GCash' : '💵 Cash'}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Total</span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">₱{Number(booking.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          {booking.fulfillment_type === 'delivery' && booking.delivery_address && (
            <div className="flex items-start gap-2 text-xs bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3">
              <MapPin size={12} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-blue-700 dark:text-blue-400 leading-relaxed">Deliver to: {booking.delivery_address}</p>
            </div>
          )}

          {/* Approved next step */}
          {booking.booking_status === 'approved' && (
            <div className={`rounded-2xl border px-4 py-3 space-y-1.5 ${
              booking.fulfillment_type === 'delivery'
                ? 'bg-blue-50 dark:bg-blue-900/15 border-blue-200 dark:border-blue-900/40'
                : 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-900/40'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                booking.fulfillment_type === 'delivery' ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {booking.fulfillment_type === 'delivery'
                  ? <><Truck size={13} /> Delivery Confirmed</>
                  : <><CheckCircle2 size={13} /> Booking Approved — What's next?</>}
              </p>
              {booking.fulfillment_type === 'delivery' ? (
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  🚚 Delivery on <strong>{booking.start_date}</strong>. Chat to confirm the exact time.
                </p>
              ) : (
                <p className="text-xs text-emerald-800 dark:text-emerald-300">
                  📍 Pick up on <strong>{booking.start_date}</strong>. Chat to confirm pickup time.
                </p>
              )}
            </div>
          )}

          {/* Active reminder */}
          {booking.booking_status === 'active' && booking.actual_start_time && !booking.actual_return_time && (
            <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Rental in progress — please return by <strong>{booking.end_date}</strong>
              </p>
            </div>
          )}

          {/* Rejection reason */}
          {booking.booking_status === 'rejected' && booking.admin_notes && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl px-4 py-3">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 uppercase tracking-wide">Rejection Reason</p>
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{booking.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {canMessage && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <button
              onClick={() => navigate(`/messages?booking=${booking.id}`)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm
                         bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700
                         text-white transition shadow-md shadow-brand-500/20"
            >
              <MessageCircle size={16} />
              {booking.booking_status === 'approved'
                ? (booking.fulfillment_type === 'delivery' ? 'Chat to confirm delivery' : 'Chat for pickup details')
                : booking.booking_status === 'active' ? 'Message partner'
                : 'Chat with partner'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card View ────────────────────────────────────────────────────────────────

function BookingCard({ booking, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800
                 hover:shadow-lg hover:border-brand-200 dark:hover:border-brand-700/50 transition-all duration-200 group overflow-hidden"
    >
      {/* Car image */}
      <div className="relative h-28 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {booking.car_image ? (
          <img src={booking.car_image} alt={booking.car_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🚗</div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={booking.booking_status} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{booking.car_name}</p>
            {booking.car_location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <MapPin size={10} /><span className="truncate">{booking.car_location}</span>
              </div>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5 group-hover:text-brand-400 transition" />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <CalendarDays size={11} />
            <span>{format(new Date(booking.start_date), 'MMM d')} → {format(new Date(booking.end_date), 'MMM d, yyyy')}</span>
          </div>
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium ${
            booking.fulfillment_type === 'delivery'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
          }`}>
            {booking.fulfillment_type === 'delivery' ? <Truck size={10} /> : <Building2 size={10} />}
            {booking.fulfillment_type === 'delivery' ? 'Delivery' : 'Self-Pickup'}
          </div>
        </div>

        {booking.booking_status === 'active' && booking.actual_start_time && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            In progress · Return by {booking.end_date}
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">#{booking.booking_code}</p>
          <p className="text-sm font-bold text-brand-600 dark:text-brand-400">₱{Number(booking.total_amount).toLocaleString()}</p>
        </div>
      </div>
    </button>
  )
}

// ─── List View ────────────────────────────────────────────────────────────────

function BookingListRow({ booking, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800
                 hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-sm
                 transition-all duration-150 group"
    >
      <div className="flex items-center gap-3 sm:gap-4 px-4 py-3.5">
        {/* Car thumbnail */}
        <div className="w-14 h-10 sm:w-16 sm:h-11 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0">
          {booking.car_image ? (
            <img src={booking.car_image} alt={booking.car_name}
              className="w-full h-full object-cover"
              onError={e => { e.target.style.display = 'none' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🚗</div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{booking.car_name}</p>
            <StatusBadge status={booking.booking_status} />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <CalendarDays size={10} />
              {format(new Date(booking.start_date), 'MMM d')} → {format(new Date(booking.end_date), 'MMM d, yyyy')}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              {booking.fulfillment_type === 'delivery' ? <Truck size={10} /> : <Building2 size={10} />}
              {booking.fulfillment_type === 'delivery' ? 'Delivery' : 'Self-Pickup'}
            </span>
          </div>
          {booking.booking_status === 'active' && booking.actual_start_time && (
            <div className="flex items-center gap-1. mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In progress · Return by {booking.end_date}
            </div>
          )}
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-sm font-bold text-brand-600 dark:text-brand-400">₱{Number(booking.total_amount).toLocaleString()}</p>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition" />
        </div>
      </div>
    </button>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3.5 flex items-center gap-4 animate-pulse">
      <div className="w-16 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 shrink-0" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter]       = useState('all')
  const [viewMode, setViewMode]               = useResponsiveView('list')
  const [selectedBooking, setSelectedBooking] = useState(null)

  const { data, isLoading } = useMyBookings()
  const bookings = data?.results || data || []

  const filtered = activeFilter === 'all'
    ? bookings
    : bookings.filter(b => b.booking_status === activeFilter)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            {isLoading ? 'Loading…' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button onClick={() => setViewMode('card')} title="Card view"
            className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode('list')} title="List view"
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              activeFilter === f
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'
            }`}>
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {/* ── Card View ── */}
      {viewMode === 'card' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(b => <BookingCard key={b.id} booking={b} onClick={() => setSelectedBooking(b)} />)}
            </div>
          ) : (
            <EmptyState activeFilter={activeFilter} navigate={navigate} />
          )}
        </>
      )}

      {/* ── List View ── */}
      {viewMode === 'list' && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <ListSkeleton key={i} />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map(b => <BookingListRow key={b.id} booking={b} onClick={() => setSelectedBooking(b)} />)}
            </div>
          ) : (
            <EmptyState activeFilter={activeFilter} navigate={navigate} />
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  )
}

function EmptyState({ activeFilter, navigate }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <ClipboardList size={28} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No bookings yet</p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
        {activeFilter === 'all' ? "You haven't made any bookings yet." : `No ${STATUS_LABEL[activeFilter]?.toLowerCase()} bookings.`}
      </p>
      {activeFilter === 'all' && (
        <button onClick={() => navigate('/cars')}
          className="mt-6 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition">
          Browse cars
        </button>
      )}
    </div>
  )
}