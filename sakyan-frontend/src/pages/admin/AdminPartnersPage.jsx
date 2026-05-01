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
                      ${tab?.color || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
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
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      {/* Summary row */}
      <div className="bg-white px-4 py-4 flex items-center gap-4">
        {/* Avatar initial */}
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center
                        shrink-0 text-blue-600 font-bold text-sm">
          {partner.business_name?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800">{partner.business_name}</p>
            <StatusBadge status={partner.status} />
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${partner.partner_type === 'company'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600'}`}>
              {partner.partner_type}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
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
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">

          {/* Business details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 text-gray-700">
              <Building2 size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{partner.business_name}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <span>{partner.business_address || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone size={14} className="text-gray-400" />
              <span>{partner.contact_phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={14} className="text-gray-400" />
              <span>{partner.user_email}</span>
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</p>
            <div className="flex gap-3 flex-wrap">
              {partner.government_id_url && (
                <a href={partner.government_id_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                              rounded-lg text-xs text-blue-600 hover:border-blue-300 transition">
                  <FileText size={13} />
                  Government ID
                  <ExternalLink size={11} />
                </a>
              )}
              {partner.business_permit_url && (
                <a href={partner.business_permit_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
                              rounded-lg text-xs text-blue-600 hover:border-blue-300 transition">
                  <FileText size={13} />
                  Business Permit / DTI
                  <ExternalLink size={11} />
                </a>
              )}
              {!partner.government_id_url && !partner.business_permit_url && (
                <p className="text-xs text-gray-400">No documents uploaded.</p>
              )}
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
        <h1 className="text-2xl font-bold text-gray-900">Partner Applications</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review, approve, and manage partner accounts.</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.value
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

      {!isLoading && partners.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No {activeTab} applications.</p>
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