import { useState } from 'react'
import { useAdminPartners, useAdminPartnerAction } from '@/hooks/useAdmin'
import { useResponsiveView } from '@/hooks/useResponsiveView'
import { formatDate } from '@/utils/formatters'
import {
  CheckCircle2, XCircle, ShieldOff, User, Phone, Mail,
  FileText, Building2, MapPin, ExternalLink, Percent,
  Edit2, Check, X as XIcon, LayoutGrid, List, Search, Calendar,
} from 'lucide-react'

const STATUS_TABS = [
  { value: 'pending',   label: 'Pending',   dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'approved',  label: 'Approved',  dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'rejected',  label: 'Rejected',  dot: 'bg-red-500',     badge: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'suspended', label: 'Suspended', dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
]

const TYPE_STYLE = {
  company:    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  individual: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function StatusBadge({ status }) {
  const tab = STATUS_TABS.find(t => t.value === status)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${tab?.badge || 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab?.dot || 'bg-gray-400'}`} />
      {status}
    </span>
  )
}

// ─── Document Preview ─────────────────────────────────────────────────────────
function DocPreview({ label, url, required }) {
  const [lightbox, setLightbox] = useState(false)
  const isPdf = url?.toLowerCase().includes('.pdf')
  if (!url) return (
    <div className={`border border-dashed rounded-xl p-4 text-center text-xs ${required ? 'border-red-200 dark:border-red-900/40 text-red-400' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}>
      <FileText size={18} className="mx-auto mb-1 opacity-50" />{label} — not uploaded
    </div>
  )
  return (
    <>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"><FileText size={11} />{label}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">Open <ExternalLink size={10} /></a>
        </div>
        {isPdf ? (
          <div className="flex items-center justify-center py-6 bg-red-50/50 dark:bg-red-900/10 cursor-pointer" onClick={() => window.open(url, '_blank')}>
            <div className="text-center"><FileText size={24} className="text-red-400 mx-auto mb-1" /><p className="text-xs text-blue-500">Click to open PDF</p></div>
          </div>
        ) : (
          <div className="relative group cursor-zoom-in bg-gray-100 dark:bg-gray-800" onClick={() => setLightbox(true)}>
            <img src={url} alt={label} className="w-full max-h-40 object-contain p-2" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">Click to enlarge</div>
          </div>
        )}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <div className="relative max-w-3xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(false)} className="absolute -top-8 right-0 text-white text-sm">✕ Close</button>
            <img src={url} alt={label} className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </>
  )
}

// ─── Commission Editor ────────────────────────────────────────────────────────
function CommissionEditor({ partner }) {
  const [editing, setEditing] = useState(false)
  const [rate, setRate]       = useState(String(partner.commission_rate ?? 10))
  const actionMutation        = useAdminPartnerAction()
  const current = Number(partner.commission_rate ?? 10)
  const badge = current <= 8 ? `${current}% — Small Fleet` : current <= 10 ? `${current}% — Standard` : `${current}% — Custom`

  const handleSave = () => {
    const n = parseFloat(rate)
    if (isNaN(n) || n < 0 || n > 100) return
    actionMutation.mutate({ id: partner.id, action: 'update-commission', commission_rate: n })
    setEditing(false)
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Percent size={13} className="text-gray-400" />
      <span className="text-xs text-gray-500 dark:text-gray-400">Commission:</span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input type="number" min="0" max="100" step="0.5" value={rate} onChange={e => setRate(e.target.value)}
            className="w-16 border border-brand-300 dark:border-brand-600 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500" />
          <span className="text-xs text-gray-400">%</span>
          <button onClick={handleSave} disabled={actionMutation.isPending} className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition"><Check size={11} /></button>
          <button onClick={() => { setEditing(false); setRate(String(current)) }} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition"><XIcon size={11} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{badge}</span>
          <button onClick={() => setEditing(true)} className="p-1 rounded-lg text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Edit2 size={11} /></button>
        </div>
      )}
    </div>
  )
}

// ─── Partner Detail Modal ─────────────────────────────────────────────────────
function PartnerModal({ partner, onClose }) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason]       = useState('')
  const actionMutation = useAdminPartnerAction()
  const isPending  = partner.status === 'pending'
  const isApproved = partner.status === 'approved'

  const handleAction = (action, reason) => {
    actionMutation.mutate({ id: partner.id, action, reason }, { onSuccess: onClose })
    setShowRejectInput(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#1a1d2e] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 font-bold text-base">
              {partner.business_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{partner.business_name}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <StatusBadge status={partner.status} />
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[partner.partner_type] || TYPE_STYLE.individual}`}>{partner.partner_type}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition ml-2 shrink-0">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Business details */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><User size={14} className="text-gray-400 shrink-0" />{partner.contact_person}</div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Mail size={14} className="text-gray-400 shrink-0" /><span className="truncate">{partner.user_email}</span></div>
            {partner.contact_phone && <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Phone size={14} className="text-gray-400 shrink-0" />{partner.contact_phone}</div>}
            {partner.business_address && <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300"><MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />{partner.business_address}</div>}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs"><Calendar size={12} />Applied {formatDate(partner.created_at)}</div>
          </div>

          {/* Commission (approved only) */}
          {isApproved && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Commission Rate</p>
              <CommissionEditor partner={partner} />
            </div>
          )}

          {/* Documents */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Submitted Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocPreview label="Government-issued ID" url={partner.government_id_url} />
              <DocPreview label="Business Permit / DTI" url={partner.business_permit_url} required={partner.partner_type === 'company'} />
            </div>
          </div>

          {/* Rejection reason */}
          {partner.status === 'rejected' && partner.rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 dark:text-red-300">{partner.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
          {showRejectInput ? (
            <div className="space-y-2">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection — partner will see this (required)" rows={2}
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
            <div className="flex gap-2 flex-wrap">
              {isPending && (
                <>
                  <button onClick={() => handleAction('approve')} disabled={actionMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition">
                    <CheckCircle2 size={15} /> Approve
                  </button>
                  <button onClick={() => setShowRejectInput(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl transition">
                    <XCircle size={15} /> Reject
                  </button>
                </>
              )}
              {isApproved && (
                <button onClick={() => handleAction('suspend')} disabled={actionMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-bold rounded-xl transition">
                  <ShieldOff size={15} /> Suspend Partner
                </button>
              )}
              {!isPending && !isApproved && (
                <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No actions available for {partner.status} partners.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function PartnerRow({ partner, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3.5
                 hover:border-brand-200 dark:hover:border-brand-700/50 hover:shadow-sm transition-all group flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 font-bold text-sm">
        {partner.business_name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{partner.business_name}</p>
          <StatusBadge status={partner.status} />
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_STYLE[partner.partner_type] || TYPE_STYLE.individual}`}>{partner.partner_type}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
          <span className="flex items-center gap-1"><User size={10} />{partner.contact_person}</span>
          <span className="hidden sm:flex items-center gap-1"><Mail size={10} />{partner.user_email}</span>
          <span className="flex items-center gap-1"><Calendar size={10} />{formatDate(partner.created_at)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition shrink-0">View →</span>
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function PartnerCard({ partner, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4
                 hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700/50 transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-700 dark:text-blue-400 font-bold text-base">
          {partner.business_name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{partner.business_name}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <StatusBadge status={partner.status} />
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_STYLE[partner.partner_type] || TYPE_STYLE.individual}`}>{partner.partner_type}</span>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 mb-3">
        <div className="flex items-center gap-1.5"><User size={11} />{partner.contact_person}</div>
        <div className="flex items-center gap-1.5"><Mail size={11} /><span className="truncate">{partner.user_email}</span></div>
        {partner.contact_phone && <div className="flex items-center gap-1.5"><Phone size={11} />{partner.contact_phone}</div>}
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500"><Calendar size={11} />Applied {formatDate(partner.created_at)}</div>
      </div>
      {partner.status === 'approved' && (
        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2 flex items-center gap-1">
          <Percent size={11} /> Commission: {partner.commission_rate ?? 10}%
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex gap-1">
          {partner.government_id_url && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">ID ✓</span>}
          {partner.business_permit_url && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">Permit ✓</span>}
        </div>
        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium group-hover:underline">View details →</span>
      </div>
    </button>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function RowSkel() { return <div className="h-[68px] bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" /> }
function CardSkel() { return <div className="h-44 bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" /> }

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(null)
  const [viewMode, setViewMode]   = useResponsiveView('list')

  const { data, isLoading } = useAdminPartners(activeTab)
  const all      = data?.results || data || []
  const partners = search.trim()
    ? all.filter(p => p.business_name?.toLowerCase().includes(search.toLowerCase()) || p.contact_person?.toLowerCase().includes(search.toLowerCase()) || p.user_email?.toLowerCase().includes(search.toLowerCase()))
    : all

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Applications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review, approve, and manage partner accounts.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by business name, contact, or email…"
            className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1a1d2e] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1 shrink-0 self-start sm:self-auto">
          <button onClick={() => setViewMode('list')} title="List" className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}><List size={16} /></button>
          <button onClick={() => setViewMode('card')} title="Card" className={`p-2 rounded-lg transition ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === tab.value ? 'bg-brand-600 text-white shadow-sm' : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {!isLoading && partners.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{partners.length} {activeTab} partner{partners.length !== 1 ? 's' : ''}{search && ` matching "${search}"`}</p>
      )}

      {isLoading && (viewMode === 'list'
        ? <div className="space-y-2">{[...Array(5)].map((_, i) => <RowSkel key={i} />)}</div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <CardSkel key={i} />)}</div>
      )}
      {!isLoading && partners.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center">
          <Building2 size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">{search ? `No results for "${search}"` : `No ${activeTab} applications.`}</p>
        </div>
      )}
      {!isLoading && partners.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">{partners.map(p => <PartnerRow key={p.id} partner={p} onClick={() => setSelected(p)} />)}</div>
      )}
      {!isLoading && partners.length > 0 && viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{partners.map(p => <PartnerCard key={p.id} partner={p} onClick={() => setSelected(p)} />)}</div>
      )}

      {selected && <PartnerModal partner={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}