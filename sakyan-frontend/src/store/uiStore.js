import { create } from 'zustand'

// Determine initial theme from localStorage or system preference
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('sakyan-theme')
    if (stored === 'dark' || stored === 'light') return stored
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch (e) { /* SSR or restricted env */ }
  return 'light'
}

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  try { localStorage.setItem('sakyan-theme', theme) } catch (e) {}
}

const initialTheme = getInitialTheme()
applyTheme(initialTheme)

export const useUIStore = create((set) => ({
  // ── Sidebar ──
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),

  // ── Modal ──
  activeModal: null,
  openModal: (modalName) => set({ activeModal: modalName }),
  closeModal: () => set({ activeModal: null }),

  // ── Theme ──
  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  setTheme: (theme) =>
    set(() => {
      applyTheme(theme)
      return { theme }
    }),
}))