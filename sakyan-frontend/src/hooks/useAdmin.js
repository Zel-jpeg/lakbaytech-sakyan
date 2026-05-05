import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

export const adminKeys = {
  stats:       ['admin', 'stats'],
  partners:    (status) => ['admin', 'partners', status],
  bookings:    (filters) => ['admin', 'bookings', filters],
  users:       (role) => ['admin', 'users', role],
  kyc:         (status) => ['admin', 'kyc', status],
  settlements: (filters) => ['admin', 'settlements', filters],
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
    mutationFn: ({ id, action, reason, commission_rate }) =>
      api.patch(`/admin/partners/${id}/${action}/`, { reason, commission_rate }).then(r => r.data),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'partners'] })
      qc.invalidateQueries({ queryKey: adminKeys.stats })
      toast.success(
        action === 'approve'           ? 'Partner approved! They will be notified.' :
        action === 'reject'            ? 'Application rejected.' :
        action === 'update-commission' ? 'Commission rate updated.' :
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

// ── Admin KYC ─────────────────────────────────────────────────────────────────

export function useAdminKYC(status = 'pending') {
  return useQuery({
    queryKey: adminKeys.kyc(status),
    queryFn: () => api.get(`/admin/kyc/?status=${status}`).then(r => r.data),
  })
}

export function useAdminKYCAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      api.patch(`/admin/kyc/${id}/${action}/`, { reason }).then(r => r.data),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'kyc'] })
      qc.invalidateQueries({ queryKey: adminKeys.stats })
      toast.success(
        action === 'approve'
          ? 'Customer verified! They will be notified.'
          : 'KYC rejected. Customer will be notified.'
      )
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Action failed'),
  })
}

// ── Customer KYC ──────────────────────────────────────────────────────────────

export function useKYCProfile() {
  return useQuery({
    queryKey: ['customer', 'kyc'],
    queryFn: () => api.get('/customer/kyc/').then(r => r.data),
    retry: false,
  })
}

export function useSubmitKYC() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/customer/kyc/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'kyc'] })
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Submission failed'),
  })
}

// ── Admin Settings ─────────────────────────────────────────────────────────────

export function useAdminUpdateSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }) =>
      api.patch(`/admin/settings/${key}/`, { value }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] })
      toast.success('Setting updated.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Update failed.'),
  })
}

// ── Refund Queue ───────────────────────────────────────────────────────────────

export function useAdminRefunds(status = 'pending') {
  return useQuery({
    queryKey: ['admin', 'refunds', status],
    queryFn: () => api.get(`/admin/refunds/?status=${status}`).then(r => r.data),
  })
}

export function useAdminProcessRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }) =>
      api.patch(`/admin/refunds/${id}/`, { status: action }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'refunds'] })
      toast.success('Refund status updated.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update refund.'),
  })
}

export function useAdminVerifyBookingFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }) =>
      api.patch(`/admin/bookings/${id}/verify-fee/`, {}).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      toast.success('Booking fee verified — booking forwarded to partner.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Verification failed.'),
  })
}

// ── Settlements ────────────────────────────────────────────────────────────────

export function useAdminSettlements(filters = {}) {
  return useQuery({
    queryKey: adminKeys.settlements(filters),
    queryFn: () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      )
      return api.get(`/admin/settlements/list/?${params}`).then(r => r.data)
    },
  })
}

export function useAdminCreateSettlement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/admin/settlements/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settlements'] })
      toast.success('Settlement generated!')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate settlement.'),
  })
}

export function useAdminMarkSettled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount_received, notes }) =>
      api.patch(`/admin/settlements/${id}/settle/`, { amount_received, notes }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settlements'] })
      toast.success('Settlement marked as settled! ✅')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to mark as settled.'),
  })
}