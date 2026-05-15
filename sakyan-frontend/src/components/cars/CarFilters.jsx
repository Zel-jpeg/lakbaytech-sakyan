import { useState, useEffect } from 'react'
import { Search, X, MapPin, Building2, User, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/axios'

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

// ─── Partner Filter Section ────────────────────────────────────────────────────
function PartnerFilter({ value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data: partners = [] } = useQuery({
    queryKey: ['approved-partners'],
    queryFn: () => api.get('/partners/approved/').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const filtered = (partners?.results || partners || []).filter(p =>
    !search || p.business_name.toLowerCase().includes(search.toLowerCase())
  )

  // Top 5 by car_count for pills
  const topPartners = [...(partners?.results || partners || [])]
    .sort((a, b) => (b.car_count || 0) - (a.car_count || 0))
    .slice(0, 5)

  const selectedPartner = (partners?.results || partners || []).find(p => p.id === value)

  return (
    <div>
      {/* Quick pills — top 5 */}
      {topPartners.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => onChange('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              !value ? 'bg-brand-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {topPartners.map(p => (
            <button
              key={p.id}
              onClick={() => onChange(p.id === value ? '' : p.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                value === p.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {p.partner_type === 'company'
                ? <Building2 size={10} />
                : <User size={10} />}
              {p.business_name.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      )}

      {/* Searchable dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 dark:border-gray-700
                     rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                     hover:border-brand-300 dark:hover:border-brand-600 transition"
        >
          <span className={selectedPartner ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}>
            {selectedPartner ? selectedPartner.business_name : 'Search all companies…'}
          </span>
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                          rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search rental company…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200
                             dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <button
                onClick={() => { onChange(''); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2
                  ${!value ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                All Companies
              </button>
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onChange(value === p.id ? '' : p.id); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2
                    ${value === p.id ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {p.partner_type === 'company'
                    ? <Building2 size={12} className="text-gray-400 shrink-0" />
                    : <User size={12} className="text-gray-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.business_name}</p>
                    <p className="text-xs text-gray-400">{p.car_count} car{p.car_count !== 1 ? 's' : ''} available</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-xs text-gray-400 text-center">No companies found</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clear selected */}
      {value && selectedPartner && (
        <button
          onClick={() => onChange('')}
          className="mt-1.5 flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 transition"
        >
          <X size={11} /> Clear: {selectedPartner.business_name}
        </button>
      )}
    </div>
  )
}

export default function CarFilters({ filters, onChange, onClear }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== undefined)

  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="space-y-5">
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

      {/* Rental Company */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Rental Company
        </label>
        <PartnerFilter
          value={filters.partner_id || ''}
          onChange={v => set('partner_id', v)}
        />
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