import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/config/supabase'
import api from '@/config/axios'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { user, setUser, setToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: async (data) => {
      const token = data.session.access_token
      setToken(token)
      const res = await api.get('/auth/me')
      setUser(res.data)
      toast.success(`Welcome back, ${res.data.full_name}!`)
      redirectByRole(res.data.role)
    },
    onError: (err) => toast.error(err.message)
  })

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, full_name, phone }) => {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      await api.post('/auth/register', {
        user_id: data.user.id,
        full_name,
        email,
        phone
      })
      return data
    },
    onSuccess: () => {
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    },
    onError: (err) => toast.error(err.message)
  })

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) toast.error(error.message)
  }

  const logoutAction = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/')
    toast.success('Logged out.')
  }

  const redirectByRole = (role) => {
    const routes = {
      admin: '/admin',
      partner: '/dashboard',
      customer: '/cars'
    }
    navigate(routes[role] || '/cars')
  }

  return { user, loginMutation, registerMutation, loginWithGoogle, logoutAction }
}