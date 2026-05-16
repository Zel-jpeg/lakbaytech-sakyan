import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, User, ChevronLeft, ChevronRight, Car } from 'lucide-react'
import api from '@/config/axios'

export default function PartnerStrip({ selectedId, onSelect }) {
  const scrollRef = useRef(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['approved-partners'],
    queryFn: () => api.get('/partners/approved/').then(r => r.data),
    staleTime: 5 * 60_000,
  })

  const list = partners?.results || partners || []

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 10)
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Our Partners</h3>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-[88px]">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="h-2.5 w-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (list.length === 0) return null

  return (
    <div className="mb-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Our Partners</h3>
        {selectedId && (
          <button
            onClick={() => onSelect('')}
            className="text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition"
          >
            View All
          </button>
        )}
      </div>

      {/* Scrollable strip */}
      <div className="relative group">
        {/* Left fade + arrow */}
        {showLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-gray-50 dark:from-[#0f1117] to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full
                         bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700
                         flex items-center justify-center text-gray-500 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition
                         opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}

        {/* Right fade + arrow */}
        {showRight && list.length > 5 && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-gray-50 dark:from-[#0f1117] to-transparent z-10 pointer-events-none" />
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full
                         bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700
                         flex items-center justify-center text-gray-500 dark:text-gray-400
                         hover:bg-gray-50 dark:hover:bg-gray-700 transition
                         opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* "All" pill */}
          <button
            onClick={() => onSelect('')}
            className={`flex flex-col items-center gap-1.5 shrink-0 group/item transition-all duration-200 w-[80px] sm:w-[88px]`}
          >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center
                             transition-all duration-200 border-2 ${
              !selectedId
                ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 shadow-md shadow-brand-500/15'
                : 'bg-gray-100 dark:bg-gray-800 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
              <Car size={18} className={`${!selectedId ? 'text-brand-500 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`} />
            </div>
            <span className={`text-[10px] sm:text-[11px] font-medium truncate max-w-full leading-tight text-center ${
              !selectedId ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              All
            </span>
          </button>

          {/* Partner items */}
          {list.map(p => {
            const isActive = selectedId === p.id
            const initials = p.business_name
              .split(' ')
              .slice(0, 2)
              .map(w => w[0])
              .join('')
              .toUpperCase()

            return (
              <button
                key={p.id}
                onClick={() => onSelect(isActive ? '' : p.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group/item transition-all duration-200 w-[80px] sm:w-[88px]"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center
                                 transition-all duration-200 overflow-hidden border-2 ${
                  isActive
                    ? 'border-brand-500 shadow-md shadow-brand-500/15'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}>
                  {p.logo_url ? (
                    <img
                      src={p.logo_url}
                      alt={p.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-sm font-bold ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {initials}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-medium truncate max-w-full leading-tight text-center ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {p.business_name.length > 12 ? p.business_name.slice(0, 11) + '…' : p.business_name}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
