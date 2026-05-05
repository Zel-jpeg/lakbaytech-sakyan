import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, ArrowLeft, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useConversations, useMessages, useSendMessage } from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/utils/formatters'

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * The backend conversation object has:
 *   customer_id, customer_name, partner_user_id, partner_name
 * We compute "other_user_name" and "other_user_id" from those based on who
 * the logged-in user is.
 */
function resolveOtherUser(conv, userId) {
  if (!conv || !userId) return { name: 'Unknown', id: null }
  const isCustomer = String(userId) === String(conv.customer_id)
  return {
    name: isCustomer ? (conv.partner_name || 'Partner')   : (conv.customer_name || 'Customer'),
    id:   isCustomer ? conv.partner_user_id                : conv.customer_id,
  }
}

// Last message display (backend may return { content, created_at } or just a string)
function lastMsgText(conv) {
  if (!conv.last_message) return 'No messages yet'
  if (typeof conv.last_message === 'string') return conv.last_message
  return conv.last_message.content || 'No messages yet'
}

// ─── Conversation List Item ───────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onClick, userId }) {
  const other     = resolveOtherUser(conv, userId)
  const hasUnread = conv.unread_count > 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800
                  transition hover:bg-gray-50 dark:hover:bg-gray-800/60
                  ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500' : ''}`}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
        {(other.name || '?')[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {other.name}
          </p>
          {hasUnread && (
            <span className="bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              {conv.unread_count}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          Re: {conv.car_name || conv.booking_code || 'Booking'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
          {lastMsgText(conv)}
        </p>
      </div>
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isOwn
          ? 'bg-brand-600 text-white rounded-br-sm'
          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
      }`}>
        <p>{msg.content}</p>
        <p className={`text-[10px] mt-1 ${isOwn ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'} text-right`}>
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const { user }           = useAuthStore()
  const navigate           = useNavigate()
  const [searchParams]     = useSearchParams()
  const targetBookingId    = searchParams.get('booking')

  const { data: conversations, isLoading: convsLoading } = useConversations()
  const [activeConv, setActiveConv] = useState(null)
  const [input, setInput]           = useState('')
  const [mobileView, setMobileView] = useState('list')
  const bottomRef = useRef(null)

  const convList = conversations?.results || conversations || []

  // Auto-select conversation when arriving from booking flow (?booking=id)
  useEffect(() => {
    if (!targetBookingId || !convList.length || activeConv) return
    const match = convList.find(c => String(c.booking_id) === String(targetBookingId))
    if (match) {
      setActiveConv(match)
      setMobileView('chat')
    } else {
      // Conversation exists in list but no match yet — keep polling handled by react-query
      // Just select the first conversation if any
      // (The booking's auto-message means the conversation should appear immediately)
    }
  }, [targetBookingId, convList, activeConv])

  const { data: messages, isLoading: msgsLoading } = useMessages(activeConv?.booking_id)
  const sendMessage = useSendMessage()

  const msgList = messages?.results || messages || []

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgList])

  const handleSelectConv = (conv) => {
    setActiveConv(conv)
    setMobileView('chat')
    setInput('')
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !activeConv) return
    const { id: receiverId } = resolveOtherUser(activeConv, user?.id)
    sendMessage.mutate({
      bookingId:  activeConv.booking_id,
      receiverId,
      content:    input.trim(),
    })
    setInput('')
  }

  const activeOther = activeConv ? resolveOtherUser(activeConv, user?.id) : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Messages</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{convList.length} conversation{convList.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {activeConv && mobileView === 'chat' && (
          <button onClick={() => setMobileView('list')}
            className="sm:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main layout */}
      <div className="max-w-5xl mx-auto flex h-[calc(100vh-64px)]">

        {/* ── Sidebar: conversation list ── */}
        <div className={`w-full sm:w-72 md:w-80 shrink-0 border-r border-gray-100 dark:border-gray-800
                         bg-white dark:bg-gray-900 flex flex-col overflow-hidden
                         ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>

          {/* Skeletons */}
          {convsLoading && (
            <div className="flex-1 space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!convsLoading && convList.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageSquare size={36} className="text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                Book a car to start messaging with a partner.
              </p>
            </div>
          )}

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {convList.map(conv => (
              <ConversationItem
                key={conv.booking_id}
                conv={conv}
                userId={user?.id}
                isActive={activeConv?.booking_id === conv.booking_id}
                onClick={() => handleSelectConv(conv)}
              />
            ))}
          </div>
        </div>

        {/* ── Main: chat area ── */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900
                         ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>

          {activeConv ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900">
                <button
                  className="sm:hidden p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  onClick={() => setMobileView('list')}
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {(activeOther?.name || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{activeOther?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    Re: {activeConv.car_name || activeConv.booking_code}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50 dark:bg-gray-800/20">
                {msgsLoading && (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!msgsLoading && msgList.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet. Say hello!</p>
                  </div>
                )}
                {msgList.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} isOwn={String(msg.sender) === String(user?.id)} />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sendMessage.isPending}
                  className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-700
                             text-white rounded-xl transition"
                >
                  <Send size={17} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={44} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Select a conversation</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {targetBookingId
                  ? 'Loading your conversation…'
                  : 'Choose a conversation from the left to start chatting.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
