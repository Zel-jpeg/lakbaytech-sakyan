import { Link } from 'react-router-dom'
import { Plus, ToggleLeft, ToggleRight, Pencil, MapPin, Car } from 'lucide-react'
import { useMyPartnerCars, useToggleCarAvailability } from '@/hooks/useCars'
import { formatCurrency } from '@/utils/formatters'

function CarStatusBadge({ isAvailable }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      isAvailable 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    }`}>
      {isAvailable ? 'Available' : 'Unavailable'}
    </span>
  )
}

export default function MyCarsPage() {
  const { data, isLoading } = useMyPartnerCars()
  const toggleMutation = useToggleCarAvailability()

  const cars = data?.results || data || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Cars</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{cars.length} car{cars.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link
          to="/dashboard/cars/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700
                     text-white text-sm font-semibold rounded-xl transition"
        >
          <Plus size={16} />
          Add Car
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse h-56" />
          ))}
        </div>
      )}

      {!isLoading && cars.length === 0 && (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-16 text-center">
          <Car size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="font-medium text-gray-700 dark:text-gray-300">No cars listed yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">Add your first car to start getting bookings.</p>
          <Link
            to="/dashboard/cars/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white
                       text-sm font-semibold rounded-xl hover:bg-brand-700 transition"
          >
            <Plus size={16} />
            Add your first car
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cars.map((car) => (
          <div key={car.id} className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md dark:hover:shadow-dark-card transition duration-300 flex flex-col">
            <Link to={`/cars/${car.id}`} className="block group flex-1">
              {/* Car image */}
              <div className="h-40 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                {car.primary_image ? (
                  <img src={car.primary_image} alt={car.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car size={36} className="text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <CarStatusBadge isAvailable={car.is_available} />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 pb-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{car.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{car.brand} · {car.year}</p>
                {car.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <MapPin size={11} />
                    {car.location}
                  </div>
                )}
                <p className="text-brand-600 dark:text-brand-400 font-bold mt-2">{formatCurrency(car.price_per_day)}<span className="text-xs text-gray-400 dark:text-gray-500 font-normal">/day</span></p>
              </div>
            </Link>

            {/* Actions */}
            <div className="p-4 pt-3 mt-auto">
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                <button
                  onClick={() => toggleMutation.mutate(car.id)}
                  disabled={toggleMutation.isPending}
                  className="flex items-center gap-1.5 flex-1 justify-center py-2 border border-gray-200 dark:border-gray-700
                             rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600 transition"
                >
                  {car.is_available
                    ? <><ToggleRight size={15} className="text-green-500" />Deactivate</>
                    : <><ToggleLeft size={15} className="text-gray-400 dark:text-gray-500" />Activate</>
                  }
                </button>
                <Link
                  to={`/dashboard/cars/${car.id}/edit`}
                  className="flex items-center gap-1.5 flex-1 justify-center py-2 border border-gray-200 dark:border-gray-700
                             rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-brand-300 dark:hover:border-brand-600 transition"
                >
                  <Pencil size={13} />
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}