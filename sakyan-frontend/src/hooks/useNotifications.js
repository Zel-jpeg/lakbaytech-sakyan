import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/config/axios'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'

const BANNER_KEY     = 'sakyan_approval_banner'
const DISMISSED_KEY  = 'sakyan_approval_banner_dismissed'

export function useNotifications() {
  const qc = useQueryClient()
  const { user, refreshUser } = useAuthStore()
  const toastedIds      = useRef(new Set())
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
  // When notification list loads, look for ANY unread approval notification.
  // This handles partners who were approved while offline — realtime won't
  // have fired, so on their next login we catch it here via the query result.
  //
  // Banner logic:
  //   BANNER_KEY    = '1'  → banner is visible
  //   DISMISSED_KEY = '1'  → partner already visited the dashboard; don't re-show
  useEffect(() => {
    if (checkedApproval.current) return   // only run once per session
    if (!query.data) return

    const notifications = query.data?.results || query.data || []

    // Look for an UNREAD approval notification — unread means they haven't
    // visited the dashboard and acknowledged it yet.
    const hasUnreadApproval = notifications.some(
      n => n.type === 'approval'
        && n.title?.toLowerCase().includes('approved')
        && !n.is_read                    // only unread = banner not yet seen
    )

    // Fallback: show banner if there's any approval notification at all AND
    // the partner hasn't permanently dismissed it (dashboard hasn't been visited
    // since approval).
    const hasAnyApproval = notifications.some(
      n => n.type === 'approval' && n.title?.toLowerCase().includes('approved')
    )
    const alreadyDismissed = localStorage.getItem(DISMISSED_KEY) === '1'

    if (hasAnyApproval) {
      checkedApproval.current = true
      // Always refresh user on load if they have an approval notification
      // (handles role still showing 'customer' in persisted Zustand storage)
      refreshUser()

      // Only show the banner if it hasn't been permanently dismissed
      if (!alreadyDismissed) {
        localStorage.setItem(BANNER_KEY, '1')
      }
    }
  }, [query.data])

  // ── Supabase Realtime ──────────────────────────────────────────────────────
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

          qc.invalidateQueries({ queryKey: ['notifications'] })

          if (notif?.type === 'kyc') {
            refreshUser()
          }
          if (notif?.type === 'approval' && notif?.title?.toLowerCase().includes('approved')) {
            refreshUser()
            // Clear any old dismissed flag so the new approval banner shows fresh
            localStorage.removeItem(DISMISSED_KEY)
            localStorage.setItem(BANNER_KEY, '1')
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
  }, [user?.id])

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