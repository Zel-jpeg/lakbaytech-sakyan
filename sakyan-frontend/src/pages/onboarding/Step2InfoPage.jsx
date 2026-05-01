import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import OnboardingLayout from './OnboardingLayout'
import { useOnboardingStore } from '@/store/onboardingStore'

const schema = z.object({
  business_name:    z.string().min(2, 'Business name is required'),
  business_address: z.string().min(10, 'Please enter a complete address'),
  contact_person:   z.string().min(2, 'Contact person name is required'),
  contact_phone:    z.string().min(10, 'Enter a valid phone number'),
})

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function Step2InfoPage() {
  const navigate = useNavigate()
  const store = useOnboardingStore()

  // Guard: bounce back if step 1 not done
  useEffect(() => {
    if (!store.isStep1Complete()) navigate('/onboarding/step1')
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {                        // ← pre-fills on refresh
      business_name:    store.business_name,
      business_address: store.business_address,
      contact_person:   store.contact_person,
      contact_phone:    store.contact_phone,
    },
  })

  const onSubmit = (data) => {
    store.setStep2(data)                    // ← store, not router state
    navigate('/onboarding/step3')
  }

  return (
    <OnboardingLayout currentStep={2}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Business information</h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Tell us a bit about your rental operation.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        <Field label="Business / Trade Name" error={errors.business_name?.message}>
          <input
            {...register('business_name')}
            placeholder={state?.partner_type === 'company' ? 'e.g. Juan Dela Cruz Car Rentals' : 'e.g. Juan\'s Cars'}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Business Address" error={errors.business_address?.message}>
          <textarea
            {...register('business_address')}
            rows={2}
            placeholder="Complete address where cars are based"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Contact Person" error={errors.contact_person?.message}>
            <input
              {...register('contact_person')}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Contact Phone" error={errors.contact_phone?.message}>
            <input
              {...register('contact_phone')}
              placeholder="e.g. 09171234567"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/onboarding/step1')}
            className="flex items-center gap-1.5 px-5 py-3 border border-gray-200
                       rounded-xl text-sm font-medium text-gray-600 hover:border-blue-300 transition"
          >
            <ArrowLeft size={15} />
            Back
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600
                       hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </OnboardingLayout>
  )
}