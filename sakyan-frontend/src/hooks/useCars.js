import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import toast from 'react-hot-toast'

export const carKeys = {
  all: ['cars'],
  lists: () => [...carKeys.all, 'list'],
  list: (filters) => [...carKeys.lists(), filters],
  detail: (id) => [...carKeys.all, 'detail', id],
  myList: () => [...carKeys.all, 'my'],
}

export function useCars(filters = {}) {
  return useQuery({
    queryKey: carKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      )
      const res = await api.get(`/cars/?${params}`)
      return res.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useCar(id) {
  return useQuery({
    queryKey: carKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(`/cars/${id}/`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useMyPartnerCars() {
  return useQuery({
    queryKey: carKeys.myList(),
    queryFn: async () => {
      const res = await api.get('/partner/cars/')
      return res.data
    },
  })
}

export function useCreateCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post('/partner/cars/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
      toast.success('Car listed successfully!')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to add car'),
  })
}

export function useUpdateCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/partner/cars/${id}/`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
      qc.invalidateQueries({ queryKey: carKeys.detail(id) })
      toast.success('Car updated.')
    },
  })
}

export function useToggleCarAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.patch(`/partner/cars/${id}/toggle/`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
    },
  })
}

export function useDeleteCar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/partner/cars/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carKeys.myList() })
      toast.success('Car removed.')
    },
  })
}