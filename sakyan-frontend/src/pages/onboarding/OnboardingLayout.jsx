import { useLocation, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Account Type', path: '/onboarding/step1' },
  { number: 2, label: 'Business Info', path: '/onboarding/step2' },
  { number: 3, label: 'Documents',    path: '/onboarding/step3' },
  { number: 4, label: 'Review',       path: '/onboarding/pending' },
]

export default function OnboardingLayout({ children, currentStep }) {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">Sakyan</span>
          <span className="text-sm text-gray-400">Partner Onboarding</span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* connector line */}
            <div className="absolute top-4 left-0 right-0 h-px bg-gray-200 z-0" />

            {STEPS.map((step) => {
              const done    = step.number < currentStep
              const active  = step.number === currentStep

              return (
                <div key={step.number} className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                    done   ? 'bg-blue-600 text-white' :
                    active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                             'bg-white border-2 border-gray-200 text-gray-400'
                  }`}>
                    {done ? <Check size={14} /> : step.number}
                  </div>
                  <span className={`text-xs hidden sm:block ${active ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </div>
    </div>
  )
}