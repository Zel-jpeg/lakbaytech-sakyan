import { useQuery } from '@tanstack/react-query'
import api from '@/config/axios'

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await api.get('/public/stats/')
      return res.data
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  })
}
