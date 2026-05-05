import { useState } from 'react'
import { useAdminRefunds, useAdminProcessRefund, useAdminVerifyBookingFee, useAdminAllBookings } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  RefreshCw, CheckCircle2, Clock, AlertCircle, X,
  Phone, Mail, CreditCard, Car, Calendar, DollarSign,
  ShieldCheck, Eye,
} from 'lucide-react'

// ─── constants ────────────────────────────────────────────────────────────────

const REFUND_TABS = [
  { value: 'pending',    label: 'Pending',    color: 'text-amber-600 dark:text-amber-400'  },
  { value: 'processing', label: 'Processing', color: 'text-blue-600 dark:text-blue-400'    },
  { value: 'refunded',   label: 'Completed',  color: 'text-emerald-600 dark:text-emerald-400' },
]

const REFUND_STYLES = {
  pending:    { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',     dot: 'bg-amber-500'   },
  processing: { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',         dot: 'bg-blue-500'    },
  refunded:   { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Refund Row ───────────────────────────────────────────────────────────────

function RefundRow({ booking, onAction }) {
  const s = REFUND_STYLES[booking.booking_fee_refund_status] || REFUND_STYLES.pending

  return (
    <tr className="group hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition">
      {/* Customer */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(booking.customer_name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{booking.customer_name}</p>
            <p className="text-xs text-gray-400 font-mono">#{booking.booking_code}</p>
          </div>
        </div>
      </td>

      {/* Contact info */}
      <td className="px-5 py-4 hidden md:table-cell">
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5"><Mail size={11}/>{booking.customer_email}</div>
          {booking.customer_phone && <div className="flex items-center gap-1.5"><Phone size={11}/>{booking.customer_phone}</div>}
        </div>
      </td>

      {/* Car + dates */}
      <td className="px-5 py-4 hidden lg:table-cell">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{booking.car_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
      </td>

      {/* Fee */}
      <td className="px-5 py-4 text-center">
        <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(booking.booking_fee)}</span>
        {booking.booking_fee_reference && (
          <p className="text-[11px] text-gray-400 font-mono mt-1">Ref: {booking.booking_fee_reference}</p>
        )}
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`}/>
          {booking.booking_fee_refund_status === 'pending'    ? 'Pending' :
           booking.booking_fee_refund_status === 'processing' ? 'Processing' : 'Refunded'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {booking.booking_fee_refund_status === 'pending' && (
            <button
              onClick={() => onAction(booking.id, 'processing')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
            >
              <RefreshCw size={12}/> Mark Processing
            </button>
          )}
          {booking.booking_fee_refund_status === 'processing' && (
            <button
              onClick={() => onAction(booking.id, 'refunded')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
            >
              <CheckCircle2 size={12}/> Mark Refunded
            </button>
          )}
          {booking.booking_fee_refund_status === 'refunded' && (
            <span className="text-xs text-gray-400 italic">
              {booking.booking_fee_refunded_at ? formatDate(booking.booking_fee_refunded_at) : 'Done'}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Fee Verification Table ───────────────────────────────────────────────────

function UnverifiedFeeRow({ booking, onVerify }) {
  return (
    <tr className="group hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(booking.customer_name)}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{booking.customer_name}</p>
            <p className="text-xs text-gray-400 font-mono">#{booking.booking_code}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4 hidden md:table-cell text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5"><Mail size={11}/>{booking.customer_email}</div>
      </td>
      <td className="px-5 py-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{booking.car_name}</p>
      </td>
      <td className="px-5 py-4 text-center">
        <span className="font-bold text-brand-600 dark:text-brand-400">{formatCurrency(booking.booking_fee)}</span>
        {booking.booking_fee_reference ? (
          <p className="text-[11px] font-mono text-gray-500 dark:text-gray-400 mt-1">Ref: {booking.booking_fee_reference}</p>
        ) : (
          <p className="text-[11px] text-red-400 mt-1 italic">No ref # submitted</p>
        )}
      </td>
      <td className="px-5 py-4">
        <button
          onClick={() => onVerify(booking.id)}
          disabled={!booking.booking_fee_reference}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                     bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400
                     border border-emerald-200 dark:border-emerald-800 rounded-xl
                     hover:bg-emerald-100 dark:hover:bg-emerald-900/40
                     disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ShieldCheck size={12}/> Verify & Forward to Partner
        </button>
      </td>
    </tr>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminRefundQueuePage() {
  const [refundTab, setRefundTab] = useState('pending')
  const { data: refunds = [], isLoading: refundsLoading } = useAdminRefunds(refundTab)
  const { data: allBookings = [], isLoading: bookingsLoading } = useAdminAllBookings({ status: 'pending_review' })
  const processRefund = useAdminProcessRefund()
  const verifyFee     = useAdminVerifyBookingFee()

  // Bookings pending_review that haven't had their fee verified yet
  const unverified = (Array.isArray(allBookings) ? allBookings : allBookings?.results || [])
    .filter(b => !b.booking_fee_verified)

  const refundList = Array.isArray(refunds) ? refunds : refunds?.results || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Refunds & Fee Verification</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Verify platform booking fees and process refunds for rejected bookings.
        </p>
      </div>

      {/* ── Section 1: Fee Verification Queue ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-amber-500"/>
          <h2 className="font-bold text-gray-800 dark:text-white">Pending Fee Verification</h2>
          {unverified.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
              {unverified.length}
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-900/10">
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2">
              <AlertCircle size={13}/>
              Verify the customer paid the ₱{formatCurrency(100).replace('₱','')} platform booking fee before forwarding to the partner.
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Car</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fee / Ref #</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {bookingsLoading && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">Loading…</td></tr>
              )}
              {!bookingsLoading && unverified.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2"/>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All booking fees verified ✅</p>
                  </td>
                </tr>
              )}
              {!bookingsLoading && unverified.map(b => (
                <UnverifiedFeeRow key={b.id} booking={b} onVerify={(id) => verifyFee.mutate({ id })} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Refund Queue ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign size={18} className="text-brand-500"/>
          <h2 className="font-bold text-gray-800 dark:text-white">Booking Fee Refunds</h2>
        </div>

        {/* Refund status tabs */}
        <div className="flex gap-2 mb-4">
          {REFUND_TABS.map(tab => (
            <button key={tab.value} onClick={() => setRefundTab(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                refundTab === tab.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Booking</th>
                <th className="px-5 py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Refund Amount</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {refundsLoading && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-gray-400">Loading…</td></tr>
              )}
              {!refundsLoading && refundList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2"/>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No {refundTab} refunds 🎉</p>
                  </td>
                </tr>
              )}
              {!refundsLoading && refundList.map(b => (
                <RefundRow key={b.id} booking={b} onAction={(id, action) => processRefund.mutate({ id, action })} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
