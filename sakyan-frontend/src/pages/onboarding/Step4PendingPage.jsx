import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, Bell, Mail, Home } from 'lucide-react'
import OnboardingLayout from './OnboardingLayout'

const STEPS_AFTER = [
  {
    icon: CheckCircle2,
    title: 'Application received',
    description: 'We have your documents and business information.',
    done: true,
  },
  {
    icon: Clock,
    title: 'Under review',
    description: 'Our team will verify your documents within 1–2 business days.',
    done: false,
  },
  {
    icon: Bell,
    title: 'You\'ll be notified',
    description: 'You\'ll get a notification and email once your application is approved or rejected.',
    done: false,
  },
]

export default function Step4PendingPage() {
  const navigate = useNavigate()

  return (
    <OnboardingLayout currentStep={4}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16
                        bg-blue-100 rounded-full mb-4">
          <Clock size={30} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-sm mx-auto">
          Thanks for applying to be a Sakyan partner. Here's what happens next.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative mb-10">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-6">
          {STEPS_AFTER.map(({ icon: Icon, title, description, done }, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                done ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Icon size={18} className={done ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div className="pt-2">
                <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-500'}`}>
                  {title}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-sm text-blue-700">
        💡 While you wait, you can still use Sakyan as a customer — browse cars and make bookings normally.
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex-1 flex items-center justify-center gap-2 py-3
                     bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
        >
          <Home size={15} />
          Go to Home
        </button>
        <button
          onClick={() => navigate('/cars')}
          className="flex-1 py-3 border border-gray-200 text-gray-700
                     rounded-xl text-sm font-semibold hover:border-blue-300 transition"
        >
          Browse Cars
        </button>
      </div>
    </OnboardingLayout>
  )
}