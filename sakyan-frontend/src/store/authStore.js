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
    }),
    { name: 'sakyan-auth', partialize: (state) => ({ user: state.user }) }
  )
)