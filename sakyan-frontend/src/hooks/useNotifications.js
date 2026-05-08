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
  const toastedIds   = useRef(new Set())
  // Track if we already acted on existing approval notifs this session
  const checkedApproval = useRef(false)

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/')
      return res.data
    },
    enabled: !!user,
  })

  // ── Startup check ──────────────────────────────────────────────────────────
  // When notification list loads, check for ANY unread approval notification.
  // This handles the case where the admin approved while the user was offline
  // (realtime wouldn't have fired), so on the next page load we catch it here.
  useEffect(() => {
    if (checkedApproval.current) return
    if (!query.data) return

    const notifications = query.data?.results || query.data || []
    const hasApproval = notifications.some(
      n => n.type === 'approval' && n.title?.toLowerCase().includes('approved')
    )

    if (hasApproval) {
      checkedApproval.current = true
      // Refresh the user profile so the stored role becomes 'partner'
      refreshUser()
      // Set the banner flag so the green banner appears
      if (user?.role !== 'partner') {
        localStorage.setItem('sakyan_approval_banner', '1')
      }
    }
  }, [query.data])  // runs every time notifications data changes

  // ── Supabase Realtime ──────────────────────────────────────────────────────
  // Listen for NEW notification inserts in real time so the role updates
  // immediately when the admin approves while the partner is online.
  useEffect(() => {
    if (!user) return

    const channelName = `notifications:${user.id}:${Date.now()}`

    const channel = supabase
      .channel(channelName)
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

          // If this is a KYC or approval notification, refresh the user profile
          // so role/kyc_status updates immediately without logout
          if (notif?.type === 'kyc') {
            refreshUser()
          }
          if (notif?.type === 'approval' && notif?.title?.toLowerCase().includes('approved')) {
            refreshUser()
            // Set persistent banner flag — cleared when partner visits dashboard
            localStorage.setItem('sakyan_approval_banner', '1')
          }

          if (notif?.id && !toastedIds.current.has(notif.id)) {
            toastedIds.current.add(notif.id)
            const isKYCApproval     = notif?.type === 'kyc' && notif?.title?.includes('Verified')
            const isPartnerApproval = notif?.type === 'approval' && notif?.title?.toLowerCase().includes('approved')
            if (isPartnerApproval) {
              toast.success('🎉 Congratulations! You are now an approved Sakyan Partner!', {
                duration: 8000,
              })
            } else if (isKYCApproval) {
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

    return () => { supabase.removeChannel(channel) }
  }, [user?.id]) // depend on user.id not user object to avoid extra re-runs

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