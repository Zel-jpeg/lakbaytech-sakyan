import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCars } from '@/hooks/useCars'
import CarCard from '@/components/cars/CarCard'
import CarSkeleton from '@/components/cars/CarSkeleton'
import CarFilters from '@/components/cars/CarFilters'
import { useDebounce } from '@/hooks/useDebounce'
import { SlidersHorizontal, X, Car, Search } from 'lucide-react'

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

  // Initialise filters from URL params
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

  // Sync to URL
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Cars</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isLoading ? 'Loading…' : `${cars.length} car${cars.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Top bar: search + sort + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search brand, model, location…"
            className="input-modern pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="select-modern w-auto sm:w-48"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                      border transition-all duration-200 ${
            showFilters || activeFilterCount > 0
              ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600'
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-brand-600 text-[10px]
                             font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-6">

        {/* Filters sidebar */}
        {showFilters && (
          <aside className="w-60 shrink-0 hidden sm:block">
            <div className="card p-5 sticky top-20">
              <CarFilters filters={filters} onChange={setFilters} onClear={clearFilters} />
            </div>
          </aside>
        )}

        {/* Mobile filters overlay */}
        {showFilters && (
          <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setShowFilters(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 p-6 overflow-y-auto shadow-xl"
                 onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <CarFilters filters={filters} onChange={setFilters} onClear={clearFilters} />
            </div>
          </div>
        )}

        {/* Cars grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => <CarSkeleton key={i} />)}
            </div>
          ) : cars.length === 0 ? (
            <div className="card py-20 text-center">
              <Car size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="font-medium text-gray-700 dark:text-gray-300">No cars found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-4">
                Try adjusting your filters or search term.
              </p>
              <button onClick={clearFilters}
                      className="flex items-center gap-1.5 mx-auto px-4 py-2 text-sm text-brand-600 dark:text-brand-400
                                 border border-brand-200 dark:border-brand-800 rounded-xl
                                 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition">
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