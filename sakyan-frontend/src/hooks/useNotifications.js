import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/config/axios'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'

const BANNER_KEY    = 'sakyan_approval_banner'
const DISMISSED_KEY = 'sakyan_approval_banner_dismissed'

// ─── refreshUser via api (same axios instance everything else uses) ─────────
async function fetchMe() {
  try {
    const res = await api.get('/auth/me')
    return res.data
  } catch {
    return null
  }
}

export function useNotifications() {
  const qc = useQueryClient()
  const { user, setUser } = useAuthStore()
  const toastedIds   = useRef(new Set())
  const prevRoleRef  = useRef(null)   // track last known role

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications/').then(r => r.data),
    enabled:  !!user,
  })

  // ── LAYER 1: Role-change detector ──────────────────────────────────────────
  // The ONLY place where banner + toast fire. Anything that causes user.role
  // to change to 'partner' (polling, realtime, page load) gets caught here.
  useEffect(() => {
    const prev    = prevRoleRef.current
    const current = user?.role ?? null
    prevRoleRef.current = current

    if (prev === null) return   // skip first render — just initialise the ref

    if (prev !== 'partner' && current === 'partner') {
      const dismissed = localStorage.getItem(DISMISSED_KEY) === '1'
      if (!dismissed) {
        localStorage.removeItem(DISMISSED_KEY)
        localStorage.setItem(BANNER_KEY, '1')
      }
      // Show toast once per session
      if (!toastedIds.current.has('partner-approval')) {
        toastedIds.current.add('partner-approval')
        toast.success('🎉 Congratulations! You are now an approved Sakyan Partner!', {
          duration: 8000,
          id: 'partner-approval',
        })
      }
    }
  }, [user?.role])

  // ── LAYER 2: Polling every 10 s for ANY customer ───────────────────────────
  // Polls /auth/me and calls setUser() with the fresh data.
  // Works even if Supabase realtime is broken or the user was offline.
  // Stops automatically the moment user.role becomes 'partner'.
  // We poll for ALL customers (not just pending) because partner_status may be
  // undefined in an older persisted Zustand cache — we can't rely on it.
  useEffect(() => {
    if (!user) return
    if (user.role === 'partner' || user.role === 'admin') return  // no need

    const interval = setInterval(async () => {
      const fresh = await fetchMe()
      if (fresh) setUser(fresh)        // updates Zustand → triggers detector above
    }, 10000)  // every 10 seconds

    return () => clearInterval(interval)
  }, [user?.id, user?.role])

  // ── LAYER 3: Startup check (page-reload catch-all) ─────────────────────────
  // If the user reloads while already a partner + has unread approval notif,
  // ensure the banner flag is set (in case it was cleared by a previous bug).
  useEffect(() => {
    if (!query.data || !user) return
    const notifications  = query.data?.results || query.data || []
    const hasApproval    = notifications.some(
      n => n.type === 'approval' && n.title?.toLowerCase().includes('approved')
    )
    const alreadyDismissed = localStorage.getItem(DISMISSED_KEY) === '1'

    if (hasApproval && user.role === 'partner' && !alreadyDismissed) {
      localStorage.setItem(BANNER_KEY, '1')
    }
  }, [query.data, user?.role])

  // ── LAYER 4: Supabase Realtime (instant when it works) ─────────────────────
  // Belt-and-suspenders. If the INSERT fires, refresh user immediately.
  // Role-change detector handles banner + toast from there.
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}:${Date.now()}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const notif = payload.new
        qc.invalidateQueries({ queryKey: ['notifications'] })

        // For approval: just refresh user — detector handles everything else
        if (
          notif?.type === 'approval' &&
          notif?.title?.toLowerCase().includes('approved')
        ) {
          localStorage.removeItem(DISMISSED_KEY)  // clear stale dismiss
          const fresh = await fetchMe()
          if (fresh) setUser(fresh)
        }

        if (notif?.type === 'kyc') {
          const fresh = await fetchMe()
          if (fresh) setUser(fresh)
        }

        // Toast for non-approval notifications
        if (notif?.id && !toastedIds.current.has(notif.id)) {
          toastedIds.current.add(notif.id)
          const isApproval = notif?.type === 'approval' && notif?.title?.toLowerCase().includes('approved')
          const isKYC      = notif?.type === 'kyc' && notif?.title?.includes('Verified')
          const isBooking  = notif?.type === 'booking'

          if (isApproval) {
            // Handled by role-change detector — skip to avoid duplicate toast
          } else if (isKYC) {
            toast.success('🎉 Identity verified! You can now book cars.', { duration: 6000, icon: '✅' })
          } else if (isBooking) {
            // Invalidate bookings query so the badge + list update instantly
            qc.invalidateQueries({ queryKey: ['bookings', 'my'] })  // = bookingKeys.my()
            const title = notif?.title || ''
            const icon  = title.includes('Approved') ? '🎉'
                        : title.includes('Not Approved') || title.includes('rejected') ? '❌'
                        : title.includes('Completed') ? '✅'
                        : title.includes('Handed Over') ? '🚗'
                        : '📋'
            toast(title, { icon, duration: 5000 })
          } else if (notif?.title) {
            toast(notif.title, { icon: '🔔', duration: 4000 })
          }
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  return query
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) =>
      id ? api.patch(`/notifications/${id}/read/`) : api.patch('/notifications/read-all/'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useUnreadCount() {
  const { data } = useNotifications()
  if (!data?.results) return 0
  return data.results.filter(n => !n.is_read).length
}