import { useState } from 'react'
import { usePartnerBookings, useUpdateBookingStatus } from '@/hooks/useBookings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp, User, Phone, Mail, FileText } from 'lucide-react'

const STATUS_TABS = [
  { value: '',               label: 'All' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved',       label: 'Approved' },
  { value: 'active',         label: 'Active' },
  { value: 'completed',      label: 'Completed' },
  { value: 'rejected',       label: 'Rejected' },
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
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
      STATUS_STYLES[status] || 'bg-gray-100 text-gray-500'
    }`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function BookingRow({ booking }) {
  const [expanded, setExpanded] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const updateStatus = useUpdateBookingStatus()

  const isPending = booking.booking_status === 'pending_review'

  const handleApprove = () => {
    updateStatus.mutate({ id: booking.id, action: 'approve' })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return
    updateStatus.mutate({ id: booking.id, action: 'reject', reason: rejectReason })
    setShowRejectInput(false)
  }

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      {/* Row summary */}
      <div className="bg-white px-4 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{booking.car_name}</p>
            <StatusBadge status={booking.booking_status} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {booking.customer_name} · #{booking.booking_code}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDate(booking.start_date)} → {formatDate(booking.end_date)} · {booking.total_days} day{booking.total_days !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900">{formatCurrency(booking.total_amount)}</p>
          <p className="text-xs text-gray-400">{booking.payment_method?.toUpperCase()}</p>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="p-2 text-gray-400 hover:text-gray-600 transition shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded: customer KYC + actions */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">

          {/* Customer info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={14} className="text-gray-400" />
                {booking.customer_name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={14} className="text-gray-400" />
                {booking.customer_email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={14} className="text-gray-400" />
                {booking.customer_phone || '—'}
              </div>
            </div>
          </div>

          {/* KYC documents */}
          {(booking.drivers_license_url || booking.valid_id_url) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Submitted Documents</p>
              <div className="flex gap-3 flex-wrap">
                {booking.drivers_license_url && (
                  <a href={booking.drivers_license_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                                rounded-lg text-xs text-blue-600 hover:border-blue-300 transition">
                    <FileText size={13} />
                    Driver's License
                  </a>
                )}
                {booking.valid_id_url && (
                  <a href={booking.valid_id_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                                rounded-lg text-xs text-blue-600 hover:border-blue-300 transition">
                    <FileText size={13} />
                    Valid ID
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Special requests */}
          {booking.special_requests && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Special Requests</p>
              <p className="text-sm text-gray-700 bg-white rounded-xl px-3 py-2 border border-gray-100">
                {booking.special_requests}
              </p>
            </div>
          )}

          {/* Approve / Reject actions */}
          {isPending && (
            <div className="flex flex-col gap-2">
              {showRejectInput ? (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection (required)"
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                               focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || updateStatus.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700
                                 disabled:bg-gray-200 text-white text-sm font-semibold rounded-xl transition"
                    >
                      <XCircle size={15} />
                      Confirm Reject
                    </button>
                    <button onClick={() => setShowRejectInput(false)}
                            className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:border-gray-300 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={updateStatus.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700
                               text-white text-sm font-semibold rounded-xl transition"
                  >
                    <CheckCircle2 size={15} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200
                               hover:border-red-300 text-red-600 text-sm font-semibold rounded-xl transition"
                  >
                    <XCircle size={15} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PartnerBookingsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, isLoading } = usePartnerBookings(statusFilter ? { booking_status: statusFilter } : {})
  const bookings = data?.results || data || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and manage incoming booking requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-500 text-sm">No bookings found for this filter.</p>
        </div>
      )}

      <div className="space-y-3">
        {bookings.map(booking => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  )
}