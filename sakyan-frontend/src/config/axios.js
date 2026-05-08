import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sakyan_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Allow callers to opt out of the auto-redirect (e.g. AuthCallback handles its own 401s)
    const skip = error.config?._skipRedirectOn401
    if (error.response?.status === 401 && !skip) {
      localStorage.removeItem('sakyan_token')
      localStorage.removeItem('sakyan-auth')
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      } else {
        import('@/store/authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout()
        }).catch(() => {})
      }
    }
    return Promise.reject(error)
  }
)

export default api