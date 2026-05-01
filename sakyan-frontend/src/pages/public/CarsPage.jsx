import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import { useCars } from '@/hooks/useCars'

function CarCard({ car }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/cars/${car.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
    >
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {car.primary_image ? (
          <img
            src={car.primary_image}
            alt={car.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">🚗</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{car.name}</h3>
        <p className="text-sm text-gray-500">{car.partner_name}</p>
        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
          <MapPin size={13} />
          <span>{car.location}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">
            ₱{Number(car.price_per_day).toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">/ day</span>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {car.transmission && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {car.transmission}
            </span>
          )}
          {car.seats && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {car.seats} seats
            </span>
          )}
          {car.fuel_type && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {car.fuel_type}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterSidebar({ filters, setFilters, onClose }) {
  const transmissions = ['manual', 'automatic']
  const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid']
  const seatOptions = [2, 4, 5, 7, 8]

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAll = () => {
    setFilters({
      search: filters.search,
      location: '',
      min_price: '',
      max_price: '',
      transmission: '',
      fuel_type: '',
      seats: '',
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button
          onClick={clearAll}
          className="text-sm text-blue-600 hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Location */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
        <input
          type="text"
          value={filters.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="e.g. Cebu, Manila"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Price Range */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Price per day (₱)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={filters.min_price}
            onChange={(e) => handleChange('min_price', e.target.value)}
            placeholder="Min"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            value={filters.max_price}
            onChange={(e) => handleChange('max_price', e.target.value)}
            placeholder="Max"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Transmission */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
        <div className="flex gap-2">
          {transmissions.map(t => (
            <button
              key={t}
              onClick={() => handleChange('transmission', filters.transmission === t ? '' : t)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                filters.transmission === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
        <div className="grid grid-cols-2 gap-2">
          {fuelTypes.map(f => (
            <button
              key={f}
              onClick={() => handleChange('fuel_type', filters.fuel_type === f ? '' : f)}
              className={`py-2 rounded-xl text-sm font-medium border transition ${
                filters.fuel_type === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Seats */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">Min Seats</label>
        <div className="flex gap-2 flex-wrap">
          {seatOptions.map(s => (
            <button
              key={s}
              onClick={() => handleChange('seats', filters.seats === String(s) ? '' : String(s))}
              className={`w-10 h-10 rounded-xl text-sm font-medium border transition ${
                filters.seats === String(s)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CarsPage() {
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    location: '',
    min_price: '',
    max_price: '',
    transmission: '',
    fuel_type: '',
    seats: '',
  })

  const { data, isLoading } = useCars(filters)
  const cars = data?.results || []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Browse Cars</h1>
          <p className="text-gray-500 mt-1">
            {isLoading ? 'Loading...' : `${data?.count || 0} cars available`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search by name, brand, location..."
              className="flex-1 outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
            {filters.search && (
              <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-blue-300 transition lg:hidden"
          >
            <SlidersHorizontal size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Filters</span>
          </button>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar — Desktop */}
          <div className="hidden lg:block w-64 shrink-0">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)}>
              <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button onClick={() => setShowFilters(false)}>
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <FilterSidebar filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />
              </div>
            </div>
          )}

          {/* Car Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {cars.map(car => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <span className="text-6xl">🔍</span>
                <p className="mt-4 text-lg font-medium text-gray-700">No cars found</p>
                <p className="text-gray-500 mt-1">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}