import { useState } from 'react'
import { useAdminAllBookings } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Search, ChevronDown, ChevronUp, User, Phone, Mail, Car, FileText } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

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
  pending_review: 'bg-amber-100 text-amber-700',
  approved:       'bg-blue-100 text-blue-700',
  active:         'bg-green-100 text-green-700',
  completed:      'bg-gray-100 text-gray-600',
  rejected:       'bg-red-100 text-red-600',
  cancelled:      'bg-red-50 text-red-400',
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function BookingRow({ booking }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-white px-4 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{booking.car_name}</p>
            <StatusBadge status={booking.booking_status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {booking.customer_name} → {booking.partner_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            #{booking.booking_code} · {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900">{formatCurrency(booking.total_amount)}</p>
          <p className="text-xs text-green-600 font-medium">
            +{formatCurrency(booking.commission_amount)} commission
          </p>
          <p className="text-xs text-gray-400">{booking.payment_method?.toUpperCase()}</p>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="p-2 text-gray-400 hover:text-gray-600 shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Customer */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={13} className="text-gray-400" />{booking.customer_name}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={13} className="text-gray-400" />{booking.customer_email}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={13} className="text-gray-400" />{booking.customer_phone || '—'}
                </div>
              </div>
            </div>

            {/* Partner + car */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Partner & Car</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Car size={13} className="text-gray-400" />{booking.car_name}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={13} className="text-gray-400" />{booking.partner_name}
                </div>
                {booking.car_location && (
                  <p className="text-xs text-gray-400">{booking.car_location}</p>
                )}
              </div>
            </div>
          </div>

          {/* KYC docs */}
          {(booking.drivers_license_url || booking.valid_id_url) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">KYC Documents</p>
              <div className="flex gap-3 flex-wrap">
                {booking.drivers_license_url && (
                  <a href={booking.drivers_license_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                                rounded-lg text-xs text-blue-600 hover:border-blue-300 transition">
                    <FileText size={13} />Driver's License
                  </a>
                )}
                {booking.valid_id_url && (
                  <a href={booking.valid_id_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                                rounded-lg text-xs text-blue-600 hover:border-blue-300 transition">
                    <FileText size={13} />Valid ID
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>{booking.total_days} day{booking.total_days !== 1 ? 's' : ''} × {formatCurrency(booking.price_per_day)}</span>
              <span>{formatCurrency(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Sakyan Commission ({booking.commission_rate || 10}%)</span>
              <span>+{formatCurrency(booking.commission_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
              <span>Total Charged</span>
              <span>{formatCurrency(booking.total_amount)}</span>
            </div>
          </div>

          {booking.special_requests && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Special Requests</p>
              <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2 border border-gray-100">
                {booking.special_requests}
              </p>
            </div>
          )}

          {booking.admin_notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
              <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2 border border-gray-100">
                {booking.admin_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)

  const filters = {
    ...(statusFilter ? { booking_status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }

  const { data, isLoading } = useAdminAllBookings(filters)
  const bookings = data?.results || data || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide booking overview with full details.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search booking code, customer, car…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-500 text-sm">No bookings match this filter.</p>
        </div>
      )}

      {/* Summary strip */}
      {!isLoading && bookings.length > 0 && (
        <p className="text-xs text-gray-400 mb-3">
          Showing {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="space-y-3">
        {bookings.map(booking => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  )
}