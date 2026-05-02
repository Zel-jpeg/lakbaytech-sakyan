import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Profile</h1>
      
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="bg-brand-600 h-24"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1a1d2e] bg-white dark:bg-[#1a1d2e] object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white dark:border-[#1a1d2e] bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 flex items-center justify-center text-3xl font-bold">
                {user?.full_name?.[0]?.toUpperCase()}
              </div>
            )}
            <span className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800 text-sm font-semibold rounded-full capitalize">
              {user?.role}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</label>
              <p className="text-gray-900 dark:text-white text-lg font-medium">{user?.full_name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Address</label>
                <p className="text-gray-900 dark:text-white">{user?.email}</p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</label>
                <p className="text-gray-900 dark:text-white">{user?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div>
               <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Created</label>
               <p className="text-gray-900 dark:text-white">{user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
