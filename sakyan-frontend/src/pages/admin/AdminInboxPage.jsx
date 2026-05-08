import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, Search, ArrowLeft, Car, Clock, ShieldCheck, Users } from 'lucide-react'
import {
  useConversations,
  useMessages,
  useSendMessage,
  useSupportMessages,
  useSendSupportMessage,
} from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'

// ─── helpers ──────────────────────────────────────────────────────────────────

const SUPPORT_PREFIX = 'support'

function isSupportConv(conv) {
  if (!conv) return false
  return conv.is_support === true
    || conv.booking_id === SUPPORT_PREFIX
    || String(conv.booking_id || '').startsWith('support:')
}

function resolveDisplayName(conv, userId) {
  if (!conv) return { label: 'Unknown', sub: '' }
  if (isSupportConv(conv)) {
    // Admin sees the partner/customer's name
    return {
      label: conv.customer_name || 'Partner/Customer',
      sub:   'Support Thread',
    }
  }
  return {
    label: conv.partner_name || conv.customer_name || 'Unknown',
    sub:   conv.car_name || conv.booking_code || 'Booking',
  }
}

function lastMsgText(conv) {
  if (!conv.last_message) return 'No messages yet'
  if (typeof conv.last_message === 'string') return conv.last_message
  return conv.last_message.content || 'No messages yet'
}

function lastMsgTime(conv) {
  const t = conv.last_message?.created_at
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function initials(name = '') {
  return (name || '?')[0].toUpperCase()
}

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConvItem({ conv, isActive, onClick, userId }) {
  const isSupport = isSupportConv(conv)
  const { label, sub } = resolveDisplayName(conv, userId)
  const hasUnread = conv.unread_count > 0
  const preview   = lastMsgText(conv)
  const time      = lastMsgTime(conv)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-50 dark:border-gray-800/60
                  transition-all hover:bg-gray-50 dark:hover:bg-gray-800/60
                  ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500' : ''}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {isSupport ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600
                          flex items-center justify-center text-white">
            <ShieldCheck size={18} />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                          flex items-center justify-center text-white font-bold text-sm">
            {initials(label)}
          </div>
        )}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px]
                           font-bold rounded-full flex items-center justify-center animate-pulse">
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {label}
            {isSupport && (
              <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                Support
              </span>
            )}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{time}</span>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
          {isSupport
            ? <><ShieldCheck size={9} className="shrink-0" /> {sub}</>
            : <><Car size={9} className="shrink-0" /> {sub}</>
          }
        </p>
        <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
          {preview}
        </p>
      </div>
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isOwn }) {
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''
  const lines = (msg.content || '').split('\n')

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm leading-relaxed ${
        isOwn
          ? 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-br-sm'
          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
      }`}>
        {lines.map((line, i) => (
          <p key={i} className="text-sm">{line || <br />}</p>
        ))}
        <p className={`text-[10px] mt-1.5 text-right ${isOwn ? 'text-violet-200' : 'text-gray-400 dark:text-gray-500'}`}>
          {time}
        </p>
      </div>
    </div>
  )
}

// ─── Date Separator ───────────────────────────────────────────────────────────

function DateSep({ date }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-2 py-0.5
                       bg-gray-100 dark:bg-gray-800 rounded-full whitespace-nowrap">
        {new Date(date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminInboxPage() {
  const { user }        = useAuthStore()
  const [searchParams]  = useSearchParams()
  const targetBookingId = searchParams.get('booking')
  const targetSupport   = searchParams.get('support') === '1'

  const { data: conversations, isLoading: convsLoading } = useConversations()
  const [activeConv, setActiveConv] = useState(null)
  const [input, setInput]           = useState('')
  const [mobileView, setMobileView] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const convList      = conversations?.results || conversations || []
  const filteredConvs = searchQuery.trim()
    ? convList.filter(c => {
        const { label, sub } = resolveDisplayName(c, user?.id)
        const q = searchQuery.toLowerCase()
        return label.toLowerCase().includes(q) || sub.toLowerCase().includes(q)
      })
    : convList

  // ---------- derived from activeConv ----------
  const isSupport = isSupportConv(activeConv)

  // For admin replying: extract partner_id from support conv
  const supportPartnerId = isSupport && activeConv
    ? (activeConv.support_partner_id || activeConv.customer_id || null)
    : null

  // Auto-select from URL params
  useEffect(() => {
    if (!convList.length) return
    if (targetSupport && !activeConv) {
      const supportConv = convList.find(c => isSupportConv(c))
      if (supportConv) { setActiveConv(supportConv); setMobileView('chat') }
      return
    }
    if (targetBookingId && !activeConv) {
      const match = convList.find(c => String(c.booking_id) === String(targetBookingId))
      if (match) { setActiveConv(match); setMobileView('chat') }
    }
  }, [targetBookingId, targetSupport, convList, activeConv])

  // ── Booking messages ───────────────────────────────────────────────────────
  const { data: bookingMessages, isLoading: bookingMsgsLoading } = useMessages(
    !isSupport && activeConv ? activeConv.booking_id : null
  )

  // ── Support messages ───────────────────────────────────────────────────────
  const { data: supportMessages, isLoading: supportMsgsLoading } = useSupportMessages(
    isSupport ? supportPartnerId : undefined
  )

  const sendBookingMsg = useSendMessage()
  const sendSupportMsg = useSendSupportMessage()

  const msgList     = isSupport
    ? (supportMessages || [])
    : (bookingMessages?.results || bookingMessages || [])
  const msgsLoading = isSupport ? supportMsgsLoading : bookingMsgsLoading

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgList])

  const handleSelect = (conv) => {
    setActiveConv(conv)
    setMobileView('chat')
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !activeConv) return

    if (isSupport) {
      // Admin replies to the specific partner in this support thread
      if (!supportPartnerId) return
      sendSupportMsg.mutate({ content: input.trim(), receiverId: supportPartnerId })
    } else {
      // Admin sends in a booking conversation — target the customer
      const receiverId = activeConv.customer_id
      sendBookingMsg.mutate({
        bookingId: activeConv.booking_id,
        receiverId,
        content:   input.trim(),
      })
    }
    setInput('')
  }

  const isMsgPending   = isSupport ? sendSupportMsg.isPending : sendBookingMsg.isPending
  const { label: activeLabel, sub: activeSub } = activeConv
    ? resolveDisplayName(activeConv, user?.id)
    : { label: '', sub: '' }

  // Render messages with date separators
  const renderMessages = () => {
    if (msgsLoading) {
      return (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    if (msgList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
          {isSupport ? (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                <ShieldCheck size={26} className="text-emerald-400" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No messages yet in this support thread</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">When the partner sends a message, it will appear here.</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <MessageSquare size={24} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No messages in this booking yet.</p>
            </>
          )}
        </div>
      )
    }

    const items = []
    let lastDate = null
    msgList.forEach((msg) => {
      const dateStr = msg.created_at ? new Date(msg.created_at).toDateString() : null
      if (dateStr && dateStr !== lastDate) {
        items.push(<DateSep key={`sep-${msg.id}`} date={msg.created_at} />)
        lastDate = dateStr
      }
      items.push(<Bubble key={msg.id} msg={msg} isOwn={String(msg.sender) === String(user?.id)} />)
    })
    return items
  }

  // Counts for the sidebar header
  const supportCount  = convList.filter(c => isSupportConv(c)).length
  const bookingCount  = convList.filter(c => !isSupportConv(c)).length
  const totalUnread   = convList.reduce((s, c) => s + (c.unread_count || 0), 0)

  return (
    <div className="flex -m-4 lg:-m-6 h-[calc(100vh-73px)] overflow-hidden rounded-none lg:rounded-2xl
                    border-0 lg:border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

      {/* ══ Sidebar ══════════════════════════════════════════════════════════ */}
      <div className={`w-full sm:w-80 xl:w-96 shrink-0 flex flex-col
                       border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900
                       ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-900 dark:text-white text-base">Messages</h2>
            {totalUnread > 0 && (
              <span className="text-[11px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                {totalUnread} unread
              </span>
            )}
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 mb-3">
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              <ShieldCheck size={10} /> {supportCount} support
            </span>
            <span className="flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">
              <Users size={10} /> {bookingCount} booking
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl
                         bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400
                         focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convsLoading && (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800/60 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/5" />
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-12" />
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-3/5" />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))
          )}
          {!convsLoading && filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <MessageSquare size={32} className="text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                  Partner support threads will appear here once partners send messages.
                </p>
              )}
            </div>
          )}
          {!convsLoading && filteredConvs.map(conv => (
            <ConvItem
              key={conv.booking_id}
              conv={conv}
              userId={user?.id}
              isActive={activeConv?.booking_id === conv.booking_id}
              onClick={() => handleSelect(conv)}
            />
          ))}
        </div>
      </div>

      {/* ══ Chat Area ════════════════════════════════════════════════════════ */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900
                       ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>

        {activeConv ? (
          <>
            {/* Chat header */}
            <div className={`px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shrink-0 ${
              isSupport
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10'
                : 'bg-white dark:bg-gray-900'
            }`}>
              <button
                className="sm:hidden p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                onClick={() => setMobileView('list')}
              >
                <ArrowLeft size={18} />
              </button>

              {isSupport ? (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600
                                flex items-center justify-center text-white shrink-0">
                  <ShieldCheck size={16} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600
                                flex items-center justify-center font-bold text-white text-sm shrink-0">
                  {initials(activeLabel)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{activeLabel}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                  {isSupport
                    ? <><ShieldCheck size={10} className="shrink-0" /> Support thread</>
                    : <><Car size={10} className="shrink-0" /> {activeSub}</>
                  }
                </p>
              </div>

              {/* Booking code badge */}
              {!isSupport && activeConv.booking_code && (
                <span className="shrink-0 px-2.5 py-1 bg-gray-100 dark:bg-gray-800
                                 text-gray-500 dark:text-gray-400 text-[10px] font-mono rounded-lg">
                  #{activeConv.booking_code}
                </span>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5
                            bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/20 dark:to-gray-900">
              {renderMessages()}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <form
              onSubmit={handleSend}
              className="px-4 py-3 border-t border-gray-100 dark:border-gray-800
                         flex gap-2.5 items-center shrink-0 bg-white dark:bg-gray-900"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isSupport ? `Reply to ${activeLabel}…` : 'Send a message…'}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-sm
                           bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:bg-white dark:focus:bg-gray-700/60
                           transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isMsgPending || (isSupport && !supportPartnerId)}
                className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 dark:disabled:bg-gray-700
                           disabled:text-gray-400 text-white rounded-2xl transition flex items-center justify-center
                           shadow-md shadow-violet-500/20 disabled:shadow-none"
              >
                <Send size={17} />
              </button>
            </form>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-50 to-indigo-50
                            dark:from-violet-900/20 dark:to-indigo-900/20
                            flex items-center justify-center mb-5">
              <MessageSquare size={32} className="text-violet-400 dark:text-violet-500" />
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Select a conversation</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
              Choose a support thread or booking conversation from the sidebar to start messaging.
            </p>
            {convList.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12} />
                <span>{convList.length} conversation{convList.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
