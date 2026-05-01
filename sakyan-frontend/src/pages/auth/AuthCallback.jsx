import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        navigate('/login')
        return
      }

      const session = data.session
      const token = session.access_token
      setToken(token)

      // Try to get existing Django profile
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
        redirectByRole(res.data.role)
      } catch {
        // Profile doesn't exist yet — create it from Google data
        const supabaseUser = session.user
        try {
          const res = await api.post('/auth/register', {
            user_id: supabaseUser.id,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
            email: supabaseUser.email,
            phone: '',
          })
          // After register, fetch the full profile
          const meRes = await api.get('/auth/me')
          setUser(meRes.data)

          // Also update avatar from Google
          if (supabaseUser.user_metadata?.avatar_url) {
            await api.patch('/auth/profile', {
              avatar_url: supabaseUser.user_metadata.avatar_url
            })
          }

          redirectByRole(meRes.data.role)
        } catch (err) {
          console.error('Profile creation failed', err)
          navigate('/login')
        }
      }
    }

    handleCallback()
  }, [])

  const redirectByRole = (role) => {
    const routes = {
      admin: '/admin',
      partner: '/dashboard',
      customer: '/cars'
    }
    navigate(routes[role] || '/cars')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
