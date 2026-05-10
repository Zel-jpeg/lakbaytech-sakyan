import { Link } from 'react-router-dom'
import { MapPin, Users, Fuel, Settings2, Gauge } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { useCarBookedDates } from '@/hooks/useCars'

// ─── Availability status ──────────────────────────────────────────────────────
function getAvailabilityInfo(ranges = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcoming = ranges.filter(r => new Date(r.end) >= today)
  if (!upcoming.length) return { label: 'Available', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' }

  const hasConfirmed = upcoming.some(r => r.status === 'confirmed')
  if (hasConfirmed) return { label: 'Booked', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', dot: 'bg-red-500' }

  return { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500' }
}

export default function CarCard({ car }) {
  const { user } = useAuthStore()
  const { data: bookedRanges = [] } = useCarBookedDates(car.id)
  const avail = getAvailabilityInfo(bookedRanges)

  return (
    <div className="group bg-white dark:bg-[#1a1d2e] rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800
                    overflow-hidden transition-all duration-300
                    hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]
                    hover:-translate-y-1 active:translate-y-0">
      {/* Image Section */}
      <div className="relative aspect-[3/2] bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {car.primary_image ? (
          <img
            src={car.primary_image}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Settings2 className="w-7 h-7 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Hover overlay with Book Now — desktop only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent
                        opacity-0 group-hover:opacity-100 transition-all duration-300
                        hidden sm:flex items-end justify-center pb-5">
          <Link
            to={`/cars/${car.id}`}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white
                       text-sm font-semibold rounded-xl transition-all duration-200
                       shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50
                       active:scale-95 transform translate-y-2 group-hover:translate-y-0"
          >
            {user ? 'Book Now' : 'View Details'}
          </Link>
        </div>

        {/* Transmission badge (top-left) */}
        <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm
                         text-[9px] sm:text-[11px] font-semibold text-gray-700 dark:text-gray-200
                         px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg capitalize shadow-sm">
          {car.transmission}
        </span>

        {/* Availability badge (top-right) */}
        <span className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 flex items-center gap-1 sm:gap-1.5
                          text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1
                          rounded-md sm:rounded-lg backdrop-blur-sm shadow-sm ${avail.bg} ${avail.color}`}>
          <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${avail.dot} ${avail.label === 'Pending' ? 'animate-pulse' : ''}`} />
          {avail.label}
        </span>
      </div>

      {/* Info Section */}
      <div className="p-2.5 sm:p-4">
        {/* Name & model */}
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-xs sm:text-[15px] leading-tight">
          {car.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          {car.brand} {car.model} · {car.year}
        </p>

        {/* Specs row — hidden on mobile, shown on sm+ */}
        <div className="hidden sm:flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1 shrink-0 capitalize">
            <Gauge size={13} className="text-brand-400" />
            {car.transmission}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Users size={13} className="text-brand-400" />
            {car.seats} Seats
          </span>
          <span className="flex items-center gap-1 shrink-0 capitalize">
            <Fuel size={13} className="text-brand-400" />
            {car.fuel_type}
          </span>
        </div>

        {/* Mobile specs — compact icon row */}
        <div className="flex sm:hidden items-center gap-2 mt-1.5 text-[9px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-0.5">
            <Users size={10} className="text-brand-400" />
            {car.seats}
          </span>
          <span className="flex items-center gap-0.5 capitalize">
            <Fuel size={10} className="text-brand-400" />
            {car.fuel_type}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <span className="text-[13px] sm:text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(car.price_per_day)}
            </span>
            <span className="text-[8px] sm:text-xs text-gray-400 dark:text-gray-500">/day</span>
          </div>

          {/* Mobile: always-visible compact button */}
          <Link
            to={`/cars/${car.id}`}
            className="sm:hidden px-2.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white
                       text-[10px] font-semibold rounded-lg transition-all duration-200
                       shadow-sm active:scale-95"
          >
            {user ? 'Book' : 'View'}
          </Link>

          {/* Desktop: location hint (button is on hover overlay) */}
          {car.location && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
              <MapPin size={12} className="text-brand-400 shrink-0" />
              <span className="truncate">{car.location.split(',')[0]}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}