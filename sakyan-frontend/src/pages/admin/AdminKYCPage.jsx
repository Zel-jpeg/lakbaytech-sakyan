import { useState } from 'react'
import { useAdminKYC, useAdminKYCAction } from '@/hooks/useAdmin'
import { formatDate } from '@/utils/formatters'
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  User, Phone, Mail, FileText, MapPin, ExternalLink, ShieldCheck, ShieldOff,
} from 'lucide-react'

const STATUS_TABS = [
  { value: 'pending',  label: 'Pending',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
]

function StatusBadge({ status }) {
  const tab = STATUS_TABS.find(t => t.value === status)
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${tab?.color || ''}`}>
      {status === 'approved' && <ShieldCheck size={11} />}
      {status === 'rejected' && <ShieldOff size={11} />}
      {status}
    </span>
  )
}

function DocPreview({ label, url }) {
  const [lightbox, setLightbox] = useState(false)
  return (
    <>
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#1a1d2e]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            <FileText size={12} className="text-gray-400" />{label}
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            Open <ExternalLink size={10} />
          </a>
        </div>
        {url ? (
          <div className="relative group cursor-zoom-in bg-gray-100 dark:bg-gray-800" onClick={() => setLightbox(true)}>
            <img src={url} alt={label} className="w-full max-h-48 object-contain p-2" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                            transition flex items-center justify-center text-white text-xs font-medium">
              Click to enlarge
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-600">No document uploaded</div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(false)} className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300">
              ✕ Close
            </button>
            <img src={url} alt={label} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <p className="text-center text-white/70 text-xs mt-3">{label}</p>
          </div>
        </div>
      )}
    </>
  )
}

function KYCCard({ profile, activeTab }) {
  const [expanded,        setExpanded]        = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason,    setRejectReason]    = useState('')
  const actionMutation = useAdminKYCAction()

  const isPending  = profile.kyc_status === 'pending'
  const isApproved = profile.kyc_status === 'approved'

  const handleAction = (action, reason) => {
    actionMutation.mutate({ id: profile.id, action, reason })
    setShowRejectInput(false)
    setRejectReason('')
  }

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Summary row */}
      <div className="bg-white dark:bg-[#1a1d2e] px-4 py-4 flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30
                        flex items-center justify-center shrink-0
                        text-brand-600 dark:text-brand-400 font-bold text-sm">
          {profile.full_name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 dark:text-white">{profile.full_name}</p>
            <StatusBadge status={profile.kyc_status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><Mail size={11} />{profile.email}</span>
            {profile.contact_number && (
              <span className="flex items-center gap-1"><Phone size={11} />{profile.contact_number}</span>
            )}
            {profile.kyc_submitted_at && (
              <span>Submitted {formatDate(profile.kyc_submitted_at)}</span>
            )}
          </div>
        </div>

        <button onClick={() => setExpanded(e => !e)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 px-4 py-4 space-y-4">

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{profile.full_name}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{profile.contact_number || '—'}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300 sm:col-span-2">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{profile.address || '—'}</span>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Submitted Documents
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DocPreview label="Driver's License" url={profile.drivers_license_url} />
              <DocPreview label="Valid Government ID" url={profile.valid_id_url} />
            </div>
          </div>

          {/* Rejection reason (if rejected) */}
          {profile.kyc_status === 'rejected' && profile.kyc_rejection_reason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 dark:text-red-300">{profile.kyc_rejection_reason}</p>
            </div>
          )}

          {/* Actions */}
          <div>
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection — customer will see this (required)"
                  rows={2}
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200
                             rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction('reject', rejectReason)}
                    disabled={!rejectReason.trim() || actionMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2
                               bg-red-600 hover:bg-red-700 disabled:bg-gray-200 dark:disabled:bg-gray-700
                               text-white disabled:text-gray-400 text-sm font-semibold rounded-xl transition">
                    <XCircle size={15} /> Confirm Reject
                  </button>
                  <button onClick={() => setShowRejectInput(false)}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-sm rounded-xl
                               text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {isPending && (
                  <>
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={actionMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2
                                 bg-green-600 hover:bg-green-700 disabled:opacity-50
                                 text-white text-sm font-semibold rounded-xl transition">
                      <CheckCircle2 size={15} /> Approve
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="flex items-center gap-1.5 px-4 py-2
                                 bg-white dark:bg-transparent border border-gray-200 dark:border-gray-700
                                 hover:border-red-300 dark:hover:border-red-600 text-red-600 dark:text-red-400
                                 text-sm font-semibold rounded-xl transition">
                      <XCircle size={15} /> Reject
                    </button>
                  </>
                )}
                {isApproved && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20
                                border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                    <ShieldCheck size={14} /> Verified — customer can book cars
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminKYCPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const { data, isLoading } = useAdminKYC(activeTab)
  const profiles = data?.results || data || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Verification (KYC)</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Review and approve customer identity submissions before they can book cars.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.value
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && profiles.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center">
          <ShieldCheck size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No {activeTab} KYC submissions.</p>
        </div>
      )}

      <div className="space-y-3">
        {profiles.map(profile => (
          <KYCCard key={profile.id} profile={profile} activeTab={activeTab} />
        ))}
      </div>
    </div>
  )
}
