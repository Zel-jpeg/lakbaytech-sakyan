import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartyPopper, X, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const BANNER_KEY    = 'sakyan_approval_banner'
const DISMISSED_KEY = 'sakyan_approval_banner_dismissed'

/**
 * ApprovalBanner
 *
 * A sticky full-width green gradient banner that appears below the navbar
 * when a customer has just been approved as a Sakyan Partner.
 *
 * It stays visible until the partner:
 *   a) Clicks "Partner Dashboard" on the banner (navigates to /dashboard), OR
 *   b) Clicks the X dismiss button, OR
 *   c) Visits the partner dashboard from anywhere
 *
 * After dismissal, it will never re-appear for the same approval event.
 */
export default function ApprovalBanner() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const bannerSet    = localStorage.getItem(BANNER_KEY) === '1'
    const dismissed    = localStorage.getItem(DISMISSED_KEY) === '1'
    const isPartner    = user?.role === 'partner'

    // Show if: user is approved partner, banner flag is set, and NOT dismissed yet
    setVisible(isPartner && bannerSet && !dismissed)
  }, [user?.role, user?.id])

  const dismiss = (goToDashboard = false) => {
    localStorage.removeItem(BANNER_KEY)
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
    if (goToDashboard) navigate('/dashboard')
  }

  if (!visible) return null

  return (
    <div className="relative z-40 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Icon + message */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <PartyPopper size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm sm:text-base">
              🎉 Congratulations! You're approved as a Sakyan Partner!
            </p>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              You can now list your cars and start earning. Visit your Partner Dashboard to get started.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => dismiss(true)}
            className="flex items-center gap-1.5 bg-white text-emerald-700 px-4 py-1.5
                       rounded-lg text-sm font-semibold hover:bg-emerald-50 transition shadow-sm"
          >
            <LayoutDashboard size={14} />
            Go to Partner Dashboard
          </button>
          <button
            onClick={() => dismiss(false)}
            aria-label="Dismiss banner"
            className="p-1.5 rounded-lg hover:bg-white/20 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
