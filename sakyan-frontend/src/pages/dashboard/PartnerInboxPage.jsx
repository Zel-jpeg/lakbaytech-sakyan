import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, Search, ArrowLeft, Car, Clock, ShieldCheck, Users, X, Paperclip, ImageIcon, AlertCircle, RefreshCw } from 'lucide-react'
import {
  useConversations, useMessages, useSendMessage,
  useSupportMessages, useSendSupportMessage,
} from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import { useFileUpload } from '@/hooks/useFileUpload'
import toast from 'react-hot-toast'

// ─── helpers ──────────────────────────────────────────────────────────────────

const SUPPORT_PREFIX = 'support'
function isSupportConv(conv) {
  if (!conv) return false
  return conv.is_support === true || conv.booking_id === SUPPORT_PREFIX || String(conv.booking_id || '').startsWith('support:')
}
function resolveOtherUser(conv, userId) {
  if (!conv || !userId) return { name: 'Unknown', id: null }
  if (isSupportConv(conv)) return { name: 'Sakyan Support', id: null }
  const isCustomer = String(userId) === String(conv.customer_id)
  return {
    name: isCustomer ? (conv.partner_name || 'Partner') : (conv.customer_name || 'Customer'),
    id:   isCustomer ? conv.partner_user_id : conv.customer_id,
  }
}
function lastMsgTime(conv) {
  const t = conv.last_message?.created_at
  if (!t) return ''
  const d = new Date(t), now = new Date(), diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
function lastMsgText(conv) {
  if (!conv.last_message) return 'No messages yet'
  if (typeof conv.last_message === 'string') return conv.last_message
  if (conv.last_message.image_url && !conv.last_message.content) return '📷 Image'
  if (conv.last_message.image_url) return `📷 ${conv.last_message.content}`
  return conv.last_message.content || 'No messages yet'
}
function initials(name = '') { return (name || '?')[0].toUpperCase() }

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConvItem({ conv, isActive, onClick, userId }) {
  const isSupport = isSupportConv(conv)
  const other     = resolveOtherUser(conv, userId)
  const hasUnread = conv.unread_count > 0
  const preview   = lastMsgText(conv)
  const time      = lastMsgTime(conv)
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-50 dark:border-gray-800/60 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/60 ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500' : ''}`}>
      <div className="relative shrink-0">
        {isSupport
          ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white"><ShieldCheck size={18}/></div>
          : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">{initials(other.name)}</div>
        }
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {conv.unread_count > 9 ? '9+' : conv.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {other.name}
            {isSupport && <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">Support</span>}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">{time}</span>
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
          {isSupport ? '🛡️ Ask questions or report issues' : <><Car size={9} className="shrink-0"/> {conv.car_name || conv.booking_code || 'Booking'}</>}
        </p>
        <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>{preview}</p>
      </div>
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg, isOwn, isOptimistic, hasFailed, onRetry }) {
  const [imgOpen, setImgOpen] = useState(false)
  const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
  const lines = (msg.content || '').split('\n')
  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-70' : ''}`}>
        <div className={`max-w-[78%] rounded-2xl shadow-sm text-sm overflow-hidden ${isOwn ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
          {msg.image_url && (
            <button onClick={() => setImgOpen(true)} className="block w-full overflow-hidden" style={{maxWidth:'260px'}}>
              <img src={msg.image_url} alt="attachment" className="w-full object-cover" style={{maxHeight:'200px'}} onError={e=>{e.target.style.display='none'}}/>
            </button>
          )}
          {msg.content && (
            <div className={`px-4 leading-relaxed ${msg.image_url ? 'pt-2 pb-1' : 'pt-2.5 pb-1'}`}>
              {lines.map((line, i) => <p key={i}>{line || <br/>}</p>)}
            </div>
          )}
          <div className={`flex items-center justify-end gap-1 px-4 ${msg.content ? 'pb-2 pt-0.5' : msg.image_url ? 'pb-2' : 'py-2.5'}`}>
            {hasFailed ? (
              <button onClick={onRetry} className="flex items-center gap-1 text-[10px] text-red-300 hover:text-red-100 transition">
                <AlertCircle size={11}/><span>Failed · Tap to retry</span><RefreshCw size={10}/>
              </button>
            ) : isOptimistic ? (
              <span className={`text-[10px] flex items-center gap-1 ${isOwn ? 'text-brand-300' : 'text-gray-400'}`}>
                <Clock size={10} className="animate-pulse"/>Sending…
              </span>
            ) : (
              <span className={`text-[10px] ${isOwn ? 'text-brand-300' : 'text-gray-400 dark:text-gray-500'}`}>{time}</span>
            )}
          </div>
        </div>
      </div>
      {imgOpen && msg.image_url && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={()=>setImgOpen(false)}>
          <button onClick={()=>setImgOpen(false)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"><X size={20}/></button>
          <img src={msg.image_url} alt="attachment" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" onClick={e=>e.stopPropagation()}/>
        </div>
      )}
    </>
  )
}

function DateSep({ date }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full whitespace-nowrap">
        {new Date(date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
    </div>
  )
}

function ImagePreview({ file, onRemove }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file); setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <div className="px-4 pb-2 pt-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="relative inline-block">
        {src && <img src={src} alt="preview" className="h-20 w-20 object-cover rounded-xl border-2 border-brand-300 dark:border-brand-700 shadow-md"/>}
        <button onClick={onRemove} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow transition"><X size={11}/></button>
        <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1 py-0.5"><ImageIcon size={10} className="text-white"/></div>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Image ready to send</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PartnerInboxPage() {
  const { user }        = useAuthStore()
  const [searchParams]  = useSearchParams()
  const targetBookingId = searchParams.get('booking')
  const targetSupport   = searchParams.get('support') === '1'

  const { data: conversations, isLoading: convsLoading } = useConversations()
  const [activeConv,     setActiveConv]     = useState(null)
  const [input,          setInput]          = useState('')
  const [mobileView,     setMobileView]     = useState('list')
  const [searchQuery,    setSearchQuery]    = useState('')
  const [imageFile,      setImageFile]      = useState(null)
  const [optimisticMsgs, setOptimisticMsgs] = useState([])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const fileRef   = useRef(null)

  const { uploadFile, uploading } = useFileUpload('chat-images')

  const convList      = conversations?.results || conversations || []
  const filteredConvs = searchQuery.trim()
    ? convList.filter(c => {
        const other = resolveOtherUser(c, user?.id)
        const q = searchQuery.toLowerCase()
        return other.name.toLowerCase().includes(q) ||
          (c.car_name || '').toLowerCase().includes(q) ||
          (c.booking_code || '').toLowerCase().includes(q)
      })
    : convList

  const isSupport = isSupportConv(activeConv)

  useEffect(() => {
    if (!convList.length) return
    if (targetSupport && !activeConv) {
      const s = convList.find(c => isSupportConv(c))
      if (s) { setActiveConv(s); setMobileView('chat') }
      return
    }
    if (targetBookingId && !activeConv) {
      const m = convList.find(c => String(c.booking_id) === String(targetBookingId))
      if (m) { setActiveConv(m); setMobileView('chat') }
    }
  }, [targetBookingId, targetSupport, convList, activeConv])

  const { data: bookingMessages, isLoading: bookingMsgsLoading } = useMessages(!isSupport && activeConv ? activeConv.booking_id : null)
  const { data: supportMessages, isLoading: supportMsgsLoading } = useSupportMessages(isSupport ? undefined : undefined) // undefined means partner's own support thread
  const sendBookingMsg = useSendMessage()
  const sendSupportMsg = useSendSupportMessage()

  const serverMsgs  = isSupport ? (supportMessages || []) : (bookingMessages?.results || bookingMessages || [])
  const msgsLoading = isSupport ? supportMsgsLoading : bookingMsgsLoading

  useEffect(() => {
    if (!optimisticMsgs.length || !serverMsgs.length) return
    setOptimisticMsgs(prev => prev.filter(om =>
      !serverMsgs.some(sm => sm.content === om.content && sm.image_url === om.image_url && String(sm.sender) === String(user?.id))
    ))
  }, [serverMsgs])

  useEffect(() => { setOptimisticMsgs([]) }, [activeConv?.booking_id])

  const msgList = [...serverMsgs, ...optimisticMsgs]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgList])

  const handleSelect = (conv) => {
    setActiveConv(conv); setMobileView('chat'); setInput(''); setImageFile(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSend = useCallback(async (e, retryData = null) => {
    e?.preventDefault()
    if (!activeConv) return
    const content = retryData?.content ?? input.trim()
    const file    = retryData?.file    ?? imageFile
    if (!content && !file && !retryData?.imageUrl) return

    let imageUrl = retryData?.imageUrl ?? null
    if (file) {
      const uploaded = await uploadFile(file, null)
      if (!uploaded) return
      imageUrl = uploaded
    }

    const optimistic = { id: `opt-${Date.now()}`, sender: user?.id, content: content || '', image_url: imageUrl, created_at: new Date().toISOString(), _optimistic: true, _failed: false }
    const optId = optimistic.id

    if (retryData?.optId) {
      setOptimisticMsgs(prev => prev.map(m => m.id === retryData.optId ? { ...optimistic, id: retryData.optId } : m))
    } else {
      setOptimisticMsgs(prev => [...prev, optimistic])
    }
    setInput(''); setImageFile(null)

    const onError = () => {
      setOptimisticMsgs(prev => prev.map(m => m.id === optId ? { ...m, _failed: true } : m))
      toast.error('Message failed to send.')
    }

    if (isSupport) {
      sendSupportMsg.mutate({ content, imageUrl }, { onError })
    } else {
      const { id: receiverId } = resolveOtherUser(activeConv, user?.id)
      sendBookingMsg.mutate({ bookingId: activeConv.booking_id, receiverId, content, imageUrl }, { onError })
    }
  }, [activeConv, input, imageFile, isSupport, user, sendSupportMsg, sendBookingMsg, uploadFile])

  const handleRetry = (msg) => {
    setOptimisticMsgs(prev => prev.filter(m => m.id !== msg.id))
    handleSend(null, { content: msg.content, imageUrl: msg.image_url, file: null, optId: msg.id })
  }

  const renderMessages = () => {
    if (msgsLoading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
    if (msgList.length === 0) return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        {isSupport ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3"><ShieldCheck size={26} className="text-emerald-400"/></div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Send us a message</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs leading-relaxed">Questions about your account, remittances, or anything else? We're here to help.</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3"><MessageSquare size={24} className="text-gray-300 dark:text-gray-600"/></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet — say hello!</p>
          </>
        )}
      </div>
    )
    const items = []; let lastDate = null
    msgList.forEach(msg => {
      const dateStr = msg.created_at ? new Date(msg.created_at).toDateString() : null
      if (dateStr && dateStr !== lastDate) { items.push(<DateSep key={`sep-${msg.id}`} date={msg.created_at}/>); lastDate = dateStr }
      items.push(
        <Bubble key={msg.id} msg={msg}
          isOwn={String(msg.sender) === String(user?.id)}
          isOptimistic={!!msg._optimistic && !msg._failed}
          hasFailed={!!msg._failed}
          onRetry={() => handleRetry(msg)}
        />
      )
    })
    return items
  }

  const canSend     = (input.trim() || imageFile) && !uploading
  const activeOther = activeConv ? resolveOtherUser(activeConv, user?.id) : null

  return (
    <div className="flex -m-4 lg:-m-6 h-[calc(100vh-73px)] overflow-hidden rounded-none lg:rounded-2xl border-0 lg:border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">

      {/* ══ Sidebar ══ */}
      <div className={`w-full sm:w-72 xl:w-80 shrink-0 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white text-base">Messages</h2>
            {convList.length > 0 && <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{convList.length} chat{convList.length !== 1 ? 's' : ''}</span>}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or car…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-400"/>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading && [...Array(6)].map((_,i) => (
            <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800/60 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0"/>
              <div className="flex-1 space-y-2 pt-1">
                <div className="flex justify-between"><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/5"/><div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-12"/></div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-3/5"/>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2"/>
              </div>
            </div>
          ))}
          {!convsLoading && filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <MessageSquare size={32} className="text-gray-200 dark:text-gray-700 mb-3"/>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{searchQuery ? 'No results found' : 'No conversations yet'}</p>
              {!searchQuery && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">Conversations appear here when customers book your cars.</p>}
            </div>
          )}
          {!convsLoading && filteredConvs.map(conv => (
            <ConvItem key={conv.booking_id} conv={conv} userId={user?.id} isActive={activeConv?.booking_id === conv.booking_id} onClick={() => handleSelect(conv)}/>
          ))}
        </div>
      </div>

      {/* ══ Chat Area ══ */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
        {activeConv ? (
          <>
            {/* Chat header */}
            <div className={`px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shrink-0 ${isSupport ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10' : 'bg-white dark:bg-gray-900'}`}>
              <button className="sm:hidden p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => setMobileView('list')}><ArrowLeft size={18}/></button>
              {isSupport
                ? <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0"><ShieldCheck size={16}/></div>
                : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">{initials(activeOther?.name)}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{activeOther?.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                  {isSupport ? 'We typically reply within 1 business day' : <><Car size={10} className="shrink-0"/> {activeConv.car_name || activeConv.booking_code}</>}
                </p>
              </div>
              {!isSupport && (activeConv.booking_code || activeConv.booking_id) && (
                <span className="shrink-0 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-mono rounded-lg">#{activeConv.booking_code || activeConv.booking_id}</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/20 dark:to-gray-900">
              {renderMessages()}
              <div ref={bottomRef}/>
            </div>

            {/* Image preview strip */}
            {imageFile && <ImagePreview file={imageFile} onRemove={() => setImageFile(null)}/>}

            {/* Input bar */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2.5 items-end shrink-0 bg-white dark:bg-gray-900">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setImageFile(f); e.target.value = '' }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach image"
                className={`p-2.5 rounded-xl transition shrink-0 ${imageFile ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                <Paperclip size={18}/>
              </button>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder={imageFile ? 'Add a caption… (optional)' : isSupport ? 'Ask Sakyan Support anything…' : 'Type a message…'}
                className="flex-1 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:bg-white dark:focus:bg-gray-700/60 transition"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
              />
              <button type="submit" disabled={!canSend}
                className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-2xl transition flex items-center justify-center shadow-md shadow-brand-500/20 disabled:shadow-none shrink-0">
                {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send size={17}/>}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-5">
              <MessageSquare size={32} className="text-brand-400 dark:text-brand-500"/>
            </div>
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Select a conversation</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed">
              {targetBookingId ? 'Loading your conversation…' : 'Pick a conversation from the sidebar to start chatting.'}
            </p>
            {convList.length > 0 && (
              <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12}/><span>{convList.length} active conversation{convList.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
