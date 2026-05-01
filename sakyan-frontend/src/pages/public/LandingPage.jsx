import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCars } from '@/hooks/useCars'
import CarCard from '@/components/cars/CarCard'
import CarSkeleton from '@/components/cars/CarSkeleton'
import CarFilters from '@/components/cars/CarFilters'
import { useDebounce } from '@/hooks/useDebounce'
import { SlidersHorizontal, X, Car } from 'lucide-react'

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'price_per_day', label: 'Price: Low to High' },
  { value: '-price_per_day', label: 'Price: High to Low' },
  { value: '-year', label: 'Newest model' },
]

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState('-created_at')

  // Initialise filters from URL params (supports deep linking from hero search/chips)
  const [filters, setFilters] = useState({
    location:     searchParams.get('location') || '',
    search:       searchParams.get('search')   || '',
    min_price:    '',
    max_price:    '',
    transmission: '',
    fuel_type:    '',
    seats:        '',
  })

  const debouncedFilters = useDebounce(filters, 350)
  const { data, isLoading } = useCars({ ...debouncedFilters, ordering: sort })
  const cars = data?.results || data || []

  // Sync location/search into URL so it's shareable
  useEffect(() => {
    const params = {}
    if (filters.location) params.location = filters.location
    if (filters.search)   params.search   = filters.search
    setSearchParams(params, { replace: true })
  }, [filters.location, filters.search])

  const clearFilters = () => setFilters({
    location: '', search: '', min_price: '', max_price: '',
    transmission: '', fuel_type: '', seats: '',
  })

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Cars</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isLoading ? 'Loading…' : `${cars.length} car${cars.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Top bar: search + sort + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search brand, model, location…"
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                      border transition ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-blue-600 text-[10px]
                             font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">

        {/* Filters sidebar — desktop always visible, mobile toggle */}
        {showFilters && (
          <aside className="w-60 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
              <CarFilters filters={filters} onChange={setFilters} onClear={clearFilters} />
            </div>
          </aside>
        )}

        {/* Cars grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => <CarSkeleton key={i} />)}
            </div>
          ) : cars.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
              <Car size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">No cars found</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Try adjusting your filters or search term.
              </p>
              <button onClick={clearFilters}
                      className="flex items-center gap-1.5 mx-auto px-4 py-2 text-sm text-blue-600
                                 border border-blue-200 rounded-xl hover:bg-blue-50 transition">
                <X size={14} />
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cars.map(car => <CarCard key={car.id} car={car} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}