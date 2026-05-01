import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useConversations } from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import ConversationList from '@/components/messaging/ConversationList'
import ChatWindow from '@/components/messaging/ChatWindow'
import { MessageSquare, ArrowLeft } from 'lucide-react'

export default function InboxPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [selectedConvo, setSelectedConvo] = useState(null)

  const { data, isLoading } = useConversations()
  const conversations = data?.results || data || []

  // Support deep-linking: /inbox?booking=<bookingId>
  // e.g. "Message Partner" button on MyBookingsPage links here
  useEffect(() => {
    const bookingId = searchParams.get('booking')
    if (bookingId && conversations.length > 0) {
      const match = conversations.find(c => c.booking_id === bookingId)
      if (match) setSelectedConvo(match)
    }
  }, [searchParams, conversations])

  const handleSelect = (convo) => {
    setSelectedConvo(convo)
  }

  const handleBack = () => {
    setSelectedConvo(null)
  }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── Left panel: conversation list ── */}
      <div className={`
        w-full sm:w-80 lg:w-96 flex flex-col bg-white border-r border-gray-100 shrink-0
        ${selectedConvo ? 'hidden sm:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Inbox</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ConversationList
          conversations={conversations}
          selectedId={selectedConvo?.booking_id}
          onSelect={handleSelect}
          isLoading={isLoading}
        />
      </div>

      {/* ── Right panel: chat window ── */}
      <div className={`
        flex-1 flex flex-col min-w-0
        ${selectedConvo ? 'flex' : 'hidden sm:flex'}
      `}>
        {selectedConvo ? (
          <>
            {/* Mobile back button */}
            <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user?.role === 'partner'
                    ? selectedConvo.customer_name
                    : selectedConvo.partner_name}
                </p>
                <p className="text-xs text-gray-400">{selectedConvo.car_name}</p>
              </div>
            </div>

            <ChatWindow booking={selectedConvo} />
          </>
        ) : (
          // Empty state on desktop when nothing is selected
          <div className="hidden sm:flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare size={28} className="text-blue-400" />
            </div>
            <p className="font-semibold text-gray-700">Select a conversation</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Choose a conversation from the left to start messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}