import { Search, X } from 'lucide-react'

const TRANSMISSIONS = ['', 'automatic', 'manual']
const FUEL_TYPES    = ['', 'gasoline', 'diesel', 'electric', 'hybrid']
const SEAT_OPTIONS  = ['', '2', '4', '5', '7', '8']

const selectCls = `w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                   bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize`

export default function CarFilters({ filters, onChange, onClear }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== undefined)

  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Filters</p>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Location search */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={filters.location || ''}
            onChange={e => set('location', e.target.value)}
            placeholder="City or area…"
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Price per Day (₱)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.min_price || ''}
            onChange={e => set('min_price', e.target.value)}
            placeholder="Min"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm shrink-0">–</span>
          <input
            type="number"
            value={filters.max_price || ''}
            onChange={e => set('max_price', e.target.value)}
            placeholder="Max"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Transmission</label>
        <select value={filters.transmission || ''} onChange={e => set('transmission', e.target.value)}
                className={selectCls}>
          <option value="">Any</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* Fuel type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Fuel Type</label>
        <select value={filters.fuel_type || ''} onChange={e => set('fuel_type', e.target.value)}
                className={selectCls}>
          <option value="">Any</option>
          <option value="gasoline">Gasoline</option>
          <option value="diesel">Diesel</option>
          <option value="electric">Electric</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Min seats */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Minimum Seats</label>
        <select value={filters.seats || ''} onChange={e => set('seats', e.target.value)}
                className={selectCls}>
          <option value="">Any</option>
          <option value="2">2+</option>
          <option value="4">4+</option>
          <option value="5">5+</option>
          <option value="7">7+</option>
        </select>
      </div>
    </div>
  )
}