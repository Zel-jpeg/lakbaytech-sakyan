import { useState } from 'react'
import { useAdminAllBookings } from '@/hooks/useAdmin'
import { useResponsiveView } from '@/hooks/useResponsiveView'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { format } from 'date-fns'
import {
  Search, User, Phone, Mail, Car, FileText, LayoutGrid, List,
  MapPin, Truck, Building2, CreditCard, Banknote, CalendarDays,
  ChevronRight, Timer, Flag, X,
} from 'lucide-react'

// ─── constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { value: '',               label: 'All' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved',       label: 'Approved' },
  { value: 'active',         label: 'Active' },
  { value: 'completed',      label: 'Completed' },
  { value: 'rejected',       label: 'Rejected' },
  { value: 'cancelled',      label: 'Cancelled' },
]

const STATUS_STYLES = {
  pending_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  rejected:       'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  cancelled:      'bg-red-50 text-red-400 dark:bg-red-900/20 dark:text-red-400',
}

const STATUS_DOT = {
  pending_review: 'bg-amber-500',
  approved:       'bg-blue-500',
  active:         'bg-emerald-500',
  completed:      'bg-gray-400',
  rejected:       'bg-red-500',
  cancelled:      'bg-red-400',
}

function customerPhone(b) {
  return b.customer_profile?.contact_number || b.customer_phone || '—'
}

function formatPHTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
    })
  } catch { return new Date(iso).toLocaleString() }
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status] || 'bg-gray-400'}`} />
      {status?.replace('_', ' ')}
    </span>
  )
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────
function BookingModal({ booking: b, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#1a1d2e] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900 dark:text-white text-base">{b.car_name}</h2>
              <StatusBadge status={b.booking_status} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">#{b.booking_code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-2 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Car image */}
          {b.car_image && (
            <div className="h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img src={b.car_image} alt={b.car_name} className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
            </div>
          )}

          {/* Customer & Partner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Customer</p>
              <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5"><User size={12} className="text-gray-400" />{b.customer_name}</div>
                <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400" /><span className="truncate">{b.customer_email}</span></div>
                <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{customerPhone(b)}</div>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Partner & Car</p>
              <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1.5"><Car size={12} className="text-gray-400" />{b.car_name}</div>
                <div className="flex items-center gap-1.5"><User size={12} className="text-gray-400" />{b.partner_name}</div>
                {b.car_location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /><span className="truncate">{b.car_location}</span></div>}
              </div>
            </div>
          </div>

          {/* Rental tracker */}
          {(b.actual_start_time || b.actual_return_time) && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1"><Timer size={11} /> Rental Tracker</p>
              {b.actual_start_time && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5"><Flag size={10} /> Handed over</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatPHTime(b.actual_start_time)}</span>
                </div>
              )}
              {b.actual_return_time && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Returned</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{formatPHTime(b.actual_return_time)}</span>
                </div>
              )}
            </div>
          )}

          {/* KYC Docs */}
          {(b.customer_profile?.drivers_license_url || b.customer_profile?.valid_id_url) && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">KYC Documents</p>
              <div className="flex gap-2 flex-wrap">
                {b.customer_profile?.drivers_license_url && (
                  <a href={b.customer_profile.drivers_license_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-brand-600 dark:text-brand-400 hover:border-brand-300 transition">
                    <FileText size={12} /> Driver's License
                  </a>
                )}
                {b.customer_profile?.valid_id_url && (
                  <a href={b.customer_profile.valid_id_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-brand-600 dark:text-brand-400 hover:border-brand-300 transition">
                    <FileText size={12} /> Valid ID
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>{b.total_days} day{b.total_days !== 1 ? 's' : ''} × {formatCurrency(b.price_per_day)}</span>
              <span>{formatCurrency(b.subtotal)}</span>
            </div>
            {Number(b.booking_fee) > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Booking Fee</span><span>+{formatCurrency(b.booking_fee)}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Commission ({b.commission_rate || 10}%)</span><span>+{formatCurrency(b.commission_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-200 dark:border-gray-700 text-sm">
              <span>Total Charged</span><span>{formatCurrency(b.total_amount)}</span>
            </div>
          </div>

          {/* Dates + fulfillment */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
              <p className="text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1"><CalendarDays size={11} /> Rental period</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">{format(new Date(b.start_date), 'MMM d')} → {format(new Date(b.end_date), 'MMM d, yyyy')}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
              <p className="text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                {b.fulfillment_type === 'delivery' ? <Truck size={11} /> : <Building2 size={11} />} Fulfillment
              </p>
              <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{b.fulfillment_type}</p>
            </div>
          </div>

          {b.fulfillment_type === 'delivery' && b.delivery_address && (
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-2.5 text-xs">
              <Truck size={12} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-blue-700 dark:text-blue-400">Deliver to: {b.delivery_address}</p>
            </div>
          )}

          {b.special_requests && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Special Requests</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 rounded-xl px-3 py-2">{b.special_requests}</p>
            </div>
          )}
          {b.admin_notes && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Admin Notes</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/40 rounded-xl px-3 py-2">{b.admin_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function BookingRow({ booking: b, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5
                 hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-sm transition-all group flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{b.car_name}</p>
          <StatusBadge status={b.booking_status} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {b.customer_name} → {b.partner_name}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
          #{b.booking_code} · {formatDate(b.start_date)} – {formatDate(b.end_date)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(b.total_amount)}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">+{formatCurrency(b.commission_amount)}</p>
        {Number(b.booking_fee) > 0 && <p className="text-xs text-amber-500">+{formatCurrency(b.booking_fee)} fee</p>}
      </div>
      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition shrink-0" />
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function BookingCard({ booking: b, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden
                 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700/50 transition-all group">
      <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800">
        {b.car_image ? (
          <img src={b.car_image} alt={b.car_name} className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🚗</div>
        )}
        <div className="absolute top-2 left-2"><StatusBadge status={b.booking_status} /></div>
        {Number(b.booking_fee) > 0 && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300">
              +{formatCurrency(b.booking_fee)} fee
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{b.car_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{b.customer_name} → {b.partner_name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(b.total_amount)}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">+{formatCurrency(b.commission_amount)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <CalendarDays size={11} />
          {format(new Date(b.start_date), 'MMM d')} → {format(new Date(b.end_date), 'MMM d, yyyy')}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          {b.fulfillment_type === 'delivery' ? <Truck size={11} /> : <Building2 size={11} />}
          {b.fulfillment_type}
          <span>·</span>
          {b.payment_method === 'gcash' ? <CreditCard size={11} /> : <Banknote size={11} />}
          {b.payment_method?.toUpperCase()}
        </div>
      </div>
    </button>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function RowSkel() { return <div className="h-[82px] bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" /> }
function CardSkel() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-200 dark:bg-gray-700" />
      <div className="p-3 space-y-2"><div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" /><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" /></div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState(null)
  const [viewMode, setViewMode]         = useResponsiveView('list')

  const filters = {
    ...(statusFilter ? { booking_status: statusFilter } : {}),
    ...(search       ? { search }                       : {}),
  }

  const { data, isLoading } = useAdminAllBookings(filters)
  const bookings = data?.results || data || []

  const totalCommission = bookings.reduce((a, b) => a + Number(b.commission_amount || 0), 0)
  const totalFees       = bookings.reduce((a, b) => a + Number(b.booking_fee || 0), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Platform-wide booking overview.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search booking code, customer, car…"
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-[#1a1d2e] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 shrink-0 self-start sm:self-auto">
          <button onClick={() => setViewMode('list')} title="List" className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}><List size={16} /></button>
          <button onClick={() => setViewMode('card')} title="Card" className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${statusFilter === tab.value ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {!isLoading && bookings.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 px-1">
          <span>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Commission: {formatCurrency(totalCommission)}</span>
          {totalFees > 0 && <span className="text-amber-600 dark:text-amber-400 font-semibold">Fees: {formatCurrency(totalFees)}</span>}
        </div>
      )}

      {isLoading && (viewMode === 'list'
        ? <div className="space-y-2">{[...Array(6)].map((_, i) => <RowSkel key={i} />)}</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <CardSkel key={i} />)}</div>
      )}
      {!isLoading && bookings.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No bookings match this filter.</p>
        </div>
      )}
      {!isLoading && bookings.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">{bookings.map(b => <BookingRow key={b.id} booking={b} onClick={() => setSelected(b)} />)}</div>
      )}
      {!isLoading && bookings.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{bookings.map(b => <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />)}</div>
      )}

      {selected && <BookingModal booking={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}