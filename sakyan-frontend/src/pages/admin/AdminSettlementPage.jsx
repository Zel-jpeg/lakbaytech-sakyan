import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Wallet, Plus, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Calendar, Building2, X, Loader2, TrendingUp, Banknote,
} from 'lucide-react'
import {
  useAdminSettlements, useAdminCreateSettlement, useAdminMarkSettled,
} from '@/hooks/useAdmin'
import { useAdminPartners } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/utils/formatters'

// ─── helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className={`bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4 shadow-sm`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return status === 'settled' ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 size={11} /> Settled
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock size={11} /> Pending
    </span>
  )
}

// ─── Mark Settled Modal ────────────────────────────────────────────────────────
function MarkSettledModal({ settlement, onClose }) {
  const [amount, setAmount] = useState(String(settlement.total_owed))
  const [notes,  setNotes]  = useState('')
  const markSettled = useAdminMarkSettled()

  const handleSubmit = (e) => {
    e.preventDefault()
    markSettled.mutate(
      { id: settlement.id, amount_received: parseFloat(amount), notes },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mark as Settled</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{settlement.partner_name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Commission owed</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(settlement.total_commission)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Booking fees owed</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(settlement.total_fees)}</span>
          </div>
          <hr className="border-gray-200 dark:border-gray-700" />
          <div className="flex justify-between font-bold text-gray-900 dark:text-white">
            <span>Total owed</span>
            <span className="text-brand-600 dark:text-brand-400">{formatCurrency(settlement.total_owed)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Amount Received (₱)
            </label>
            <input
              type="number" step="0.01" required
              value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Paid via GCash on May 5, 2026"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm resize-none
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={markSettled.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700
                         disabled:opacity-50 text-white text-sm font-bold rounded-xl transition">
              {markSettled.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {markSettled.isPending ? 'Saving…' : 'Confirm Settled'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Generate Settlement Modal ────────────────────────────────────────────────
function GenerateModal({ onClose }) {
  const [partnerId,    setPartnerId]    = useState('')
  const [periodStart,  setPeriodStart]  = useState('')
  const [periodEnd,    setPeriodEnd]    = useState('')
  const [notes,        setNotes]        = useState('')

  const { data: allPartners } = useAdminPartners('approved')
  const partners = allPartners?.results || allPartners || []
  const createSettlement = useAdminCreateSettlement()

  const handleSubmit = (e) => {
    e.preventDefault()
    createSettlement.mutate(
      { partner_id: partnerId, period_start: periodStart, period_end: periodEnd, notes },
      { onSuccess: onClose }
    )
  }

  const inputCls = `w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-brand-500/50`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1d2e] rounded-3xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generate Settlement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Auto-calculate from completed bookings in the period
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Partner</label>
            <select required value={partnerId} onChange={e => setPartnerId(e.target.value)}
              className={inputCls + ' cursor-pointer'}>
              <option value="">Select partner…</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.business_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period Start</label>
              <input type="date" required value={periodStart} onChange={e => setPeriodStart(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period End</label>
              <input type="date" required value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. May 2026 monthly settlement"
              className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={createSettlement.isPending}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700
                         disabled:opacity-50 text-white text-sm font-bold rounded-xl transition">
              {createSettlement.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {createSettlement.isPending ? 'Generating…' : 'Generate'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-3 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Settlement Card ───────────────────────────────────────────────────────────
function SettlementCard({ settlement }) {
  const [expanded, setExpanded] = useState(false)
  const [settling, setSettling] = useState(false)

  const isPending = settlement.status === 'pending'

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {settlement.partner_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 dark:text-white truncate">{settlement.partner_name}</p>
            <StatusBadge status={settlement.status} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Calendar size={11} />
            {formatDate(settlement.period_start)} → {formatDate(settlement.period_end)}
            {settlement.booking_count !== undefined && (
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400">
                {settlement.booking_count} booking{settlement.booking_count !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400">{formatCurrency(settlement.total_owed)}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">Total owed</p>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition shrink-0">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 px-5 py-4 space-y-4">
          {/* Amounts */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Commission', value: settlement.total_commission, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Booking Fees', value: settlement.total_fees,     color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Total Owed',  value: settlement.total_owed,      color: 'text-brand-600 dark:text-brand-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-800">
                <p className={`text-base font-extrabold ${color}`}>{formatCurrency(value)}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Settled info */}
          {settlement.status === 'settled' && (
            <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-sm">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Settled — {formatCurrency(settlement.amount_received)} received
                </p>
                {settlement.settled_at && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">on {formatDate(settlement.settled_at)}</p>
                )}
                {settlement.notes && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{settlement.notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Pending notes */}
          {settlement.status === 'pending' && settlement.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">{settlement.notes}</p>
          )}

          {/* Action */}
          {isPending && (
            <button onClick={() => setSettling(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700
                         text-white text-sm font-bold rounded-xl transition shadow-sm">
              <Banknote size={16} /> Mark as Settled
            </button>
          )}
        </div>
      )}

      {settling && (
        <MarkSettledModal settlement={settlement} onClose={() => setSettling(false)} />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettlementPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)

  const { data, isLoading } = useAdminSettlements(statusFilter ? { status: statusFilter } : {})
  const settlements = data?.results || data || []

  // Summary stats
  const totalPending  = settlements.filter(s => s.status === 'pending').reduce((a, s) => a + Number(s.total_owed), 0)
  const totalSettled  = settlements.filter(s => s.status === 'settled').reduce((a, s) => a + Number(s.amount_received), 0)
  const pendingCount  = settlements.filter(s => s.status === 'pending').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settlements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Monthly commission &amp; fee remittances from partners
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     text-white text-sm font-bold rounded-xl transition shadow-sm hover:shadow-md"
        >
          <Plus size={16} /> Generate Settlement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Pending Collection"
          value={formatCurrency(totalPending)}
          sub={`${pendingCount} outstanding settlement${pendingCount !== 1 ? 's' : ''}`}
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(totalSettled)}
          sub="All time"
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <StatCard
          label="Total Settlements"
          value={settlements.length}
          sub="All periods"
          icon={Wallet}
          color="bg-brand-600"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { value: '',         label: 'All' },
          { value: 'pending',  label: 'Pending' },
          { value: 'settled',  label: 'Settled' },
        ].map(tab => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              statusFilter === tab.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && settlements.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center">
          <Wallet size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3 opacity-60" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No settlements yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Click "Generate Settlement" to create one for a partner's monthly period.
          </p>
          <button onClick={() => setShowGenerate(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700
                       text-white text-sm font-bold rounded-xl transition">
            <Plus size={15} /> Generate Settlement
          </button>
        </div>
      )}

      {!isLoading && settlements.length > 0 && (
        <div className="space-y-3">
          {settlements.map(s => <SettlementCard key={s.id} settlement={s} />)}
        </div>
      )}

      {/* Modals */}
      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} />}
    </div>
  )
}
