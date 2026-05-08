import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/config/axios'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/store/authStore'

const BANNER_KEY    = 'sakyan_approval_banner'
const DISMISSED_KEY = 'sakyan_approval_banner_dismissed'

export function useNotifications() {
  const qc = useQueryClient()
  const { user, refreshUser } = useAuthStore()
  const toastedIds       = useRef(new Set())
  const checkedApproval  = useRef(false)
  // Track the previous role so we detect the exact moment it changes to 'partner'
  const prevRoleRef      = useRef(null)

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/')
      return res.data
    },
    enabled: !!user,
  })

  // ── 1. Role-change detector ────────────────────────────────────────────────
  // Watches user.role. The instant it flips from anything → 'partner'
  // (regardless of HOW it got there: polling, realtime, page load), we:
  //   • Set the persistent banner flag
  //   • Show the congratulatory toast
  // This is the single source of truth for "just got approved" behaviour.
  useEffect(() => {
    const prev    = prevRoleRef.current
    const current = user?.role ?? null
    prevRoleRef.current = current

    // Skip on initial mount (prev is null)
    if (prev === null) return

    if (prev !== 'partner' && current === 'partner') {
      // Role just upgraded live — show banner unless already permanently dismissed
      const dismissed = localStorage.getItem(DISMISSED_KEY) === '1'
      if (!dismissed) {
        localStorage.removeItem(DISMISSED_KEY)   // clear any stale dismiss
        localStorage.setItem(BANNER_KEY, '1')
      }

      // Toast — only show once per session via toastedIds
      const toastId = 'partner-approval'
      if (!toastedIds.current.has(toastId)) {
        toastedIds.current.add(toastId)
        toast.success(
          '🎉 Congratulations! You are now an approved Sakyan Partner!',
          { duration: 8000, id: toastId }
        )
      }
    }
  }, [user?.role])

  // ── 2. Poll /auth/me while application is pending ─────────────────────────
  // Every 15 s, re-fetch the user profile. The moment the admin approves,
  // the next poll returns role='partner' → Zustand updates → detector above fires.
  // This guarantees a maximum 15-second lag with NO Supabase realtime dependency.
  useEffect(() => {
    if (!user) return
    if (user.role === 'partner') return         // already approved, stop polling
    if (user.partner_status !== 'pending') return // only poll while pending

    const interval = setInterval(() => {
      refreshUser()
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [user?.id, user?.role, user?.partner_status])

  // ── 3. Startup check (page-reload scenario) ───────────────────────────────
  // On fresh load, if notifications list already contains an approval notification
  // and the banner hasn't been permanently dismissed, show the banner.
  // Also calls refreshUser() to fix any stale persisted role.
  useEffect(() => {
    if (checkedApproval.current) return
    if (!query.data) return

    const notifications  = query.data?.results || query.data || []
    const hasAnyApproval = notifications.some(
      n => n.type === 'approval' && n.title?.toLowerCase().includes('approved')
    )
    const alreadyDismissed = localStorage.getItem(DISMISSED_KEY) === '1'

    if (hasAnyApproval) {
      checkedApproval.current = true
      refreshUser()  // fix stale persisted role

      if (!alreadyDismissed) {
        localStorage.setItem(BANNER_KEY, '1')
      }
    }
  }, [query.data])

  // ── 4. Supabase Realtime — notifications INSERT ───────────────────────────
  // Belt-and-suspenders: if realtime fires before the next poll cycle,
  // call refreshUser() immediately so the role update is instant.
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

          // For approval: just call refreshUser(). The role-change detector
          // (effect #1 above) will handle showing the banner + toast automatically.
          if (
            notif?.type === 'approval' &&
            notif?.title?.toLowerCase().includes('approved')
          ) {
            // Clear dismissed flag so re-approval always shows fresh banner
            localStorage.removeItem(DISMISSED_KEY)
            refreshUser()
          }

          // Toast for non-approval notifications
          if (notif?.id && !toastedIds.current.has(notif.id)) {
            toastedIds.current.add(notif.id)
            const isKYCApproval = notif?.type === 'kyc' && notif?.title?.includes('Verified')
            const isApproval    = notif?.type === 'approval' && notif?.title?.toLowerCase().includes('approved')

            if (isApproval) {
              // Will be handled by role-change detector — skip duplicate toast here
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