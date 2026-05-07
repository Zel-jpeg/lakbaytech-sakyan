import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/config/axios'
import { supabase } from '@/config/supabase'

export function useConversations({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/messages/conversations/')
      return res.data
    },
    enabled,
  })
}

export function useMessages(bookingId) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', bookingId],
    queryFn: async () => {
      const res = await api.get(`/messages/${bookingId}/`)
      return res.data
    },
    enabled: !!bookingId,
  })

  // Supabase Realtime — listen for new messages on this booking
  useEffect(() => {
    if (!bookingId) return

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['messages', bookingId] })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [bookingId])

  return query
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, receiverId, content }) =>
      api.post('/messages/', {
        booking: bookingId,
        receiver: receiverId,
        content,
      }).then(r => r.data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.bookingId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// ─── Support thread (partner ↔ admin) ────────────────────────────────────────

export function useSupportMessages(partnerId = null) {
  const qc = useQueryClient()
  const queryKey = ['support-messages', partnerId]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const url = partnerId
        ? `/messages/support/?partner_id=${partnerId}`
        : '/messages/support/'
      const res = await api.get(url)
      return res.data
    },
  })

  // Supabase realtime: listen for new null-booking support messages
  useEffect(() => {
    const channel = supabase
      .channel(`support-messages:${partnerId ?? 'self'}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // We can't filter on booking_id IS NULL via Supabase realtime easily,
          // so listen to all message inserts and invalidate; the query will dedupe
          filter: `booking_id=is.null`,
        },
        () => {
          qc.invalidateQueries({ queryKey })
          qc.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [partnerId])

  return query
}

export function useSendSupportMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, receiverId }) =>
      api.post('/messages/support/', {
        content,
        ...(receiverId ? { receiver_id: receiverId } : {}),
      }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-messages'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}