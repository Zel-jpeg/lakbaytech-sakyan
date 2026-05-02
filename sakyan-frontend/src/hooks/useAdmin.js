import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

export const adminKeys = {
  stats:    ['admin', 'stats'],
  partners: (status) => ['admin', 'partners', status],
  bookings: (filters) => ['admin', 'bookings', filters],
  users:    (role) => ['admin', 'users', role],
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => api.get('/admin/stats/').then(r => r.data),
  })
}

export function useAdminPartners(status = 'pending') {
  return useQuery({
    queryKey: adminKeys.partners(status),
    queryFn: () => api.get(`/admin/partners/?status=${status}`).then(r => r.data),
  })
}

export function useAdminPartnerAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      api.patch(`/admin/partners/${id}/${action}/`, { reason }).then(r => r.data),
    onSuccess: (_, { action }) => {
      // Invalidate all partner status lists — tabs update immediately
      qc.invalidateQueries({ queryKey: ['admin', 'partners'] })
      qc.invalidateQueries({ queryKey: adminKeys.stats })
      toast.success(
        action === 'approve' ? 'Partner approved! They will be notified.' :
        action === 'reject'  ? 'Application rejected.' :
                               'Partner suspended.'
      )
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Action failed'),
  })
}

export function useAdminAllBookings(filters = {}) {
  return useQuery({
    queryKey: adminKeys.bookings(filters),
    queryFn: () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      )
      return api.get(`/admin/bookings/?${params}`).then(r => r.data)
    },
  })
}

export function useAdminUsers(role = '') {
  return useQuery({
    queryKey: adminKeys.users(role),
    queryFn: () => {
      const url = role ? `/admin/users/?role=${role}` : `/admin/users/`
      return api.get(url).then(r => r.data)
    },
  })
}