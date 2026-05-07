import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()
  const isProcessing = useRef(false)

  /**
   * Make an API call using the token directly in headers,
   * bypassing the localStorage timing issue and the 401 interceptor redirect.
   */
  const apiWithToken = (token) => ({
    get: (url) => api.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      _skipRedirectOn401: true,
    }),
    post: (url, data) => api.post(url, data, {
      headers: { Authorization: `Bearer ${token}` },
      _skipRedirectOn401: true,
    }),
    patch: (url, data) => api.patch(url, data, {
      headers: { Authorization: `Bearer ${token}` },
      _skipRedirectOn401: true,
    }),
  })

  const handleAuth = async (session) => {
    if (isProcessing.current || !session) return
    isProcessing.current = true

    const token = session.access_token
    // Store the token immediately so axios interceptor picks it up
    setToken(token)
    localStorage.setItem('sakyan_token', token)

    const authedApi = apiWithToken(token)

    try {
      // Try to get existing Django profile
      const res = await authedApi.get('/auth/me')
      setUser(res.data)
      redirectByRole(res.data.role)
    } catch (meErr) {
      // If it's a 401/404, profile doesn't exist yet — create it from Google data
      const status = meErr?.response?.status
      if (status === 401 || status === 404) {
        const supabaseUser = session.user
        try {
          await authedApi.post('/auth/register', {
            user_id: supabaseUser.id,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email,
            email: supabaseUser.email,
            phone: '',
          })
          // After register, fetch the full profile
          const meRes = await authedApi.get('/auth/me')
          setUser(meRes.data)

          // Also update avatar from Google
          const googleAvatar = supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture
          if (googleAvatar) {
            await authedApi.patch('/auth/profile', { avatar_url: googleAvatar })
          }

          redirectByRole(meRes.data.role)
        } catch (err) {
          console.error('Profile creation failed', err)
          isProcessing.current = false
          navigate('/login')
        }
      } else {
        // Network or unexpected error — let them try again
        console.error('Auth error', meErr)
        isProcessing.current = false
        navigate('/login')
      }
    }
  }

  useEffect(() => {
    // Reset on each mount so React StrictMode double-invoke doesn't block the second run
    isProcessing.current = false

    // First, try getSession() — after the OAuth redirect, Supabase has already
    // parsed the URL hash by the time React renders this component.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isProcessing.current) {
        handleAuth(session)
        return
      }

      // Fallback: if getSession() returned null, wait for the SIGNED_IN event.
      // This handles edge cases where the hash hasn't been parsed yet.
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
            handleAuth(session)
          }
        }
      )

      // Safety timeout — if nothing happens in 10s, redirect to login
      const timeout = setTimeout(() => {
        if (!isProcessing.current) {
          console.warn('Auth callback timed out')
          navigate('/login')
        }
      }, 10000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    })
  }, [])

  const redirectByRole = (role) => {
    if (role === 'admin') navigate('/admin')
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}
