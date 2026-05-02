import { useState } from 'react'
import { useAdminPartners, useAdminPartnerAction } from '@/hooks/useAdmin'
import { formatDate } from '@/utils/formatters'
import {
  CheckCircle2, XCircle, ShieldOff, ChevronDown, ChevronUp,
  User, Phone, Mail, FileText, Building2, MapPin, ExternalLink
} from 'lucide-react'

const STATUS_TABS = [
  { value: 'pending',   label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  { value: 'approved',  label: 'Approved',  color: 'bg-green-100 text-green-700' },
  { value: 'rejected',  label: 'Rejected',  color: 'bg-red-100 text-red-600' },
  { value: 'suspended', label: 'Suspended', color: 'bg-gray-100 text-gray-600' },
]

function StatusBadge({ status }) {
  const tab = STATUS_TABS.find(t => t.value === status)
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${tab?.color || 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
      {status}
    </span>
  )
}

// ── Document Preview (image thumbnail or PDF card) ────────────────────────────
function DocPreview({ label, url }) {
  const [lightbox, setLightbox] = useState(false)
  const isPdf = url?.toLowerCase().includes('.pdf')

  return (
    <>
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-[#1a1d2e]">
        {/* Label bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            <FileText size={12} className="text-gray-400 dark:text-gray-500" />
            {label}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
          >
            Open <ExternalLink size={10} />
          </a>
        </div>

        {isPdf ? (
          /* PDF card */
          <div className="flex items-center justify-center py-8 bg-red-50/50 cursor-pointer"
               onClick={() => window.open(url, '_blank')}>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <FileText size={24} className="text-red-500" />
              </div>
              <p className="text-xs text-gray-500">PDF Document</p>
              <p className="text-xs text-blue-500 mt-1">Click to open</p>
            </div>
          </div>
        ) : (
          /* Image preview */
          <div
            className="relative group cursor-zoom-in bg-gray-100"
            onClick={() => setLightbox(true)}
          >
            <img
              src={url}
              alt={label}
              className="w-full max-h-48 object-contain p-2"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                            transition flex items-center justify-center text-white text-xs font-medium">
              Click to enlarge
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
            >
              ✕ Close
            </button>
            <img
              src={url}
              alt={label}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-center text-white/70 text-xs mt-3">{label}</p>
          </div>
        </div>
      )}
    </>
  )
}

function PartnerCard({ partner, activeTab }) {
  const [expanded, setExpanded]           = useState(false)
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason]   = useState('')
  const actionMutation = useAdminPartnerAction()

  const isPending  = partner.status === 'pending'
  const isApproved = partner.status === 'approved'

  const handleAction = (action, reason) => {
    actionMutation.mutate({ id: partner.id, action, reason })
    setShowRejectInput(false)
  }

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      {/* Summary row */}
      <div className="bg-white dark:bg-[#1a1d2e] px-4 py-4 flex items-center gap-4">
        {/* Avatar initial */}
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center
                        shrink-0 text-blue-600 dark:text-blue-400 font-bold text-sm">
          {partner.business_name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 dark:text-white">{partner.business_name}</p>
            <StatusBadge status={partner.status} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${partner.partner_type === 'company'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {partner.partner_type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1"><User size={11} />{partner.contact_person}</span>
            <span className="flex items-center gap-1"><Mail size={11} />{partner.user_email}</span>
            <span>Applied {formatDate(partner.created_at)}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="p-2 text-gray-400 hover:text-gray-600 transition shrink-0"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 px-4 py-4 space-y-4">

          {/* Business details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{partner.business_name}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{partner.business_address || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Phone size={14} className="text-gray-400" />
              <span>{partner.contact_phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Mail size={14} className="text-gray-400" />
              <span>{partner.user_email}</span>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Submitted Documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Government ID */}
              {partner.government_id_url ? (
                <DocPreview
                  label="Government-issued ID"
                  url={partner.government_id_url}
                />
              ) : (
                <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs text-gray-400 flex items-center gap-2">
                  <FileText size={14} /> No Government ID uploaded
                </div>
              )}

              {/* Business Permit */}
              {partner.business_permit_url ? (
                <DocPreview
                  label="Business Permit / DTI"
                  url={partner.business_permit_url}
                />
              ) : partner.partner_type === 'company' ? (
                <div className="border border-dashed border-red-200 rounded-xl p-4 text-xs text-red-400 flex items-center gap-2">
                  <FileText size={14} /> No Business Permit uploaded
                </div>
              ) : null}

            </div>
          </div>

          {/* Rejection reason if rejected */}
          {partner.status === 'rejected' && partner.rejection_reason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{partner.rejection_reason}</p>
            </div>
          )}

          {/* Actions */}
          <div>
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection — partner will see this (required)"
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction('reject', rejectReason)}
                    disabled={!rejectReason.trim() || actionMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700
                               disabled:bg-gray-200 text-white text-sm font-semibold rounded-xl transition"
                  >
                    <XCircle size={15} />
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-4 py-2 border border-gray-200 text-sm rounded-xl hover:border-gray-300 transition"
                  >
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
                  </>
                )}

                {isApproved && (
                  <button
                    onClick={() => handleAction('suspend')}
                    disabled={actionMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200
                               hover:border-orange-300 text-orange-600 text-sm font-semibold rounded-xl transition"
                  >
                    <ShieldOff size={15} />
                    Suspend
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const { data, isLoading } = useAdminPartners(activeTab)
  const partners = data?.results || data || []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Applications</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review, approve, and manage partner accounts.</p>
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
            }`}
          >
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

      {!isLoading && partners.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center">
          <Building2 size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No {activeTab} applications.</p>
        </div>
      )}

      <div className="space-y-3">
        {partners.map(partner => (
          <PartnerCard key={partner.id} partner={partner} activeTab={activeTab} />
        ))}
      </div>
    </div>
  )
}