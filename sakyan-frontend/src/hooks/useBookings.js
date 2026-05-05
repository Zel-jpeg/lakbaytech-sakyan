import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

export const bookingKeys = {
  all: ['bookings'],
  my: () => [...bookingKeys.all, 'my'],
  partner: () => [...bookingKeys.all, 'partner'],
  detail: (id) => [...bookingKeys.all, 'detail', id],
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.my(),
    queryFn: async () => {
      const res = await api.get('/bookings/my/')
      return res.data
    },
  })
}

export function usePartnerBookings(filters = {}) {
  const statusFilter = filters.booking_status || ''
  return useQuery({
    queryKey: [...bookingKeys.partner(), statusFilter],
    queryFn: async () => {
      const res = await api.get(`/partner/bookings/${statusFilter ? `?status=${statusFilter}` : ''}`)
      return res.data
    },
  })
}

export function useBooking(id) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/bookings/${id}/`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/bookings/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.my() })
      toast.success('Booking submitted!')
    },
    onError: (err) => toast.error(err.response?.data?.non_field_errors?.[0] || 'Booking failed.'),
  })
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      api.patch(`/bookings/${id}/${action}/`, { reason }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.partner() })
      qc.invalidateQueries({ queryKey: bookingKeys.my() })
      toast.success('Booking updated.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Action failed.'),
  })
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payment_status, payment_notes, partner_gcash_reference }) =>
      api.patch(`/partner/bookings/${id}/payment-status/`, {
        ...(payment_status           !== undefined && { payment_status }),
        ...(payment_notes            !== undefined && { payment_notes }),
        ...(partner_gcash_reference  !== undefined && { partner_gcash_reference }),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.partner() })
      toast.success('Payment status updated.')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update payment status.'),
  })
}

export function useSaveKYC() {
  return useMutation({
    mutationFn: (data) => api.post('/bookings/kyc/', data).then(r => r.data),
    onSuccess: () => toast.success('KYC info saved.'),
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save KYC.'),
  })
}

export function useUpdateRentalTimes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, actual_start_time, actual_return_time }) => {
      // Convert datetime-local string (no timezone) → proper UTC ISO string
      // new Date("2026-05-05T15:00") treats it as LOCAL time; .toISOString() gives correct UTC
      const toUTC = (v) => (v && typeof v === 'string' && !v.endsWith('Z') ? new Date(v).toISOString() : v)
      return api.patch(`/partner/bookings/${id}/rental-times/`, {
        ...(actual_start_time  !== undefined && { actual_start_time:  toUTC(actual_start_time)  }),
        ...(actual_return_time !== undefined && { actual_return_time: toUTC(actual_return_time) }),
      }).then(r => r.data)
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: bookingKeys.partner() })
      qc.invalidateQueries({ queryKey: ['conversations'] })
      if (variables.actual_start_time !== undefined) {
        toast.success('Hand-off logged! Customer has been notified. 🚗')
      } else {
        toast.success('Return time logged! Customer has been notified. ✅')
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to update rental time.'),
  })
}