import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, Bell, ShieldCheck, ArrowLeft, RotateCcw, Car } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

const POLL_INTERVAL = 8000 // check every 8 seconds

const TIMELINE = [
  {
    icon: CheckCircle2,
    title: 'Documents submitted',
    description: "We have received your driver's license and valid ID.",
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
    title: "You'll be notified",
    description: "You'll receive a notification once your identity is approved.",
    done: false,
  },
]

export default function KYCPendingPage() {
  const navigate           = useNavigate()
  const { user, refreshUser, setUser } = useAuthStore()
  const alreadyRedirected  = useRef(false)

  // ── Destination car saved by KYCVerificationPage ──────────────────────────
  const savedDestination = localStorage.getItem('kyc_return_to') || '/cars'

  // ── Poll /api/customer/kyc/ every 8s ─────────────────────────────────────
  const { data: kycData } = useQuery({
    queryKey: ['customer', 'kyc', 'poll'],
    queryFn: () => api.get('/customer/kyc/').then(r => r.data),
    refetchInterval: POLL_INTERVAL,
    enabled: !!user,
  })

  // ── React to status changes ───────────────────────────────────────────────
  useEffect(() => {
    if (!kycData || alreadyRedirected.current) return

    if (kycData.kyc_status === 'approved') {
      alreadyRedirected.current = true

      // Sync auth store so the rest of the app knows immediately
      refreshUser()

      toast.success('🎉 Identity verified! You can now book cars.', {
        duration: 6000,
        icon: '✅',
      })

      // Small delay so toast shows, then redirect to the car they were booking
      setTimeout(() => {
        localStorage.removeItem('kyc_return_to')
        navigate(savedDestination, { replace: true })
      }, 2000)
    }

    if (kycData.kyc_status === 'rejected') {
      // Update store so the rejection reason shows
      setUser({ ...user, customer_profile: kycData })
    }
  }, [kycData])

  // ── Redirect if not logged in or already approved ────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return }
    const status = user?.customer_profile?.kyc_status
    if (status === 'approved') navigate(savedDestination, { replace: true })
    if (!status || status === 'not_submitted') navigate('/kyc/verify')
  }, [])

  const isRejected = kycData?.kyc_status === 'rejected'
    || user?.customer_profile?.kyc_status === 'rejected'

  const rejectionReason = kycData?.kyc_rejection_reason
    || user?.customer_profile?.kyc_rejection_reason

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 mb-4">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center
                            ${isRejected
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-brand-50 dark:bg-brand-900/20'}`}>
              <ShieldCheck size={36} className={
                isRejected ? 'text-red-500' : 'text-brand-500'
              } />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {isRejected ? 'Verification Not Approved' : 'Verification in Progress'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isRejected
              ? 'Your documents were not approved. Please re-submit with the correct information.'
              : 'Your documents have been submitted and are being reviewed. This page will update automatically.'}
          </p>

          {/* Live polling indicator */}
          {!isRejected && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Checking status automatically…</span>
            </div>
          )}

          {/* Rejection reason */}
          {isRejected && rejectionReason && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800
                            rounded-xl p-4 text-sm">
              <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Reason:</p>
              <p className="text-red-600 dark:text-red-300">{rejectionReason}</p>
            </div>
          )}

          {/* Timeline (pending only) */}
          {!isRejected && (
            <div className="relative mt-8">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-6">
                {TIMELINE.map(({ icon: Icon, title, description, done }, i) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <Icon size={18} className={
                        done ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                      } />
                    </div>
                    <div className="pt-2">
                      <p className={`text-sm font-semibold ${
                        done ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>{title}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {isRejected && (
            <button
              onClick={() => navigate('/kyc/verify')}
              className="flex items-center justify-center gap-2 w-full py-3
                         bg-gradient-to-r from-brand-500 to-brand-600
                         hover:from-brand-600 hover:to-brand-700
                         text-white text-sm font-semibold rounded-2xl transition shadow-md shadow-brand-500/20">
              <RotateCcw size={15} /> Re-submit Verification
            </button>
          )}

          {/* Show the car they were trying to book */}
          {savedDestination !== '/cars' && !isRejected && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100
                            dark:border-blue-800 rounded-2xl px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
              <Car size={14} className="shrink-0" />
              Once approved, you'll be automatically taken back to finish your booking.
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 w-full py-3
                       bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 text-sm font-medium rounded-2xl
                       hover:border-brand-300 dark:hover:border-brand-600 transition">
            <ArrowLeft size={15} /> Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
