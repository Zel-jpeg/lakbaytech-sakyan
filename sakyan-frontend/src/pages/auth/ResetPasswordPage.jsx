import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { supabase } from '@/config/supabase'

export default function ResetPasswordPage() {
  const { updatePasswordMutation } = useAuth()
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase redirects with access token in the URL hash, which it handles automatically.
    // If we're not authenticated by the time we load this page (meaning no hash was present and absorbed), we should not let them change it.
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error('Invalid or expired reset link.')
        navigate('/login')
      }
    }
    checkSession()
  }, [navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    updatePasswordMutation.mutate({ password })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Sakyan</h1>
          <p className="text-gray-500 mt-1">Set a new password</p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={updatePasswordMutation.isPending}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
