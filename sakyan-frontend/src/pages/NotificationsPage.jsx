import { Bell, Check, CheckCheck, ChevronRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications'

const TYPE_STYLES = {
  approval: { bg: 'bg-green-100', icon: '🎉' },
  booking:  { bg: 'bg-blue-100',  icon: '📋' },
  payment:  { bg: 'bg-purple-100',icon: '💳' },
  general:  { bg: 'bg-gray-100',  icon: '🔔' },
}

function NotifItem({ notif, onMarkRead }) {
  const style = TYPE_STYLES[notif.type] || TYPE_STYLES.general

  return (
    <div
      onClick={() => !notif.is_read && onMarkRead(notif.id)}
      className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition
                  hover:bg-gray-50 border-b border-gray-100 last:border-0
                  ${!notif.is_read ? 'bg-blue-50/40' : 'bg-white'}`}
    >
      {/* Icon bubble */}
      <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center
                       justify-center text-lg shrink-0 mt-0.5`}>
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
          {notif.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 leading-snug">{notif.message}</p>
        <p className="text-xs text-gray-400 mt-1.5">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const navigate  = useNavigate()
  const { data, isLoading } = useNotifications()
  const markRead  = useMarkNotificationRead()

  const notifications = data?.results || data || []
  const unreadCount   = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Bell size={18} className="text-blue-500" />
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-blue-500">{unreadCount} unread</p>
              )}
            </div>
          </div>

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markRead.mutate(null)}
              disabled={markRead.isPending}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700
                         font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto py-4 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">

          {isLoading && (
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                    <div className="h-2 bg-gray-100 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="py-20 text-center">
              <Bell size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">You're all caught up!</p>
              <p className="text-gray-300 text-xs mt-1">No notifications yet.</p>
            </div>
          )}

          {!isLoading && notifications.map(notif => (
            <NotifItem
              key={notif.id}
              notif={notif}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          ))}

        </div>
      </div>
    </div>
  )
}
