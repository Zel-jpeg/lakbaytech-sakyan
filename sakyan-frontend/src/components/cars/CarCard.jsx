import { Link } from 'react-router-dom'
import { MapPin, Users, Fuel, Settings2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'

export default function CarCard({ car }) {
  const { user } = useAuthStore()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden
                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Image */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {car.primary_image ? (
          <img
            src={car.primary_image}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Settings2 size={32} className="text-gray-300" />
          </div>
        )}
        {/* Transmission badge */}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-medium
                         text-gray-700 px-2 py-0.5 rounded-full capitalize">
          {car.transmission}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{car.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{car.brand} {car.model} · {car.year}</p>

        {/* Specs row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {car.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin size={11} className="shrink-0" />
              {car.location}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0">
            <Users size={11} />
            {car.seats}
          </span>
          <span className="flex items-center gap-1 shrink-0 capitalize">
            <Fuel size={11} />
            {car.fuel_type}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(car.price_per_day)}</span>
            <span className="text-xs text-gray-400">/day</span>
          </div>
          <Link
            to={`/cars/${car.id}`}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white
                       text-xs font-semibold rounded-xl transition"
          >
            {user ? 'Book Now' : 'View'}
          </Link>
        </div>
      </div>
    </div>
  )
}