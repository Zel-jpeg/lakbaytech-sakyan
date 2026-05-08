import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Building2, ArrowRight } from 'lucide-react'
import OnboardingLayout from './OnboardingLayout'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useAuthStore } from '@/store/authStore'

const TYPES = [
  {
    value: 'individual',
    icon: User,
    title: 'Individual',
    description: 'You own cars personally and want to rent them out on the side.',
  },
  {
    value: 'company',
    icon: Building2,
    title: 'Company',
    description: 'You run a registered car rental business with a business permit.',
  },
]

export default function Step1TypePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { partner_type, setStep1 } = useOnboardingStore()
  const [selected, setSelected] = useState(partner_type) // pre-fills on refresh

  // Guard: if they already submitted an application that is pending,
  // send them to the waiting page — no need to restart from step 1.
  useEffect(() => {
    if (user?.partner_status === 'pending') {
      navigate('/onboarding/pending', { replace: true })
    }
  }, [user?.partner_status])

  const handleNext = () => {
    if (!selected) return
    setStep1({ partner_type: selected })   // ← store, not router state
    navigate('/onboarding/step2')
  }

  return (
    <OnboardingLayout currentStep={1}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">How will you list cars?</h1>
        <p className="text-gray-500 mt-1.5 text-sm">
          Choose the option that best describes you. This affects what documents we'll ask for.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {TYPES.map(({ value, icon: Icon, title, description }) => (
          <button
            key={value}
            onClick={() => setSelected(value)}
            className={`text-left p-6 rounded-2xl border-2 transition ${
              selected === value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              selected === value ? 'bg-blue-600' : 'bg-gray-100'
            }`}>
              <Icon size={22} className={selected === value ? 'text-white' : 'text-gray-500'} />
            </div>
            <p className="font-semibold text-gray-900 mb-1">{title}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!selected}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                    text-sm font-semibold transition ${
          selected
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        Continue
        <ArrowRight size={16} />
      </button>
    </OnboardingLayout>
  )
}