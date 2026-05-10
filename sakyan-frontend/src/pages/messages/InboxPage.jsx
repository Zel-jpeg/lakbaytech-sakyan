import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, MessageSquare, ArrowLeft, X, ShieldCheck, Paperclip, ImageIcon, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useConversations, useMessages, useSendMessage,
  useSupportMessages, useSendSupportMessage,
} from '@/hooks/useMessages'
import { useAuthStore } from '@/store/authStore'
import { useFileUpload } from '@/hooks/useFileUpload'
import toast from 'react-hot-toast'

const SUPPORT_ID = 'support'
function isSupportConv(conv) {
  return conv?.is_support === true || conv?.booking_id === SUPPORT_ID || String(conv?.booking_id || '').startsWith('support:')
}
function resolveOtherUser(conv, userId, userRole) {
  if (!conv || !userId) return { name: 'Unknown', id: null }
  if (isSupportConv(conv)) {
    if (userRole === 'admin') return { name: conv.customer_name || 'Partner', id: conv.customer_id || conv.support_partner_id }
    return { name: 'Sakyan Support', id: null }
  }
  const isCustomer = String(userId) === String(conv.customer_id)
  return {
    name: isCustomer ? (conv.partner_name || 'Partner') : (conv.customer_name || 'Customer'),
    id:   isCustomer ? conv.partner_user_id : conv.customer_id,
  }
}
function lastMsgText(conv) {
  if (!conv.last_message) return 'No messages yet'
  if (typeof conv.last_message === 'string') return conv.last_message
  if (conv.last_message.image_url && !conv.last_message.content) return '📷 Image'
  if (conv.last_message.image_url) return `📷 ${conv.last_message.content}`
  return conv.last_message.content || 'No messages yet'
}

function ConversationItem({ conv, isActive, onClick, userId, userRole }) {
  const other = resolveOtherUser(conv, userId, userRole)
  const hasUnread = conv.unread_count > 0
  const isSupport = isSupportConv(conv)
  return (
    <button onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800 transition hover:bg-gray-50 dark:hover:bg-gray-800/60 ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 border-l-2 border-l-brand-500' : ''}`}>
      {isSupport
        ? <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0"><ShieldCheck size={18} className="text-white" /></div>
        : <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">{(other.name||'?')[0].toUpperCase()}</div>
      }
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
            {other.name}
            {isSupport && <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">Support</span>}
          </p>
          {hasUnread && <span className="bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{conv.unread_count}</span>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{isSupport ? 'Ask questions or report issues' : `Re: ${conv.car_name || conv.booking_code || 'Booking'}`}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{lastMsgText(conv)}</p>
      </div>
    </button>
  )
}

function MessageBubble({ msg, isOwn, isOptimistic, hasFailed, onRetry }) {
  const [imgOpen, setImgOpen] = useState(false)
  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isOptimistic ? 'opacity-70' : ''}`}>
        <div className={`max-w-[75%] rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
          {msg.image_url && (
            <button onClick={() => setImgOpen(true)} className="block w-full overflow-hidden" style={{maxWidth:'260px'}}>
              <img src={msg.image_url} alt="attachment" className="w-full object-cover" style={{maxHeight:'200px'}} onError={e=>{e.target.style.display='none'}} />
            </button>
          )}
          {msg.content && <p className={`px-4 ${msg.image_url ? 'pt-2 pb-1' : 'py-2.5'}`}>{msg.content}</p>}
          <div className="flex items-center justify-end gap-1 px-4 pb-2">
            {hasFailed ? (
              <button onClick={onRetry} className="flex items-center gap-1 text-[10px] text-red-300 hover:text-red-100 transition">
                <AlertCircle size={11}/><span>Failed · Tap to retry</span><RefreshCw size={10}/>
              </button>
            ) : isOptimistic ? (
              <span className={`text-[10px] flex items-center gap-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>
                <Clock size={10} className="animate-pulse"/>Sending…
              </span>
            ) : (
              <span className={`text-[10px] ${isOwn ? 'text-brand-200' : 'text-gray-400 dark:text-gray-500'}`}>
                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
              </span>
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

function ImagePreview({ file, onRemove }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <div className="px-4 pb-2 border-t border-gray-100 dark:border-gray-800 pt-2 bg-white dark:bg-gray-900">
      <div className="relative inline-block">
        {src && <img src={src} alt="preview" className="h-20 w-20 object-cover rounded-xl border-2 border-brand-300 dark:border-brand-700 shadow-md"/>}
        <button onClick={onRemove} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow transition"><X size={11}/></button>
        <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1 py-0.5"><ImageIcon size={10} className="text-white"/></div>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Image ready to send</p>
    </div>
  )
}

export default function InboxPage() {
  const { user }        = useAuthStore()
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const targetBookingId = searchParams.get('booking')
  const targetSupport   = searchParams.get('support') === '1'

  const { data: conversations, isLoading: convsLoading } = useConversations()
  const [activeConv,      setActiveConv]      = useState(null)
  const [input,           setInput]           = useState('')
  const [mobileView,      setMobileView]      = useState('list')
  const [imageFile,       setImageFile]       = useState(null)
  const [optimisticMsgs,  setOptimisticMsgs]  = useState([])
  const bottomRef = useRef(null)
  const fileRef   = useRef(null)
  const inputRef  = useRef(null)

  const { uploadFile, uploading } = useFileUpload('chat-images')
  const convList = conversations || []

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

  const isSupport = isSupportConv(activeConv)
  const adminSupportPartnerId = isSupport && user?.role === 'admin' && activeConv
    ? (activeConv.support_partner_id || activeConv.customer_id || null) : null

  const { data: bookingMessages, isLoading: bookingMsgsLoading } = useMessages(!isSupport && activeConv ? activeConv.booking_id : null)
  const { data: supportMessages, isLoading: supportMsgsLoading } = useSupportMessages(isSupport ? adminSupportPartnerId : undefined)
  const sendBookingMsg = useSendMessage()
  const sendSupportMsg = useSendSupportMessage()

  const serverMsgs  = isSupport ? (supportMessages || []) : (bookingMessages?.results || bookingMessages || [])
  const msgsLoading = isSupport ? supportMsgsLoading : bookingMsgsLoading

  // Remove confirmed optimistic messages
  useEffect(() => {
    if (!optimisticMsgs.length || !serverMsgs.length) return
    setOptimisticMsgs(prev => prev.filter(om =>
      !serverMsgs.some(sm =>
        sm.content === om.content && sm.image_url === om.image_url && String(sm.sender) === String(user?.id)
      )
    ))
  }, [serverMsgs])

  useEffect(() => { setOptimisticMsgs([]) }, [activeConv?.booking_id])

  const msgList = [...serverMsgs, ...optimisticMsgs]

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgList])

  const handleSelectConv = (conv) => { setActiveConv(conv); setMobileView('chat'); setInput(''); setImageFile(null) }

  const handleSend = useCallback(async (e, retryData = null) => {
    e?.preventDefault()
    if (!activeConv) return
    const content  = retryData?.content  ?? input.trim()
    const file     = retryData?.file     ?? imageFile
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
      sendSupportMsg.mutate({ content, imageUrl, ...(adminSupportPartnerId ? { receiverId: adminSupportPartnerId } : {}) }, { onError })
    } else {
      const { id: receiverId } = resolveOtherUser(activeConv, user?.id, user?.role)
      sendBookingMsg.mutate({ bookingId: activeConv.booking_id, receiverId, content, imageUrl }, { onError })
    }
  }, [activeConv, input, imageFile, isSupport, adminSupportPartnerId, user, sendSupportMsg, sendBookingMsg, uploadFile])

  const handleRetry = (msg) => {
    setOptimisticMsgs(prev => prev.filter(m => m.id !== msg.id))
    handleSend(null, { content: msg.content, imageUrl: msg.image_url, file: null, optId: msg.id })
  }

  const canSend     = (input.trim() || imageFile) && !uploading
  const activeOther = activeConv ? resolveOtherUser(activeConv, user?.id, user?.role) : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><ArrowLeft size={18}/></button>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Messages</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">{convList.length} conversation{convList.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {activeConv && mobileView === 'chat' && (
          <button onClick={() => setMobileView('list')} className="sm:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><X size={18}/></button>
        )}
      </div>

      <div className="max-w-5xl mx-auto flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className={`w-full sm:w-72 md:w-80 shrink-0 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden ${mobileView === 'chat' ? 'hidden sm:flex' : 'flex'}`}>
          {convsLoading && (
            <div className="flex-1">
              {[...Array(5)].map((_,i) => (
                <div key={i} className="flex gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0"/>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3"/>
                    <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2"/>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!convsLoading && convList.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageSquare size={36} className="text-gray-200 dark:text-gray-700 mb-3"/>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">Book a car to start messaging with a partner.</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {convList.map(conv => (
              <ConversationItem key={conv.booking_id} conv={conv} userId={user?.id} userRole={user?.role}
                isActive={activeConv?.booking_id === conv.booking_id} onClick={() => handleSelectConv(conv)}/>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {activeConv ? (
            <>
              {/* Header */}
              <div className={`px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 ${isSupport ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10' : 'bg-white dark:bg-gray-900'}`}>
                <button className="sm:hidden p-1.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => setMobileView('list')}><ArrowLeft size={18}/></button>
                {isSupport
                  ? <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0"><ShieldCheck size={16} className="text-white"/></div>
                  : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">{(activeOther?.name||'?')[0].toUpperCase()}</div>
                }
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{activeOther?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {isSupport ? (user?.role === 'admin' ? 'Partner support thread' : 'Ask Sakyan anything — we typically reply within 1 business day') : `Re: ${activeConv.car_name || activeConv.booking_code}`}
                  </p>
                </div>
              </div>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/50 dark:bg-gray-800/20">
                {msgsLoading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>}
                {!msgsLoading && msgList.length === 0 && (
                  <div className="text-center py-12">
                    {isSupport ? (
                      <>
                        <ShieldCheck size={32} className="mx-auto text-emerald-300 dark:text-emerald-700 mb-3"/>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Start a conversation with Sakyan Support</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">Have a question or issue? Send us a message and we'll get back to you.</p>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={28} className="mx-auto text-gray-200 dark:text-gray-700 mb-2"/>
                        <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet. Say hello!</p>
                      </>
                    )}
                  </div>
                )}
                {msgList.map(msg => (
                  <MessageBubble key={msg.id} msg={msg}
                    isOwn={String(msg.sender) === String(user?.id)}
                    isOptimistic={!!msg._optimistic && !msg._failed}
                    hasFailed={!!msg._failed}
                    onRetry={() => handleRetry(msg)}
                  />
                ))}
                <div ref={bottomRef}/>
              </div>

              {/* Image preview strip */}
              {imageFile && <ImagePreview file={imageFile} onRemove={() => setImageFile(null)}/>}

              {/* Input bar */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-end gap-2.5 bg-white dark:bg-gray-900">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setImageFile(f); e.target.value = '' }}
                />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} title="Attach image"
                  className={`p-2.5 rounded-xl transition shrink-0 ${imageFile ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400' : 'text-gray-400 hover:text-brand-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Paperclip size={18}/>
                </button>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  placeholder={imageFile ? 'Add a caption… (optional)' : isSupport ? 'Type your support message…' : 'Type a message…'}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                />
                <button type="submit" disabled={!canSend}
                  className="p-2.5 rounded-xl transition shrink-0 flex items-center justify-center bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-white disabled:text-gray-400">
                  {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send size={17}/>}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare size={44} className="text-gray-200 dark:text-gray-700 mb-4"/>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Select a conversation</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {targetBookingId ? 'Loading your conversation…' : 'Choose a conversation from the left to start chatting.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
