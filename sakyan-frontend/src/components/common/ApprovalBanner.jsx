import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PartyPopper, X, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const BANNER_KEY = 'sakyan_approval_banner'

export default function ApprovalBanner() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  // Show only if the localStorage flag is set AND user is now a partner
  useEffect(() => {
    if (user?.role === 'partner' && localStorage.getItem(BANNER_KEY) === '1') {
      setVisible(true)
    } else {
      setVisible(false)
    }
  }, [user?.role])

  const handleDismiss = () => {
    localStorage.removeItem(BANNER_KEY)
    setVisible(false)
  }

  const handleGoToDashboard = () => {
    localStorage.removeItem(BANNER_KEY)
    setVisible(false)
    navigate('/dashboard')
  }

  if (!visible) return null

  return (
    <div className="relative z-40 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
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

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleGoToDashboard}
            className="flex items-center gap-1.5 bg-white text-emerald-700 px-4 py-1.5
                       rounded-lg text-sm font-semibold hover:bg-emerald-50 transition shadow-sm"
          >
            <LayoutDashboard size={14} />
            Partner Dashboard
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="p-1.5 rounded-lg hover:bg-white/20 transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
