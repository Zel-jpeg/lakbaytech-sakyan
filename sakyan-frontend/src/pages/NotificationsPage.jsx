import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, CheckCheck, X, Info, ShieldCheck,
  CalendarCheck, CreditCard, MessageCircle, ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'

// ─── Type metadata ────────────────────────────────────────────────────────────
const TYPE_META = {
  kyc:      { icon: ShieldCheck,   bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400', label: 'KYC' },
  booking:  { icon: CalendarCheck, bg: 'bg-blue-100 dark:bg-blue-900/30',       color: 'text-blue-600 dark:text-blue-400',       label: 'Booking' },
  payment:  { icon: CreditCard,    bg: 'bg-purple-100 dark:bg-purple-900/30',   color: 'text-purple-600 dark:text-purple-400',   label: 'Payment' },
  message:  { icon: MessageCircle, bg: 'bg-amber-100 dark:bg-amber-900/30',     color: 'text-amber-600 dark:text-amber-400',     label: 'Message' },
  general:  { icon: Info,          bg: 'bg-gray-100 dark:bg-gray-800',          color: 'text-gray-500 dark:text-gray-400',       label: 'General' },
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function NotifModal({ notif, onClose, onMarkRead }) {
  const meta = TYPE_META[notif.type] || TYPE_META.general
  const Icon = meta.icon

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-[#1a1d2e] rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={meta.color} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{meta.label}</p>
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{notif.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {notif.message && (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{notif.message}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {format(new Date(notif.created_at), 'MMMM d, yyyy · h:mm a')}
          </p>
          {!notif.is_read && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Unread
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          {!notif.is_read && (
            <button
              onClick={() => { onMarkRead(notif.id); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition"
            >
              <CheckCheck size={14} /> Mark as Read
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-semibold rounded-xl hover:border-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotifRow({ notif, onClick }) {
  const meta = TYPE_META[notif.type] || TYPE_META.general
  const Icon = meta.icon
  const isRead = notif.is_read

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0
                  group hover:bg-gray-50 dark:hover:bg-gray-800/40
                  ${isRead ? 'bg-white dark:bg-transparent' : 'bg-brand-50/40 dark:bg-brand-900/10'}`}
    >
      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug ${isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {notif.title}
        </p>
        {notif.message && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{notif.message}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0 mt-1">
        {!isRead && <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />}
        <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-400 transition" />
      </div>
    </button>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function NotifSkeleton() {
  return (
    <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [filter, setFilter]     = useState('all')
  const [selected, setSelected] = useState(null)

  const { data, isLoading }  = useNotifications()
  const markRead             = useMarkNotificationRead()

  const allNotifs   = data?.results || data || []
  const unreadCount = allNotifs.filter(n => !n.is_read).length
  const filtered    = filter === 'unread' ? allNotifs.filter(n => !n.is_read) : allNotifs

  const isInsideDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dashboard')

  const content = (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markRead.mutate(null)}
              disabled={markRead.isPending}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400
                         hover:bg-brand-50 dark:hover:bg-brand-900/20 px-3 py-2 rounded-xl transition disabled:opacity-50"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {!isInsideDashboard && (
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'all',    label: `All (${allNotifs.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === tab.key
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#1a1d2e] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {isLoading && [...Array(5)].map((_, i) => <NotifSkeleton key={i} />)}

        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center">
            <Bell size={40} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {filter === 'unread' ? 'No unread notifications' : "You're all caught up!"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {filter === 'unread' ? 'Switch to "All" to see past notifications.' : 'New notifications will appear here.'}
            </p>
          </div>
        )}

        {!isLoading && filtered.map(notif => (
          <NotifRow
            key={notif.id}
            notif={notif}
            onClick={() => setSelected(notif)}
          />
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <NotifModal
          notif={selected}
          onClose={() => setSelected(null)}
          onMarkRead={id => markRead.mutate(id)}
        />
      )}
    </>
  )

  if (isInsideDashboard) {
    // Full width inside dashboard — no max-w constraint
    return <div className="w-full">{content}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117]">
      <div className="max-w-2xl mx-auto px-4 py-8">{content}</div>
    </div>
  )
}
