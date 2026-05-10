import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCars } from '@/hooks/useCars'
import CarCard from '@/components/cars/CarCard'
import CarSkeleton from '@/components/cars/CarSkeleton'
import CarFilters from '@/components/cars/CarFilters'
import { useDebounce } from '@/hooks/useDebounce'
import { SlidersHorizontal, X, Car, Search, ArrowUpDown, LayoutGrid } from 'lucide-react'

const SORT_OPTIONS = [
  { value: '-created_at',    label: 'Newest First' },
  { value: 'price_per_day',  label: 'Price: Low → High' },
  { value: '-price_per_day', label: 'Price: High → Low' },
  { value: '-year',          label: 'Newest Model' },
]

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState('-created_at')

  const [filters, setFilters] = useState({
    location:     searchParams.get('location') || '',
    search:       searchParams.get('search')   || '',
    min_price:    '',
    max_price:    '',
    transmission: '',
    fuel_type:    '',
    seats:        '',
    min_year:     '',
    max_year:     '',
    brand:        '',
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
    min_year: '', max_year: '', brand: '',
  })

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Car Catalogue</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Explore cars you might like!
        </p>
      </div>

      {/* Top bar: search + sort + filter toggle */}
      <div className="space-y-3 mb-5">
        {/* Search — full width */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search brand, model, location…"
            className="input-modern pl-10"
          />
        </div>

        {/* Sort + Filter — inline */}
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="select-modern pl-8 w-full sm:w-48 text-xs sm:text-sm"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold
                        border transition-all duration-200 shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-[#1a1d2e] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-brand-600 text-[9px] sm:text-[10px]
                               font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isLoading ? 'Loading…' : (
            <>
              <span className="font-semibold text-gray-900 dark:text-white">{cars.length}</span>
              {' '}car{cars.length !== 1 ? 's' : ''} available
            </>
          )}
        </p>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition"
          >
            <X size={12} />
            Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-6">

        {/* Desktop sidebar filters */}
        {showFilters && (
          <aside className="w-64 shrink-0 hidden sm:block">
            <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sticky top-20">
              <CarFilters filters={filters} onChange={setFilters} onClear={clearFilters} />
            </div>
          </aside>
        )}

        {/* Mobile filters drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setShowFilters(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
              className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto
                         animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-brand-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Filters</h3>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              {/* Drawer body */}
              <div className="p-5">
                <CarFilters filters={filters} onChange={setFilters} onClear={clearFilters} />
              </div>
              {/* Drawer footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold
                             rounded-xl transition shadow-sm"
                >
                  Show {cars.length} result{cars.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cars grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(9)].map((_, i) => <CarSkeleton key={i} />)}
            </div>
          ) : cars.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Car size={28} className="text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300">No cars found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">
                Try adjusting your filters or search term.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold
                           text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800
                           rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition"
              >
                <X size={14} />
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {cars.map(car => <CarCard key={car.id} car={car} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}