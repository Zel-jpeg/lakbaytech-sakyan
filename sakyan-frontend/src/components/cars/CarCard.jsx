import { Link } from 'react-router-dom'
import { MapPin, Users, Fuel, Settings2, Clock } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { useCarBookedDates } from '@/hooks/useCars'

// Derive availability status from booked ranges
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
    <div className="card card-hover overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {car.primary_image ? (
          <img
            src={car.primary_image}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Settings2 size={32} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Transmission badge */}
        <span className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold
                         text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-lg capitalize shadow-sm">
          {car.transmission}
        </span>

        {/* Availability badge */}
        <span className={`absolute top-3 right-3 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg
                          backdrop-blur-sm shadow-sm ${avail.bg} ${avail.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${avail.dot} ${avail.label === 'Pending' ? 'animate-pulse' : ''}`} />
          {avail.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px]">
          {car.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {car.brand} {car.model} · {car.year}
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
          {car.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} className="shrink-0 text-brand-400" />
              {car.location}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            <Users size={12} className="text-brand-400" />
            {car.seats}
          </span>
          <span className="flex items-center gap-1 shrink-0 capitalize">
            <Fuel size={12} className="text-brand-400" />
            {car.fuel_type}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <span className="text-lg font-bold text-brand-500 dark:text-brand-400">
              {formatCurrency(car.price_per_day)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">/day</span>
          </div>
          <Link
            to={`/cars/${car.id}`}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white
                       text-xs font-semibold rounded-xl transition-all duration-200
                       shadow-sm hover:shadow-md active:scale-95"
          >
            {user ? 'Book Now' : 'View'}
          </Link>
        </div>
      </div>
    </div>
  )
}