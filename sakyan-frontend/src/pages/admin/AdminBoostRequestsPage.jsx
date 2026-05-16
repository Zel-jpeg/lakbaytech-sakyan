import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Zap, Clock, CheckCircle2, XCircle, DollarSign, Filter,
  MessageCircle, Calendar, Building2, User, ChevronDown, X, Check,
  AlertCircle, Loader2, Sparkles,
} from 'lucide-react'
import api from '@/config/axios'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const STATUS_TABS = [
  { value: '',         label: 'All',      color: 'text-gray-600 dark:text-gray-400' },
  { value: 'pending',  label: 'Pending',  color: 'text-amber-600 dark:text-amber-400' },
  { value: 'approved', label: 'Approved', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'paid',     label: 'Active',   color: 'text-emerald-600 dark:text-emerald-400' },
  { value: 'declined', label: 'Declined', color: 'text-red-600 dark:text-red-400' },
]

const STATUS_BADGE = {
  pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',  icon: Clock,         label: 'Pending' },
  approved: { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',       icon: CheckCircle2,  label: 'Approved' },
  paid:     { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', icon: Sparkles, label: 'Live ✨' },
  declined: { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',             icon: XCircle,       label: 'Declined' },
  expired:  { cls: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',         icon: AlertCircle,   label: 'Expired' },
}

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.cls}`}>
      <Icon size={11} /> {s.label}
    </span>
  )
}

function ActionModal({ boost, onClose, onSuccess }) {
  const qc = useQueryClient()
  const [action, setAction] = useState(null)  // 'approve' | 'decline' | 'mark-paid'
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const mutation = useMutation({
    mutationFn: ({ act, payload }) =>
      api.patch(`/admin/boosts/${boost.id}/${act}/`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-boosts'] })
      toast.success('Boost request updated!')
      onSuccess()
    },
    onError: () => toast.error('Failed to update boost request'),
  })

  const handleSubmit = () => {
    if (action === 'decline' && !reason.trim()) {
      toast.error('Please provide a reason for declining.')
      return
    }
    const payload = action === 'decline'
      ? { reason }
      : { admin_notes: notes }
    mutation.mutate({ act: action, payload })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Manage Boost Request</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Partner info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5">
          <p className="font-semibold text-gray-900 dark:text-white">{boost.partner_name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {boost.boost_type_display} · {boost.duration_display}
          </p>
          <p className="text-xs text-gray-400 mt-1 italic">"{boost.partner_message}"</p>
        </div>

        {/* Action buttons */}
        {!action && (
          <div className="space-y-2">
            {boost.status === 'pending' && (
              <>
                <button onClick={() => setAction('approve')}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400
                             border border-blue-200 dark:border-blue-800 rounded-xl font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                  <CheckCircle2 size={16} /> Approve Request
                </button>
                <button onClick={() => setAction('decline')}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400
                             border border-red-200 dark:border-red-800 rounded-xl font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/50 transition">
                  <XCircle size={16} /> Decline Request
                </button>
              </>
            )}
            {boost.status === 'approved' && (
              <button onClick={() => setAction('mark-paid')}
                className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400
                           border border-emerald-200 dark:border-emerald-800 rounded-xl font-medium text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition">
                <DollarSign size={16} /> Mark as Paid & Activate
              </button>
            )}
            <Link
              to={`/admin/messages?support=1&partner_id=${boost.partner_user_id}`}
              onClick={onClose}
              className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                         border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <MessageCircle size={16} /> Reply via Messages
            </Link>
          </div>
        )}

        {/* Approve form */}
        {action === 'approve' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Admin Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Please send payment to our GCash number..."
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800
                           text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Back
              </button>
              <button onClick={handleSubmit} disabled={mutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                Approve
              </button>
            </div>
          </div>
        )}

        {/* Decline form */}
        {action === 'decline' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Reason for Declining <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Slot is currently full, please try again next month..."
                rows={3}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800
                           text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Back
              </button>
              <button onClick={handleSubmit} disabled={mutation.isPending}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Mark paid form */}
        {action === 'mark-paid' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-sm text-emerald-700 dark:text-emerald-400">
              ✅ This will activate the boost immediately for <strong>{boost.duration_display}</strong> starting today.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Admin Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Payment confirmed via GCash #12345..."
                rows={2}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800
                           text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAction(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Back
              </button>
              <button onClick={handleSubmit} disabled={mutation.isPending}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2">
                {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <DollarSign size={15} />}
                Activate Boost
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BoostCard({ boost, onManage }) {
  const isActive = boost.status === 'paid' && boost.end_date && new Date(boost.end_date) >= new Date()

  return (
    <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{boost.partner_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {boost.partner_type === 'company' ? <><Building2 size={10} className="inline mr-0.5" /> Company</> : <><User size={10} className="inline mr-0.5" /> Individual</>}
            </p>
          </div>
        </div>
        <StatusBadge status={boost.status} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Sparkles size={14} className="text-violet-500 shrink-0" />
          <span><span className="font-medium text-gray-800 dark:text-gray-200">{boost.boost_type_display}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar size={14} className="text-brand-500 shrink-0" />
          <span>{boost.duration_display}</span>
          {boost.start_date && boost.end_date && (
            <span className="text-xs text-gray-400">
              · {new Date(boost.start_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(boost.end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-500">
          <MessageCircle size={14} className="shrink-0 mt-0.5" />
          <p className="text-xs italic leading-snug line-clamp-2">"{boost.partner_message}"</p>
        </div>
        {boost.admin_notes && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-snug">{boost.admin_notes}</p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-600 mb-3">
        Requested {new Date(boost.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>

      {(boost.status === 'pending' || boost.status === 'approved') && (
        <button
          onClick={() => onManage(boost)}
          className="w-full py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800
                     rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
        >
          Manage Request
        </button>
      )}
    </div>
  )
}

export default function AdminBoostRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBoost, setSelectedBoost] = useState(null)

  const { data: boosts = [], isLoading } = useQuery({
    queryKey: ['admin-boosts', statusFilter],
    queryFn: () => api.get(`/admin/boosts/${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data),
  })

  const results = boosts?.results || boosts || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Boost Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage partner featured listing & spotlight banner requests
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Sparkles size={18} className="text-violet-500 shrink-0 mt-0.5" />
        <div className="text-sm text-violet-700 dark:text-violet-300">
          <p className="font-semibold mb-0.5">How it works</p>
          <p className="text-violet-600 dark:text-violet-400 text-xs leading-relaxed">
            Partners request a boost from their dashboard. You review, approve, and coordinate payment via messages.
            Once paid, click <strong>Mark as Paid & Activate</strong> to make it live on the Browse Cars page.
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex-1 min-w-max px-4 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-60">
              {!isLoading && results.filter(b => tab.value ? b.status === tab.value : true).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-600">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No boost requests yet</p>
          <p className="text-sm mt-1">Partner requests will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(boost => (
            <BoostCard key={boost.id} boost={boost} onManage={setSelectedBoost} />
          ))}
        </div>
      )}

      {/* Action modal */}
      {selectedBoost && (
        <ActionModal
          boost={selectedBoost}
          onClose={() => setSelectedBoost(null)}
          onSuccess={() => setSelectedBoost(null)}
        />
      )}
    </div>
  )
}
