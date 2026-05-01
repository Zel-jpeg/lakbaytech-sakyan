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

export function usePartnerBookings(status = '') {
  return useQuery({
    queryKey: [...bookingKeys.partner(), status],
    queryFn: async () => {
      const res = await api.get(`/partner/bookings/${status ? `?status=${status}` : ''}`)
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

export function useSaveKYC() {
  return useMutation({
    mutationFn: (data) => api.post('/bookings/kyc/', data).then(r => r.data),
    onSuccess: () => toast.success('KYC info saved.'),
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to save KYC.'),
  })
}