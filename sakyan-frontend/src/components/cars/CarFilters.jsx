import { Search, X, MapPin, ChevronDown } from 'lucide-react'

const TRANSMISSION_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'manual', label: 'Manual' },
]

const FUEL_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
]

const SEAT_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '2', label: '2+ Seats' },
  { value: '4', label: '4+ Seats' },
  { value: '5', label: '5+ Seats' },
  { value: '7', label: '7+ Seats' },
]

// ─── Pill toggle for filter options ───────────────────────────────────────────
function FilterPills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            value === o.value
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function CarFilters({ filters, onChange, onClear }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== undefined)

  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Filters</p>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400
                       hover:text-brand-700 dark:hover:text-brand-300 font-medium transition"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={filters.location || ''}
            onChange={e => set('location', e.target.value)}
            placeholder="City or area…"
            className="input-modern pl-9 text-sm"
          />
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Price per Day (₱)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.min_price || ''}
            onChange={e => set('min_price', e.target.value)}
            placeholder="Min"
            className="input-modern text-sm"
          />
          <span className="text-gray-300 dark:text-gray-600 text-sm shrink-0">—</span>
          <input
            type="number"
            value={filters.max_price || ''}
            onChange={e => set('max_price', e.target.value)}
            placeholder="Max"
            className="input-modern text-sm"
          />
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Transmission</label>
        <FilterPills
          options={TRANSMISSION_OPTIONS}
          value={filters.transmission || ''}
          onChange={v => set('transmission', v)}
        />
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Fuel Type</label>
        <FilterPills
          options={FUEL_OPTIONS}
          value={filters.fuel_type || ''}
          onChange={v => set('fuel_type', v)}
        />
      </div>

      {/* Minimum Seats */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Minimum Seats</label>
        <FilterPills
          options={SEAT_OPTIONS}
          value={filters.seats || ''}
          onChange={v => set('seats', v)}
        />
      </div>

      {/* Year */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Year</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.min_year || ''}
            onChange={e => set('min_year', e.target.value)}
            placeholder="From"
            className="input-modern text-sm"
          />
          <span className="text-gray-300 dark:text-gray-600 text-sm shrink-0">—</span>
          <input
            type="number"
            value={filters.max_year || ''}
            onChange={e => set('max_year', e.target.value)}
            placeholder="To"
            className="input-modern text-sm"
          />
        </div>
      </div>

      {/* Brand search */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Brand</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={filters.brand || ''}
            onChange={e => set('brand', e.target.value)}
            placeholder="e.g. Toyota, Honda…"
            className="input-modern pl-9 text-sm"
          />
        </div>
      </div>
    </div>
  )
}