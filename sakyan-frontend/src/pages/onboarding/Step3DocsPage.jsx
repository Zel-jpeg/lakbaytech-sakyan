import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, X, Info, FileText } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import OnboardingLayout from './OnboardingLayout'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useOnboardingStore } from '@/store/onboardingStore'
import api from '@/config/axios'

function FileUploadBox({ label, hint, url, onUploaded, onClear, required }) {
  const { uploadFile, uploading, deleteFile } = useFileUpload('uploads')
  const [localPreview, setLocalPreview] = useState(null)
  const [isPdf, setIsPdf] = useState(false)

  const handleChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsPdf(file.type === 'application/pdf')
    if (file.type.startsWith('image/')) setLocalPreview(URL.createObjectURL(file))

    // Pass current url so old file gets deleted before uploading new one
    const uploaded = await uploadFile(file, url || null)
    if (uploaded) {
      onUploaded(uploaded)
    } else {
      setLocalPreview(null)
    }
    e.target.value = ''
  }

  const handleClear = async () => {
    if (url) await deleteFile(url)   // remove from Supabase storage
    setLocalPreview(null)
    setIsPdf(false)
    onClear()
  }

  // Detect if stored URL is a PDF
  const displayIsPdf = isPdf || url?.toLowerCase().includes('.pdf')
  const previewUrl   = localPreview || url

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
        /* ── Uploaded: show preview ── */
        <div className="border border-green-200 rounded-xl overflow-hidden bg-green-50">
          {displayIsPdf ? (
            /* PDF preview */
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <FileText size={20} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">PDF document</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Click to view
                </a>
              </div>
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />
              <button type="button" onClick={handleClear} className="text-gray-400 hover:text-red-500 transition shrink-0">
                <X size={15} />
              </button>
            </div>
          ) : (
            /* Image preview */
            <div className="relative group bg-gray-100">
              <img
                src={previewUrl || url}
                alt="Uploaded document"
                className="w-full max-h-72 object-contain p-2"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                              transition flex items-center justify-center gap-3 rounded-b-xl">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  View full
                </a>
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
                >
                  Remove
                </button>
              </div>
              {/* Check badge */}
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5">
                <CheckCircle2 size={14} className="text-white" />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Not uploaded yet ── */
        <label className={`flex flex-col items-center justify-center gap-2 p-5
                           border-2 border-dashed border-gray-200 rounded-xl cursor-pointer
                           hover:border-blue-400 hover:bg-blue-50/40 transition
                           ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading
            ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            : <Upload size={20} className="text-gray-400" />
          }
          <span className="text-sm text-gray-500">{uploading ? 'Uploading…' : 'Click to upload'}</span>
          <span className="text-xs text-gray-400">JPG, PNG or PDF · Max 5 MB</span>
          <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleChange} />
        </label>
      )}
    </div>
  )
}

export default function Step3DocsPage() {
  const navigate = useNavigate()
  const store    = useOnboardingStore()

  // Guard: bounce back if prior steps not done
  useEffect(() => {
    if (!store.isStep1Complete()) navigate('/onboarding/step1')
    else if (!store.isStep2Complete()) navigate('/onboarding/step2')
  }, [])

  const isCompany = store.partner_type === 'company'

  const [govIdUrl,  setGovIdUrl]  = useState(store.government_id_url  || '')
  const [permitUrl, setPermitUrl] = useState(store.business_permit_url || '')

  // Business permit is required for both individual and company partners
  const permitLabel = isCompany
    ? 'Business Permit / DTI / SEC Registration'
    : "Business / Mayor's Permit or DTI Registration"
  const permitHint  = isCompany
    ? 'Required for company accounts'
    : "Required — proves your business is legally registered (Mayor's Permit, DTI, etc.)"

  const applyMutation = useMutation({
    mutationFn: (data) => api.post('/partner/apply/', data).then(r => r.data),
    onSuccess: () => {
      store.reset()
      navigate('/onboarding/pending')
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Submission failed. Please try again.')
    },
  })

  // Both individual and company must submit a government ID + business permit
  const canSubmit = govIdUrl && permitUrl && !applyMutation.isPending

  const handleSubmit = () => {
    if (!canSubmit) return
    applyMutation.mutate({
      partner_type:        store.partner_type,
      business_name:       store.business_name,
      business_address:    store.business_address,
      business_lat:        store.business_lat,
      business_lng:        store.business_lng,
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
          onUploaded={(u) => { setGovIdUrl(u); store.setStep3({ government_id_url: u }) }}
          onClear={() => setGovIdUrl('')}
          required
        />

        <FileUploadBox
          label={permitLabel}
          hint={permitHint}
          url={permitUrl}
          onUploaded={(u) => { setPermitUrl(u); store.setStep3({ business_permit_url: u }) }}
          onClear={() => setPermitUrl('')}
          required
        />

        {/* Summary of what they entered */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-medium text-gray-700 mb-2">Submitting as:</p>
          <div className="flex justify-between text-gray-500">
            <span>Type</span>
            <span className="font-medium text-gray-800 capitalize">{store.partner_type}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Business Name</span>
            <span className="font-medium text-gray-800">{store.business_name}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Address</span>
            <span className="font-medium text-gray-800 text-right max-w-[60%]">{store.business_address}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Contact</span>
            <span className="font-medium text-gray-800">{store.contact_person}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/onboarding/step2')}
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