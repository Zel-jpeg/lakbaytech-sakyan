import { formatDateTime } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { MessageSquare } from 'lucide-react'
import clsx from 'clsx'

export default function ConversationList({ conversations, selectedId, onSelect, isLoading }) {
  const { user } = useAuthStore()

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center">
        <MessageSquare size={32} className="text-gray-300 mb-2" />
        <p className="text-sm font-medium text-gray-500">No conversations yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Messages are tied to bookings. Book a car or approve a booking to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((convo) => {
        // The other party's name — if I'm the customer, show partner; if partner, show customer
        const otherName = user?.role === 'partner'
          ? convo.customer_name
          : convo.partner_name

        const isSelected  = convo.booking_id === selectedId
        const hasUnread   = convo.unread_count > 0
        const lastMessage = convo.last_message

        return (
          <button
            key={convo.booking_id}
            onClick={() => onSelect(convo)}
            className={clsx(
              'w-full text-left px-4 py-3.5 border-b border-gray-100 transition',
              isSelected
                ? 'bg-blue-50'
                : 'hover:bg-gray-50'
            )}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className={clsx(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'
              )}>
                {otherName?.[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={clsx(
                    'text-sm truncate',
                    hasUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                  )}>
                    {otherName}
                  </p>
                  <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                    {lastMessage ? formatDateTime(lastMessage.created_at) : ''}
                  </span>
                </div>

                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {convo.car_name} · #{convo.booking_code}
                </p>

                <div className="flex items-center justify-between mt-1">
                  <p className={clsx(
                    'text-xs truncate',
                    hasUnread ? 'text-gray-800 font-medium' : 'text-gray-400'
                  )}>
                    {lastMessage?.content || 'No messages yet'}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white
                                     text-[10px] font-bold flex items-center justify-center">
                      {convo.unread_count > 9 ? '9+' : convo.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}