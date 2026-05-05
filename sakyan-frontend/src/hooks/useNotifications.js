import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/config/axios'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'

export function useNotifications() {
  const qc = useQueryClient()
  const { user, refreshUser } = useAuthStore()
  // Track notifications we've already toasted so we don't re-toast on re-render
  const toastedIds = useRef(new Set())

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/')
      return res.data
    },
    enabled: !!user,
  })

  // Supabase Realtime — listen for new notifications for this user
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notif = payload.new

          // Refresh the notifications list in the bell
          qc.invalidateQueries({ queryKey: ['notifications'] })

          // If this is a KYC notification, also refresh the user profile
          // so kyc_status updates immediately without logout
          if (notif?.type === 'kyc') {
            refreshUser()
          }

          // Show a toast for any incoming notification (avoid duplicates)
          if (notif?.id && !toastedIds.current.has(notif.id)) {
            toastedIds.current.add(notif.id)
            const isKYCApproval = notif?.type === 'kyc' && notif?.title?.includes('Verified')
            if (isKYCApproval) {
              toast.success('🎉 Identity verified! You can now book cars.', {
                duration: 6000,
                icon: '✅',
              })
            } else if (notif?.title) {
              toast(notif.title, { icon: '🔔', duration: 4000 })
            }
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  return query
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      id
        ? api.patch(`/notifications/${id}/read/`)
        : api.patch('/notifications/read-all/'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  if (!data?.results) return 0
  return data.results.filter(n => !n.is_read).length
}