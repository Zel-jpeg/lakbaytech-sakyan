import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

// Module-level flag — survives React StrictMode double-mount
let authInProgress = false

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin')
    else navigate('/')
  }

  const handleAuth = async (session) => {
    if (authInProgress || !session) return
    authInProgress = true

    setToken(session.access_token)
    const supabaseUser = session.user

    const avatar =
      supabaseUser.user_metadata?.avatar_url ||
      supabaseUser.user_metadata?.picture

    try {
      // Existing user — patch avatar first so navbar gets it, then fetch profile
      if (avatar) {
        await api.patch('/auth/profile', { avatar_url: avatar }).catch(() => {})
      }
      const res = await api.get('/auth/me')
      setUser(res.data)
      redirectByRole(res.data.role)
    } catch {
      // New user — create Django profile first
      try {
        await api.post('/auth/register', {
          user_id:   supabaseUser.id,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
          email:     supabaseUser.email,
          phone:     '',
        })
      } catch (registerErr) {
        // 409 = already exists (race condition), safe to continue
        if (registerErr.response?.status !== 409) {
          console.error('Registration failed', registerErr)
          authInProgress = false
          navigate('/login')
          return
        }
      }

      try {
        // Patch avatar before fetching profile so setUser gets it
        if (avatar) {
          await api.patch('/auth/profile', { avatar_url: avatar }).catch(() => {})
        }

        const meRes = await api.get('/auth/me')
        setUser(meRes.data)
        redirectByRole(meRes.data.role)
      } catch (err) {
        console.error('Profile fetch failed', err)
        authInProgress = false
        navigate('/login')
      }
    }
  }

  useEffect(() => {
    // Reset on every fresh mount so navigating back to /auth/callback works
    authInProgress = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          await handleAuth(session)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}