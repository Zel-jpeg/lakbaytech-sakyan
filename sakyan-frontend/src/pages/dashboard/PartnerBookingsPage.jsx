import { useState, useEffect } from 'react'
import { usePartnerBookings, useUpdateBookingStatus, useUpdatePaymentStatus, useUpdateRentalTimes } from '@/hooks/useBookings'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  CheckCircle2, XCircle, Phone, Mail, FileText, MapPin,
  Calendar, Car, CreditCard, Banknote, Clock, ShieldCheck,
  ShieldAlert, X, LayoutGrid, List, BadgeCheck, AlertCircle,
  ZoomIn, ChevronLeft, ChevronRight, ClipboardList, DollarSign,
  ChevronDown, Truck, Building2, Timer, Flag, TriangleAlert,
} from 'lucide-react'

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: '',               label: 'All' },
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved',       label: 'Approved' },
  { value: 'active',         label: 'Active' },
  { value: 'completed',      label: 'Completed' },
  { value: 'rejected',       label: 'Rejected' },
]

const BOOKING_STATUS_STYLES = {
  pending_review: { badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',         dot: 'bg-amber-500'   },
  approved:       { badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',             dot: 'bg-blue-500'    },
  active:         { badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
  completed:      { badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',               dot: 'bg-gray-400'    },
  rejected:       { badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',                 dot: 'bg-red-500'     },
  cancelled:      { badge: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',                  dot: 'bg-red-400'     },
}

const BOOKING_STATUS_LABEL = {
  pending_review: 'Pending Review', approved: 'Approved', active: 'Active',
  completed: 'Completed',           rejected: 'Rejected', cancelled: 'Cancelled',
}

// Payment status config — covers all 4 possible values
const PMT_STATUS = {
  pending:  { label: 'Not Yet Paid',    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         dot: 'bg-red-500',     icon: '⏳' },
  partial:  { label: 'Partially Paid',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500',   icon: '💸' },
  paid:     { label: 'Paid',            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', icon: '✅' },
  refunded: { label: 'Refunded',        badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',        dot: 'bg-gray-400',    icon: '↩️' },
}

const ID_TYPE_LABELS = {
  passport: 'Passport', sss: 'SSS ID', philhealth: 'PhilHealth ID',
  postal: 'Postal ID',  voters: "Voter's ID", prc: 'PRC ID', umid: 'UMID',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function BookingStatusBadge({ status }) {
  const s = BOOKING_STATUS_STYLES[status] || BOOKING_STATUS_STYLES.pending_review
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {BOOKING_STATUS_LABEL[status] || status}
    </span>
  )
}

function PaymentStatusBadge({ status }) {
  const p = PMT_STATUS[status] || PMT_STATUS.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${p.badge}
      ${status === 'pending'  ? 'border-red-200 dark:border-red-900/40' :
        status === 'partial'  ? 'border-amber-200 dark:border-amber-900/40' :
        status === 'paid'     ? 'border-emerald-200 dark:border-emerald-900/40' :
                                'border-gray-200 dark:border-gray-700'}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.dot}`} />
      {p.label}
    </span>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const hasPrev = images.length > 1
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10">
        <X size={20} />
      </button>
      {hasPrev && (
        <>
          <button onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <ChevronLeft size={22} />
          </button>
          <button onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <ChevronRight size={22} />
          </button>
        </>
      )}
      <div className="flex flex-col items-center gap-4 px-16 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <img
          src={images[current].url}
          alt={images[current].label}
          className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="text-center">
          <p className="text-white font-semibold text-sm">{images[current].label}</p>
          {hasPrev && <p className="text-white/40 text-xs mt-1">{current + 1} / {images.length}</p>}
        </div>
        {/* Thumbnails strip */}
        {hasPrev && (
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition ${i === current ? 'border-white' : 'border-white/20 hover:border-white/50'}`}>
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Document Preview Tile ────────────────────────────────────────────────────

function DocPreview({ label, url, onOpenLightbox }) {
  const [loaded, setLoaded]   = useState(true)

  if (!url) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      {loaded ? (
        <button onClick={onOpenLightbox}
          className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 transition shadow-sm bg-gray-100 dark:bg-gray-800">
          <img
            src={url}
            alt={label}
            className="w-full h-32 object-contain p-1"
            onError={() => setLoaded(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition rounded-xl">
            <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
              <ZoomIn size={13} /> View full size
            </div>
          </div>
        </button>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-brand-600 dark:text-brand-400 hover:border-brand-400 transition">
          <FileText size={14} />
          <span>Open document</span>
        </a>
      )}
    </div>
  )
}

// ─── Payment Status Selector (in modal) ────────────────────────────────────────

function PaymentStatusSelector({ bookingId, currentStatus, currentNotes, currentGcashRef }) {
  const [open, setOpen]         = useState(false)
  const [notes, setNotes]       = useState(currentNotes || '')
  const [gcashRef, setGcashRef] = useState(currentGcashRef || '')
  const [showNotes, setShowNotes] = useState(false)
  const updatePayment = useUpdatePaymentStatus()

  const options = Object.entries(PMT_STATUS).map(([value, cfg]) => ({ value, ...cfg }))

  const handleSelect = (value) => {
    if (value === currentStatus) { setOpen(false); return }
    updatePayment.mutate({ id: bookingId, payment_status: value, payment_notes: notes, partner_gcash_reference: gcashRef })
    setOpen(false)
  }

  const handleSaveNotes = () => {
    updatePayment.mutate({ id: bookingId, payment_notes: notes, partner_gcash_reference: gcashRef })
    setShowNotes(false)
  }

  const current = PMT_STATUS[currentStatus] || PMT_STATUS.pending

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            disabled={updatePayment.isPending}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition
              ${currentStatus === 'paid'    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' :
                currentStatus === 'partial' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400' :
                currentStatus === 'refunded'? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300' :
                                              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${current.dot}`} />
            {updatePayment.isPending ? 'Saving…' : current.label}
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden min-w-[180px]">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      opt.value === currentStatus ? 'font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                    {opt.label}
                    {opt.value === currentStatus && <span className="ml-auto text-brand-500">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Edit notes button */}
        <button
          type="button"
          onClick={() => setShowNotes(s => !s)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 transition underline"
        >
          {showNotes ? 'Hide notes' : 'Add notes'}
        </button>
      </div>

      {/* Notes + GCash ref fields */}
      {showNotes && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={gcashRef}
            onChange={e => setGcashRef(e.target.value)}
            placeholder="GCash ref # (if paid via GCash)"
            className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Payment notes (e.g. paid in full, ₱6,100 cash on pickup day)"
            className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 resize-none
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          <button
            onClick={handleSaveNotes}
            disabled={updatePayment.isPending}
            className="w-full py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition"
          >
            {updatePayment.isPending ? 'Saving…' : 'Save Notes'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Format a UTC ISO string to Philippine time (Asia/Manila) */
function formatPHTime(isoStr) {
  if (!isoStr) return '—'
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

/** Get current Manila time as a datetime-local string (for input default) */
function nowManilaLocal() {
  const d = new Date()
  // getTimezoneOffset returns negative for UTC+ zones (e.g. -480 for Manila)
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

// ─── Rental Time Tracker ───────────────────────────────────────────────────────

function RentalTracker({ booking }) {
  const updateRental = useUpdateRentalTimes()

  const [startTime,  setStartTime]  = useState(nowManilaLocal)
  const [returnTime, setReturnTime] = useState(nowManilaLocal)

  const expectedReturn = booking.end_date
  const isOverdue = booking.booking_status === 'active' &&
    !booking.actual_return_time &&
    expectedReturn &&
    new Date() > new Date(expectedReturn + 'T23:59:59')

  const inputCls = `flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5
    bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40`

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
        <Timer size={13} /> Rental Tracker
      </p>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl px-3 py-2.5">
          <TriangleAlert size={15} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
            ⚠️ OVERDUE! Expected return was <strong>{expectedReturn}</strong>. Follow up immediately.
          </p>
        </div>
      )}

      {/* Expected return row */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-xs">
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><Flag size={12} /> Must return by</span>
        <span className={`font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
          {expectedReturn}
        </span>
      </div>

      {/* ── Hand-off block ── */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`flex items-center gap-2 px-3 py-2 ${booking.actual_start_time ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${booking.actual_start_time ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {booking.actual_start_time ? '✅ Car Handed Over' : 'Log Hand-off Time'}
          </span>
        </div>
        <div className="px-3 py-3">
          {booking.actual_start_time ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {formatPHTime(booking.actual_start_time)}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">Customer has been notified via message</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Set the exact date & time you handed the car to the customer.
                The customer will receive an automatic message notification.
              </p>
              <div className="flex gap-2">
                <input type="datetime-local" value={startTime}
                  onChange={e => setStartTime(e.target.value)} className={inputCls} />
                <button
                  onClick={() => updateRental.mutate({ id: booking.id, actual_start_time: startTime })}
                  disabled={updateRental.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5"
                >
                  {updateRental.isPending ? '…' : <><Flag size={12} /> Log</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Return block ── */}
      {booking.actual_start_time && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className={`flex items-center gap-2 px-3 py-2 ${booking.actual_return_time ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${booking.actual_return_time ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {booking.actual_return_time ? '✅ Car Returned' : 'Log Return Time'}
            </span>
          </div>
          <div className="px-3 py-3">
            {booking.actual_return_time ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {formatPHTime(booking.actual_return_time)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Rental completed. Customer notified.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Log when the customer returns the car. The booking will be marked completed automatically.
                </p>
                <div className="flex gap-2">
                  <input type="datetime-local" value={returnTime}
                    onChange={e => setReturnTime(e.target.value)} className={inputCls} />
                  <button
                    onClick={() => updateRental.mutate({ id: booking.id, actual_return_time: returnTime })}
                    disabled={updateRental.isPending}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5"
                  >
                    {updateRental.isPending ? '…' : <><CheckCircle2 size={12} /> Log</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({ booking, onClose }) {
  const [rejectReason, setRejectReason]       = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [lightbox, setLightbox]               = useState(null)
  const updateStatus = useUpdateBookingStatus()
  const isPending    = booking.booking_status === 'pending_review'
  const cp           = booking.customer_profile

  const handleApprove = () =>
    updateStatus.mutate(
      { id: booking.id, action: 'approve' },
      { onSuccess: () => onClose() }
    )
  const handleReject  = () => {
    if (!rejectReason.trim()) return
    updateStatus.mutate(
      { id: booking.id, action: 'reject', reason: rejectReason },
      { onSuccess: () => onClose() }
    )
    setShowRejectInput(false)
    setRejectReason('')
  }

  const docImages = [
    cp?.drivers_license_url && { url: cp.drivers_license_url, label: "Driver's License" },
    cp?.valid_id_url        && { url: cp.valid_id_url,        label: 'Valid Government ID' },
  ].filter(Boolean)

  // Pricing breakdown
  const pricePerDay  = Number(booking.price_per_day  || 0)
  const totalDays    = Number(booking.total_days     || 0)
  const subtotal     = Number(booking.subtotal       || 0) || pricePerDay * totalDays
  const bookingFee   = Number(booking.booking_fee    || 0)
  const totalAmount  = Number(booking.total_amount   || 0)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>

        {/* Modal card */}
        <div
          className="relative bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Booking Details</h2>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">#{booking.booking_code}</p>
              </div>
              <BookingStatusBadge status={booking.booking_status} />
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Car banner */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
              {booking.car_image ? (
                <img src={booking.car_image} alt={booking.car_name}
                  className="w-20 h-14 object-cover rounded-xl shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700"
                  onError={e => { e.target.style.display='none' }}
                />
              ) : (
                <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl shrink-0">🚗</div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{booking.car_name}</p>
                {booking.car_location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <MapPin size={11} /> {booking.car_location}
                  </div>
                )}
              </div>
            </div>

            {/* Payment status (always visible, partner can update) */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Payment Status</p>
                  <div className="flex items-center gap-2">
                    <DollarSign size={15} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.payment_method === 'gcash' ? 'Customer pays via GCash to partner' : 'Cash on Pickup/Delivery'}
                    </span>
                  </div>
                </div>
              </div>
              <PaymentStatusSelector
                bookingId={booking.id}
                currentStatus={booking.payment_status || 'pending'}
                currentNotes={booking.payment_notes}
                currentGcashRef={booking.partner_gcash_reference}
              />
              {/* Show saved notes/ref */}
              {(booking.partner_gcash_reference || booking.payment_notes) && (
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 pt-1 border-t border-gray-200 dark:border-gray-700">
                  {booking.partner_gcash_reference && (
                    <p><span className="font-semibold">GCash Ref:</span> {booking.partner_gcash_reference}</p>
                  )}
                  {booking.payment_notes && (
                    <p><span className="font-semibold">Notes:</span> {booking.payment_notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Rental tracker — show for approved & active bookings */}
            {['approved', 'active'].includes(booking.booking_status) && (
              <RentalTracker booking={booking} />
            )}

            {/* 2-column: Booking summary + Renter info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Booking summary */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/40">
                  Booking Summary
                </p>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  <div className="flex justify-between items-center px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><Calendar size={12}/> Dates</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><Clock size={12}/> Duration</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                  </div>
                  {booking.gcash_reference && (
                    <div className="flex justify-between items-center px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><CreditCard size={12}/> GCash Ref</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{booking.gcash_reference}</span>
                    </div>
                  )}
                  {/* Fulfillment type */}
                  <div className="flex justify-between items-center px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      {booking.fulfillment_type === 'delivery' ? <Truck size={12}/> : <Building2 size={12}/>}
                      Fulfillment
                    </span>
                    <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      booking.fulfillment_type === 'delivery'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}>
                      {booking.fulfillment_type === 'delivery' ? 'Delivery' : 'Self-Pickup'}
                    </span>
                  </div>
                  {booking.fulfillment_type === 'delivery' && booking.delivery_address && (
                    <div className="flex items-start gap-2 px-4 py-2.5 text-xs bg-blue-50/50 dark:bg-blue-900/10">
                      <MapPin size={12} className="text-blue-500 shrink-0 mt-0.5"/>
                      <span className="text-blue-700 dark:text-blue-300 leading-relaxed">{booking.delivery_address}</span>
                    </div>
                  )}

                  {/* Pricing breakdown */}
                  <div className="px-4 py-3 space-y-1.5 bg-gray-50/60 dark:bg-gray-800/20">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>₱{Number(pricePerDay).toLocaleString()} × {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                      <span>₱{Number(subtotal).toLocaleString()}</span>
                    </div>
                    {bookingFee > 0 && (
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Booking fee</span>
                        <span>₱{Number(bookingFee).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                      <span className="flex items-center gap-1.5"><Car size={13}/> Total</span>
                      <span className="text-brand-600 dark:text-brand-400">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Renter info */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/40">
                  Renter
                </p>
                <div className="px-4 pb-4 pt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {getInitials(booking.customer_name)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{booking.customer_name}</p>
                      {cp?.is_verified
                        ? <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5"><BadgeCheck size={12}/> KYC Verified</div>
                        : <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5"><AlertCircle size={12}/> Not KYC Verified</div>}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400 shrink-0"/><span className="truncate">{booking.customer_email}</span></div>
                    {(booking.customer_phone || cp?.contact_number) && (
                      <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400 shrink-0"/><span>{booking.customer_phone || cp?.contact_number}</span></div>
                    )}
                    {cp?.birthday && (
                      <div className="flex items-center gap-2"><Calendar size={12} className="text-gray-400 shrink-0"/><span>{cp.birthday}</span></div>
                    )}
                    {cp?.address && (
                      <div className="flex items-start gap-2"><MapPin size={12} className="text-gray-400 shrink-0 mt-0.5"/><span className="leading-relaxed">{cp.address}</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KYC & Documents */}
            {cp && (
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <p className="px-4 pt-3 pb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/40">
                  Identity & Documents
                </p>
                <div className="p-4 space-y-4">

                  {/* KYC status banner */}
                  {cp.is_verified ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                      <ShieldCheck size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0"/>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Identity Verified</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">Admin has approved this renter's identity documents.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                      <ShieldAlert size={17} className="text-amber-600 dark:text-amber-400 shrink-0"/>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Verification</p>
                        <p className="text-xs text-amber-600 dark:text-amber-500">KYC status: {cp.kyc_status?.replace('_', ' ') || 'Not submitted'}</p>
                      </div>
                    </div>
                  )}

                  {/* License details grid */}
                  {(cp.drivers_license_number || cp.license_expiry || cp.valid_id_type) && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {cp.drivers_license_number && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-gray-400 dark:text-gray-500 mb-1">License #</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200 break-all">{cp.drivers_license_number}</p>
                        </div>
                      )}
                      {cp.license_expiry && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-gray-400 dark:text-gray-500 mb-1">Expiry</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{cp.license_expiry}</p>
                        </div>
                      )}
                      {cp.valid_id_type && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-gray-400 dark:text-gray-500 mb-1">ID Type</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{ID_TYPE_LABELS[cp.valid_id_type] || cp.valid_id_type}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document image previews — inline, zoomable */}
                  {docImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {docImages.map((doc, idx) => (
                        <DocPreview
                          key={doc.label}
                          label={doc.label}
                          url={doc.url}
                          onOpenLightbox={() => setLightbox({ images: docImages, startIndex: idx })}
                        />
                      ))}
                    </div>
                  )}

                  {!cp.drivers_license_url && !cp.valid_id_url && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No documents submitted yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Special Requests */}
            {booking.special_requests && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Special Requests</p>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {booking.special_requests}
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {booking.booking_status === 'rejected' && booking.admin_notes && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Rejection Reason</p>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 text-sm text-red-700 dark:text-red-400 leading-relaxed">
                  {booking.admin_notes}
                </div>
              </div>
            )}
          </div>

          {/* ── Action footer (pending only) ── */}
          {isPending && (
            <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 px-6 py-4 bg-gray-50/60 dark:bg-gray-900/20">
              {showRejectInput ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Rejection reason <span className="font-normal text-gray-400 text-xs">(required)</span>
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="E.g., Invalid documents, unavailable dates…"
                    rows={2}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleReject} disabled={!rejectReason.trim() || updateStatus.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition">
                      <XCircle size={16}/> Confirm Reject
                    </button>
                    <button onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                      className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={handleApprove} disabled={updateStatus.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-sm">
                    <CheckCircle2 size={17}/> Approve Booking
                  </button>
                  <button onClick={() => setShowRejectInput(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition shadow-sm">
                    <XCircle size={17}/> Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox — above modal */}
      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} />
      )}
    </>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────

function ListRow({ booking, onClick }) {
  const pmt = PMT_STATUS[booking.payment_status] || PMT_STATUS.pending
  return (
    <tr onClick={onClick}
      className="group cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition">

      {/* Renter */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(booking.customer_name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{booking.customer_name}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">#{booking.booking_code}</p>
          </div>
        </div>
      </td>

      {/* Car */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          {booking.car_image ? (
            <img src={booking.car_image} alt="" className="w-10 h-7 object-cover rounded-lg shrink-0 bg-gray-200 dark:bg-gray-700"
              onError={e => { e.target.style.display='none' }} />
          ) : (
            <div className="w-10 h-7 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm shrink-0">🚗</div>
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[130px]">{booking.car_name}</span>
        </div>
      </td>

      {/* Dates */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{booking.total_days} day{booking.total_days !== 1 ? 's' : ''}</p>
      </td>

      {/* Booking status */}
      <td className="px-4 py-3.5"><BookingStatusBadge status={booking.booking_status} /></td>

      {/* Payment status */}
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${pmt.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pmt.dot}`} />
          {pmt.label}
        </span>
      </td>

      {/* Amount */}
      <td className="px-4 py-3.5 text-right">
        <span className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(booking.total_amount)}</span>
      </td>
    </tr>
  )
}

// ─── Card Item ────────────────────────────────────────────────────────────────

function BookingCard({ booking, onClick }) {
  const pmt = PMT_STATUS[booking.payment_status] || PMT_STATUS.pending
  const [imgError, setImgError] = useState(false)

  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden
                 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-200 group">

      {/* Car image */}
      <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
        {booking.car_image && !imgError ? (
          <img src={booking.car_image} alt={booking.car_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🚗</div>
        )}
        {/* Status overlay */}
        <div className="absolute top-2 right-2">
          <BookingStatusBadge status={booking.booking_status} />
        </div>
      </div>

      <div className="p-4">
        {/* Customer */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {getInitials(booking.customer_name)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 dark:text-white text-sm truncate">{booking.customer_name}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{booking.car_name}</p>
          </div>
        </div>

        {/* Date + duration */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-1"><Calendar size={11}/> {formatDate(booking.start_date)}</div>
          <span>→</span>
          <div className="flex items-center gap-1"><Clock size={11}/> {booking.total_days}d</div>
        </div>

        {/* Footer: payment status + amount */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${pmt.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${pmt.dot}`}/>
            {pmt.label}
          </span>
          <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">{formatCurrency(booking.total_amount)}</span>
        </div>
      </div>
    </button>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return [...Array(5)].map((_, i) => (
    <tr key={i} className="animate-pulse">
      <td className="px-4 py-3.5"><div className="flex gap-3 items-center"><div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl"/><div className="space-y-1.5"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28"/><div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-20"/></div></div></td>
      <td className="px-4 py-3.5"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"/></td>
      <td className="px-4 py-3.5 hidden md:table-cell"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"/></td>
      <td className="px-4 py-3.5"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20"/></td>
      <td className="px-4 py-3.5 hidden sm:table-cell"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24"/></td>
      <td className="px-4 py-3.5 text-right"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"/></td>
    </tr>
  ))
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="h-32 bg-gray-200 dark:bg-gray-700"/>
      <div className="p-4 space-y-3">
        <div className="flex gap-2.5 items-center"><div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"/><div className="flex-1 space-y-1.5"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"/><div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/></div></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/>
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-24"/><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"/></div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PartnerBookingsPage() {
  const [statusFilter, setStatusFilter]       = useState('')
  const [viewMode, setViewMode]               = useState('list')
  const [selectedBooking, setSelectedBooking] = useState(null)

  const { data, isLoading } = usePartnerBookings(
    statusFilter ? { booking_status: statusFilter } : {}
  )
  const bookings = data?.results || data || []

  // ── Keep the open modal in sync whenever the list refetches ───────────────
  // Fixes: payment status / rental times / booking status showing stale data
  // after a mutation invalidates + refetches the partner bookings query.
  useEffect(() => {
    if (!selectedBooking) return
    const fresh = bookings.find(b => b.id === selectedBooking.id)
    if (fresh) setSelectedBooking(fresh)
  }, [bookings]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isLoading ? 'Loading…' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} total`}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button onClick={() => setViewMode('card')} title="Card view"
            className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
            <LayoutGrid size={17}/>
          </button>
          <button onClick={() => setViewMode('list')} title="List view"
            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
            <List size={17}/>
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Renter</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Car</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:table-cell">Dates</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">Payment</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {isLoading && <ListSkeleton/>}
              {!isLoading && bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <ClipboardList size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3 opacity-60"/>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No bookings found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{statusFilter ? 'Try a different filter.' : 'Requests will appear here.'}</p>
                  </td>
                </tr>
              )}
              {!isLoading && bookings.map(b => (
                <ListRow key={b.id} booking={b} onClick={() => setSelectedBooking(b)}/>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CARD VIEW ── */}
      {viewMode === 'card' && (
        <>
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <CardSkeleton key={i}/>)}
            </div>
          )}
          {!isLoading && bookings.length === 0 && (
            <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center shadow-sm">
              <ClipboardList size={44} className="mx-auto text-gray-300 dark:text-gray-600 mb-3 opacity-50"/>
              <p className="font-semibold text-gray-700 dark:text-gray-300">No bookings found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{statusFilter ? 'Try a different filter.' : 'Requests will appear here.'}</p>
            </div>
          )}
          {!isLoading && bookings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {bookings.map(b => (
                <BookingCard key={b.id} booking={b} onClick={() => setSelectedBooking(b)}/>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Booking Modal ── */}
      {selectedBooking && (
        <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)}/>
      )}
    </div>
  )
}