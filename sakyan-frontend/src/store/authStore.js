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
      // Re-fetch /api/auth/me and update stored user without logout/login.
      // Uses the same axios instance as all other API calls so auth headers
      // and error handling are consistent.
      refreshUser: async () => {
        try {
          // Lazy import to avoid circular dep (api imports from authStore indirectly)
          const { default: api } = await import('@/config/axios')
          const res = await api.get('/auth/me', { _skipRedirectOn401: true })
          if (res.status === 200) {
            set({ user: res.data })
          }
        } catch { /* silent fail — token expired or network error */ }
      },
    }),
    { name: 'sakyan-auth', partialize: (state) => ({ user: state.user }) }
  )
)