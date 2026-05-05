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
    },
  })
}