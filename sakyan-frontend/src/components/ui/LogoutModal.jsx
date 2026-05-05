import { LogOut, X } from 'lucide-react'

/**
 * Reusable logout confirmation modal.
 *
 * Usage:
 *   const [showLogout, setShowLogout] = useState(false)
 *   <LogoutModal open={showLogout} onConfirm={logoutAction} onCancel={() => setShowLogout(false)} />
 *   <button onClick={() => setShowLogout(true)}>Log out</button>
 */
export default function LogoutModal({ open, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm bg-white dark:bg-[#1a1d2e] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Icon + text */}
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <LogOut size={26} className="text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Log out?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You will be signed out of your account and redirected to the login page.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300
                       text-sm font-semibold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-2xl
                       transition shadow-sm shadow-red-500/20 flex items-center justify-center gap-2"
          >
            <LogOut size={15} /> Log out
          </button>
        </div>
      </div>
    </div>
  )
}
