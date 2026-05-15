import { useState } from 'react'
import { useAdminKYC, useAdminKYCAction } from '@/hooks/useAdmin'
import { useResponsiveView } from '@/hooks/useResponsiveView'
import { formatDate } from '@/utils/formatters'
import {
  CheckCircle2, XCircle, User, Phone, Mail, FileText,
  MapPin, ShieldCheck, ShieldOff,
  LayoutGrid, List, Search, X, Calendar,
} from 'lucide-react'

const STATUS_TABS = [
  { value: 'pending',  label: 'Pending',  dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'approved', label: 'Approved', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-red-500',     badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
]

function StatusBadge({ status }) {
  const tab = STATUS_TABS.find(t => t.value === status)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${tab?.badge || 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab?.dot || 'bg-gray-400'}`} />
      {status}
    </span>
  )
}

// ─── Document Preview — inline lightbox, zero redirects ──────────────────────
function DocPreview({ label, url }) {
  const [open, setOpen] = useState(false)

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-6 text-center">
        <FileText size={22} className="text-gray-300 dark:text-gray-600" />
        <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-[11px] text-gray-300 dark:text-gray-600">Not uploaded</p>
      </div>
    )
  }

  return (
    <>
      {/* Thumbnail — click to open lightbox */}
      <button
        onClick={() => setOpen(true)}
        className="group relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 aspect-[4/3] hover:border-brand-400 transition"
      >
        <img
          src={url} alt={label}
          className="absolute inset-0 w-full h-full object-contain p-2 transition group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 dark:bg-gray-900/90 text-xs font-semibold text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-full shadow">
            🔍 View full size
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-3 py-2">
          <p className="text-white text-xs font-medium truncate">{label}</p>
        </div>
      </button>

      {/* Fullscreen lightbox — z-[70] sits above everything */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition"
            >
              <X size={16} /> Close
            </button>

            {/* Image */}
            <img
              src={url} alt={label}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl mx-auto block"
            />
            <p className="text-center text-white/60 text-xs mt-3">{label}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── KYC Detail Modal ─────────────────────────────────────────────────────────
function KYCModal({ profile, onClose }) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason]       = useState('')
  const actionMutation = useAdminKYCAction()

  const isPending  = profile.kyc_status === 'pending'

  const handleAction = (action, reason) => {
    actionMutation.mutate({ id: profile.id, action, reason }, { onSuccess: onClose })
    setShowRejectInput(false)
    setRejectReason('')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#1a1d2e] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-400 font-bold">
              {profile.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{profile.full_name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={profile.kyc_status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Contact info */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail size={14} className="text-gray-400 shrink-0" />{profile.email}</div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={14} className="text-gray-400 shrink-0" />{profile.contact_number || '—'}</div>
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300"><MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" /><span>{profile.address || '—'}</span></div>
            {profile.kyc_submitted_at && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs"><Calendar size={12} />Submitted {formatDate(profile.kyc_submitted_at)}</div>
            )}
          </div>

          {/* Documents */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Submitted Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocPreview label="Driver's License" url={profile.drivers_license_url} />
              <DocPreview label="Valid Government ID" url={profile.valid_id_url} />
            </div>
          </div>

          {/* Rejection reason */}
          {profile.kyc_status === 'rejected' && profile.kyc_rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 dark:text-red-300">{profile.kyc_rejection_reason}</p>
            </div>
          )}

          {/* Approved note */}
          {profile.kyc_status === 'approved' && (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={16} /> Verified — customer can book cars
            </div>
          )}

          {/* Rental Agreement */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Rental Agreement</p>
            {profile.agreement_accepted ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 size={16} /> Agreement Signed ✅
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">Digital Signature:</span>{' '}
                  <span className="font-mono bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded">
                    {profile.agreement_signature}
                  </span>
                </div>
                {profile.agreement_signed_at && (
                  <div className="text-xs text-emerald-600/80 dark:text-emerald-400/60">
                    Signed on {new Date(profile.agreement_signed_at).toLocaleDateString('en-PH', {
                      month: 'long', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <XCircle size={15} className="text-gray-400" /> No rental agreement on file
                <span className="text-xs ml-1 text-gray-400">(Submitted before agreement feature)</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 space-y-3">
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection — customer will see this (required)" rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleAction('reject', rejectReason)} disabled={!rejectReason.trim() || actionMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition">
                    <XCircle size={15} /> Confirm Reject
                  </button>
                  <button onClick={() => setShowRejectInput(false)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm rounded-xl text-gray-600 dark:text-gray-400 hover:border-gray-300 transition">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => handleAction('approve')} disabled={actionMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition">
                  <CheckCircle2 size={15} /> Approve
                </button>
                <button onClick={() => setShowRejectInput(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row (list view) ──────────────────────────────────────────────────────────
function KYCRow({ profile, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5
                 hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-sm transition-all group flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 text-brand-700 dark:text-brand-400 font-bold text-sm">
        {profile.full_name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{profile.full_name}</p>
          <StatusBadge status={profile.kyc_status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1"><Mail size={10} />{profile.email}</span>
          {profile.contact_number && <span className="flex items-center gap-1"><Phone size={10} />{profile.contact_number}</span>}
          {profile.kyc_submitted_at && <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(profile.kyc_submitted_at)}</span>}
        </div>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition shrink-0">View →</span>
    </button>
  )
}

// ─── Card (card view) ─────────────────────────────────────────────────────────
function KYCCard({ profile, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4
                 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700/50 transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 text-brand-700 dark:text-brand-400 font-bold text-base">
          {profile.full_name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{profile.full_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.email}</p>
        </div>
        <StatusBadge status={profile.kyc_status} />
      </div>
      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
        {profile.contact_number && <div className="flex items-center gap-1.5"><Phone size={11} />{profile.contact_number}</div>}
        {profile.address && <div className="flex items-center gap-1.5"><MapPin size={11} /><span className="truncate">{profile.address}</span></div>}
        {profile.kyc_submitted_at && <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Calendar size={11} />{formatDate(profile.kyc_submitted_at)}</div>}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {profile.drivers_license_url && profile.valid_id_url ? '2 docs submitted' : profile.drivers_license_url || profile.valid_id_url ? '1 doc submitted' : 'No docs'}
        </span>
        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium group-hover:underline">View details →</span>
      </div>
    </button>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function RowSkel() { return <div className="h-[68px] bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" /> }
function CardSkel() { return <div className="h-36 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" /> }

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminKYCPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [viewMode, setViewMode]   = useResponsiveView('list')

  const { data, isLoading } = useAdminKYC(activeTab)
  const all      = data?.results || data || []
  const profiles = search.trim()
    ? all.filter(p => p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()))
    : all

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Verification (KYC)</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and approve customer identity submissions.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1a1d2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 shrink-0 self-start sm:self-auto">
          <button onClick={() => setViewMode('list')} title="List" className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}><List size={16} /></button>
          <button onClick={() => setViewMode('card')} title="Card" className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.value ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {!isLoading && profiles.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{profiles.length} {activeTab} submission{profiles.length !== 1 ? 's' : ''}{search && ` matching "${search}"`}</p>
      )}

      {isLoading && (
        viewMode === 'list'
          ? <div className="space-y-2">{[...Array(5)].map((_, i) => <RowSkel key={i} />)}</div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <CardSkel key={i} />)}</div>
      )}
      {!isLoading && profiles.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center">
          <ShieldCheck size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{search ? `No results for "${search}"` : `No ${activeTab} KYC submissions.`}</p>
        </div>
      )}
      {!isLoading && profiles.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">{profiles.map(p => <KYCRow key={p.id} profile={p} onClick={() => setSelected(p)} />)}</div>
      )}
      {!isLoading && profiles.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{profiles.map(p => <KYCCard key={p.id} profile={p} onClick={() => setSelected(p)} />)}</div>
      )}

      {selected && <KYCModal profile={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
