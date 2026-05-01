import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, X, Info } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import OnboardingLayout from './OnboardingLayout'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useOnboardingStore } from '@/store/onboardingStore'
import api from '@/config/axios'

function FileUploadBox({ label, hint, url, onUpload, onClear, uploading, required }) {
  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onUpload(file)
    e.target.value = ''
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {required && <span className="text-xs text-red-500">*</span>}
      </div>
      {hint && (
        <p className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Info size={11} />
          {hint}
        </p>
      )}
      {url ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-700 hover:underline truncate flex-1"
          >
            View uploaded file
          </a>
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-red-500 transition shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center gap-2 p-5
                           border-2 border-dashed border-gray-200 rounded-xl cursor-pointer
                           hover:border-blue-400 hover:bg-blue-50/40 transition
                           ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading
            ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            : <Upload size={20} className="text-gray-400" />
          }
          <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : 'Click to upload'}</span>
          <span className="text-xs text-gray-400">JPG, PNG or PDF</span>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}

export default function Step3DocsPage() {
  const navigate = useNavigate()
  const store = useOnboardingStore()

  // Guard: bounce back if prior steps not done
  useEffect(() => {
    if (!store.isStep1Complete()) navigate('/onboarding/step1')
    else if (!store.isStep2Complete()) navigate('/onboarding/step2')
  }, [])

  const isCompany = store.partner_type === 'company'

  // Pre-fill uploaded URLs if user came back
  const [govIdUrl,  setGovIdUrl]  = useState(store.government_id_url)
  const [permitUrl, setPermitUrl] = useState(store.business_permit_url)

  // Sync URLs into store as they upload
  const handleGovId = async (file) => {
    const url = await uploadFile(file)
    if (url) { setGovIdUrl(url); store.setStep3({ government_id_url: url }) }
  }
  const handlePermit = async (file) => {
    const url = await uploadFile(file)
    if (url) { setPermitUrl(url); store.setStep3({ business_permit_url: url }) }
  }

  const applyMutation = useMutation({
    mutationFn: (data) => api.post('/partner/apply/', data).then(r => r.data),
    onSuccess: () => {
      store.reset()                         // ← wipe sessionStorage on success
      navigate('/onboarding/pending')
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.')
    },
  })

  const canSubmit = govIdUrl && (!isCompany || permitUrl) && !applyMutation.isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    applyMutation.mutate({
      partner_type:        store.partner_type,
      business_name:       store.business_name,
      business_address:    store.business_address,
      contact_person:      store.contact_person,
      contact_phone:       store.contact_phone,
      government_id_url:   govIdUrl,
      business_permit_url: permitUrl || undefined,
    })
  }

  return (
    <OnboardingLayout currentStep={3}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload your documents</h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          These are kept private and only used for verification. We'll review them within 1–2 business days.
        </p>
      </div>

      <div className="space-y-5 mb-8">
        <FileUploadBox
          label="Government-issued ID"
          hint="Passport, Driver's License, SSS, UMID, or any valid government ID"
          url={govIdUrl}
          onUpload={async (f) => { const u = await uploadFile(f); if (u) setGovIdUrl(u) }}
          onClear={() => setGovIdUrl('')}
          uploading={uploading}
          required
        />

        {isCompany && (
          <FileUploadBox
            label="Business Permit / DTI / SEC Registration"
            hint="Required for company accounts"
            url={permitUrl}
            onUpload={async (f) => { const u = await uploadFile(f); if (u) setPermitUrl(u) }}
            onClear={() => setPermitUrl('')}
            uploading={uploading}
            required
          />
        )}

        {/* Summary of what they entered */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-medium text-gray-700 mb-2">Submitting as:</p>
          <div className="flex justify-between text-gray-500">
            <span>Type</span>
            <span className="font-medium text-gray-800 capitalize">{state?.partner_type}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Business Name</span>
            <span className="font-medium text-gray-800">{state?.business_name}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Contact</span>
            <span className="font-medium text-gray-800">{state?.contact_person}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/onboarding/step2', { state })}
          className="flex items-center gap-1.5 px-5 py-3 border border-gray-200
                     rounded-xl text-sm font-medium text-gray-600 hover:border-blue-300 transition"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                      text-sm font-semibold transition ${
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {applyMutation.isPending ? 'Submitting…' : 'Submit Application'}
          {!applyMutation.isPending && <ArrowRight size={16} />}
        </button>
      </div>
    </OnboardingLayout>
  )
}