import { Link } from 'react-router-dom'
import { MapPin, Users, Fuel, Settings2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'

export default function CarCard({ car }) {
  const { user } = useAuthStore()

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