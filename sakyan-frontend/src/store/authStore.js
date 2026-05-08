import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        localStorage.setItem('sakyan_token', token)
        set({ token })
      },
      logout: () => {
        localStorage.removeItem('sakyan_token')
        set({ user: null, token: null })
      },
      // Re-fetch /api/auth/me and update stored user without logout/login
      refreshUser: async () => {
        try {
          const token = localStorage.getItem('sakyan_token')
          if (!token) return
          const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '')
          const res = await fetch(`${apiUrl}/auth/me`, {

            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            set({ user: data })
          }
        } catch { /* silent fail */ }
      },
    }),
    { name: 'sakyan-auth', partialize: (state) => ({ user: state.user }) }
  )
)