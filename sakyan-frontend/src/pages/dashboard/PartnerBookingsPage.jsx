import { useState } from 'react'
import { usePartnerBookings, useUpdateBookingStatus } from '@/hooks/useBookings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp, User, Phone, Mail, FileText, ClipboardList } from 'lucide-react'

const STATUS_TABS = [
  { value: '',               label: 'All' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved',       label: 'Approved' },
  { value: 'active',         label: 'Active' },
  { value: 'completed',      label: 'Completed' },
  { value: 'rejected',       label: 'Rejected' },
]

const STATUS_STYLES = {
  pending_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  approved:       'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active:         'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed:      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  rejected:       'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled:      'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
}

function StatusBadge({ status }) {
  const safeStatus = status || ''
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
      STATUS_STYLES[safeStatus] || 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {safeStatus.replace('_', ' ')}
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
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-[#1a1d2e]">
      {/* Row summary */}
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-800 dark:text-white">{booking.car_name}</p>
            <StatusBadge status={booking.booking_status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {booking.customer_name} <span className="mx-1">•</span> #{booking.booking_code}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {formatDate(booking.start_date)} → {formatDate(booking.end_date)} <span className="mx-1">•</span> {booking.total_days} day{booking.total_days !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(booking.total_amount)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{booking.payment_method?.toUpperCase()}</p>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="p-2 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded-full transition shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded: customer KYC + actions */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20 px-4 py-5 space-y-5">

          {/* Customer info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Customer Details</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                  <User size={14} className="text-gray-400 dark:text-gray-500" />
                </div>
                <span className="truncate">{booking.customer_name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-gray-400 dark:text-gray-500" />
                </div>
                <span className="truncate">{booking.customer_email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-gray-400 dark:text-gray-500" />
                </div>
                <span className="truncate">{booking.customer_phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* KYC documents */}
          {(booking.drivers_license_url || booking.valid_id_url) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Submitted Documents</p>
              <div className="flex gap-3 flex-wrap">
                {booking.drivers_license_url && (
                  <a href={booking.drivers_license_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700
                                rounded-xl text-sm font-medium text-brand-600 dark:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition shadow-sm">
                    <FileText size={15} className="opacity-70" />
                    Driver's License
                  </a>
                )}
                {booking.valid_id_url && (
                  <a href={booking.valid_id_url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700
                                rounded-xl text-sm font-medium text-brand-600 dark:text-brand-400 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition shadow-sm">
                    <FileText size={15} className="opacity-70" />
                    Valid ID
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Special requests */}
          {booking.special_requests && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Special Requests</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1d2e] rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm leading-relaxed">
                {booking.special_requests}
              </p>
            </div>
          )}

          {/* Approve / Reject actions */}
          {isPending && (
            <div className="pt-2">
              {showRejectInput ? (
                <div className="space-y-3 bg-white dark:bg-[#1a1d2e] p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Reason for rejection <span className="opacity-70 text-xs font-normal">(required)</span></p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="E.g., Vehicle unavailable for these dates, Invalid documents..."
                    rows={2}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 resize-none placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={!rejectReason.trim() || updateStatus.isPending}
                      className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none sm:px-5 py-2.5 bg-red-600 hover:bg-red-700
                                 disabled:bg-red-400 dark:disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition shadow-sm"
                    >
                      <XCircle size={15} />
                      Confirm Reject
                    </button>
                    <button onClick={() => setShowRejectInput(false)}
                            className="flex-1 sm:flex-none sm:px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={updateStatus.isPending}
                    className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none sm:px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800
                               text-white text-sm font-semibold rounded-xl transition shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none sm:px-6 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20
                               text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl transition shadow-sm"
                  >
                    <XCircle size={16} />
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and manage incoming booking requests.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center shadow-sm">
          <ClipboardList size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
          <p className="font-medium text-gray-700 dark:text-gray-300 text-lg">No bookings found</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try changing your filters or check back later.</p>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map(booking => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  )
}