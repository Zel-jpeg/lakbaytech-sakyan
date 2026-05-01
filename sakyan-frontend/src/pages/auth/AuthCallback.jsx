import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()
  const isProcessing = useRef(false)

  const handleAuth = async (session) => {
    if (isProcessing.current || !session) return
    isProcessing.current = true

    const token = session.access_token
    setToken(token)

    try {
      // Try to get existing Django profile
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
        const googleAvatar = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture
        if (googleAvatar) {
          await api.patch('/auth/profile', {
            avatar_url: googleAvatar
          })
        }

        redirectByRole(meRes.data.role)
      } catch (err) {
        console.error('Profile creation failed', err)
        navigate('/login')
      }
    }
  }

  useEffect(() => {
    // 1. Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleAuth(session)
    })

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleAuth(session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin')
    else navigate('/')
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
