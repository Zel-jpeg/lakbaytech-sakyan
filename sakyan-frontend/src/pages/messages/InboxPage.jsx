import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, ArrowLeft } from 'lucide-react'
import { useConversations, useMessages, useSendMessage } from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/formatters'

function ConversationItem({ conv, isActive, onClick }) {
  const hasUnread = conv.unread_count > 0
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-100
                  transition hover:bg-gray-50 ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 font-bold text-sm">
        {(conv.other_user_name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
            {conv.other_user_name || 'Unknown'}
          </p>
          {hasUnread && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              {conv.unread_count}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          Re: {conv.car_name || conv.booking_code || 'Booking'}
        </p>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {conv.last_message || 'No messages yet'}
        </p>
      </div>
    </button>
  )
}

function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isOwn
          ? 'bg-blue-600 text-white rounded-br-sm'
          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
      }`}>
        <p>{msg.content}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'} text-right`}>
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
    </div>
  )
}

export default function InboxPage() {
  const { user } = useAuthStore()
  const { data: conversations, isLoading: convsLoading } = useConversations()
  const [activeConv, setActiveConv] = useState(null)
  const [input, setInput] = useState('')
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat'
  const bottomRef = useRef(null)

  const convList = conversations?.results || conversations || []

  const { data: messages, isLoading: msgsLoading } = useMessages(activeConv?.booking_id)
  const sendMessage = useSendMessage()

  const msgList = messages?.results || messages || []

  // Auto-scroll to bottom when messages load or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgList])

  const handleSelectConv = (conv) => {
    setActiveConv(conv)
    setMobileView('chat')
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !activeConv) return
    sendMessage.mutate({
      bookingId: activeConv.booking_id,
      receiverId: activeConv.other_user_id,
      content: input.trim(),
    })
    setInput('')
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">

      {/* ── Sidebar: Conversation list ── */}
      <div className={`w-full sm:w-72 md:w-80 shrink-0 border-r border-gray-100 flex flex-col
                        ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Inbox</h1>
          <p className="text-xs text-gray-400 mt-0.5">{convList.length} conversation{convList.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convsLoading && (
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-100 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!convsLoading && convList.length === 0 && (
            <div className="py-16 text-center px-6">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Messages from bookings will appear here.</p>
            </div>
          )}

          {convList.map((conv) => (
            <ConversationItem
              key={conv.booking_id}
              conv={conv}
              isActive={activeConv?.booking_id === conv.booking_id}
              onClick={() => handleSelectConv(conv)}
            />
          ))}
        </div>
      </div>

      {/* ── Main: Chat area ── */}
      <div className={`flex-1 flex flex-col min-w-0
                        ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>

        {activeConv ? (
          <>
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <button
                className="sm:hidden p-1.5 text-gray-500 hover:text-gray-800"
                onClick={() => setMobileView('list')}
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm shrink-0">
                {(activeConv.other_user_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{activeConv.other_user_name}</p>
                <p className="text-xs text-gray-400 truncate">Re: {activeConv.car_name || activeConv.booking_code}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/40">
              {msgsLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!msgsLoading && msgList.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                </div>
              )}

              {msgList.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender === user?.id} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || sendMessage.isPending}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200
                           text-white rounded-xl transition"
              >
                <Send size={17} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare size={40} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Select a conversation</p>
            <p className="text-gray-400 text-sm mt-1">Choose a conversation from the left to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
