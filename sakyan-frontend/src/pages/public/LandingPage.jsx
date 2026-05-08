import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, ArrowRight, Shield, Clock, Car, Star,
  ChevronRight, Users, CheckCircle2, Zap, HeartHandshake, TrendingUp,
  Phone, Monitor, SlidersHorizontal, Fuel, Settings2, Calendar,
} from 'lucide-react'
import { useCars } from '@/hooks/useCars'
import { usePublicStats } from '@/hooks/usePublicStats'
import CarCard from '@/components/cars/CarCard'
import CarSkeleton from '@/components/cars/CarSkeleton'
import { formatCurrency } from '@/utils/formatters'

const POPULAR_LOCATIONS = ['Cebu City', 'Manila', 'Davao', 'Iloilo', 'Baguio']

/* ── Animated counter hook ── */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => { started.current = false; setCount(0) }, [end])

  useEffect(() => {
    if (!end) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return [count, ref]
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD MOCKUP — Theme-aware (light/dark) + responsive
   ════════════════════════════════════════════════════════════════════════════ */
function DashboardMockup({ cars }) {
  const displayCars = cars.slice(0, 3)

  return (
    <div className="relative mx-auto max-w-4xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
      {/* Glow behind */}
      <div className="absolute -inset-6 sm:-inset-10 bg-gradient-to-t from-brand-500/20 via-brand-500/5 to-transparent
                      rounded-3xl blur-2xl pointer-events-none" />

      {/* Browser window — THEME AWARE */}
      <div className="relative bg-white dark:bg-[#1a1d2e] rounded-t-xl sm:rounded-t-2xl
                      border border-gray-200 dark:border-gray-800/80
                      shadow-2xl overflow-hidden">

        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3
                        border-b border-gray-100 dark:border-gray-700/50
                        bg-gray-50 dark:bg-transparent">
          <div className="flex gap-1.5 sm:gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 mx-2 sm:mx-4">
            <div className="bg-gray-100 dark:bg-[#0f1117] rounded-md sm:rounded-lg px-3 py-1 sm:py-1.5
                            flex items-center gap-2 max-w-xs sm:max-w-md mx-auto">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
              <span className="text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium select-none">
                sakyan.app/cars
              </span>
            </div>
          </div>
        </div>

        {/* App content area */}
        <div className="flex" style={{ minHeight: '280px' }}>
          {/* Sidebar — hidden on mobile */}
          <div className="w-[180px] bg-gray-50 dark:bg-[#141724]
                          border-r border-gray-100 dark:border-gray-800/50
                          p-3 sm:p-4 flex-col gap-2.5 sm:gap-3 shrink-0
                          hidden md:flex">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-brand-500/15 dark:bg-brand-500/20 flex items-center justify-center">
                <Car size={14} className="text-brand-500 dark:text-brand-400" />
              </div>
              <span className="text-xs font-bold text-gray-800 dark:text-white tracking-tight">Sakyan</span>
            </div>

            {/* Nav items */}
            {[
              { label: 'Browse Cars', active: true },
              { label: 'My Bookings' },
              { label: 'Messages' },
              { label: 'Notifications' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium
                ${item.active
                  ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20'
                  : 'text-gray-400 dark:text-gray-500'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-brand-500 dark:bg-brand-400' : 'bg-gray-300 dark:bg-gray-700'}`} />
                {item.label}
              </div>
            ))}

            <div className="mt-auto">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-600 text-[10px] px-2.5 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                Settings
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-3 sm:p-5 overflow-hidden bg-gray-50/50 dark:bg-transparent">
            {/* Page header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-white">Browse Cars</h3>
                <p className="text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {displayCars.length > 0 ? `${displayCars.length} cars available` : 'Loading cars…'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-[8px] sm:text-[9px]">🔔</span>
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center">
                  <span className="text-[8px] sm:text-[9px] text-brand-600 dark:text-brand-400 font-bold">JS</span>
                </div>
              </div>
            </div>

            {/* Search + filter bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="flex-1 h-7 sm:h-8 rounded-md sm:rounded-lg
                              bg-white dark:bg-[#0f1117]
                              border border-gray-200 dark:border-gray-800
                              flex items-center px-2 sm:px-3">
                <Search size={10} className="text-gray-300 dark:text-gray-600 shrink-0" />
                <span className="text-[8px] sm:text-[10px] text-gray-300 dark:text-gray-600 ml-1.5 truncate">
                  Search brand, model, location…
                </span>
              </div>
              <div className="h-7 sm:h-8 rounded-md sm:rounded-lg
                              bg-white dark:bg-[#0f1117]
                              border border-gray-200 dark:border-gray-800
                              items-center px-2 sm:px-3 shrink-0 hidden sm:flex">
                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">Newest first</span>
              </div>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-md sm:rounded-lg
                              bg-white dark:bg-[#0f1117]
                              border border-gray-200 dark:border-gray-800
                              flex items-center justify-center shrink-0">
                <SlidersHorizontal size={10} className="text-gray-400 dark:text-gray-600" />
              </div>
            </div>

            {/* Car cards grid — responsive: 2 cols on mobile, 3 on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {displayCars.length > 0 ? displayCars.map((car, i) => (
                <div key={i} className={`bg-white dark:bg-[#1e2235] rounded-lg sm:rounded-xl
                              border border-gray-100 dark:border-gray-700/50
                              overflow-hidden group transition-all
                              hover:border-brand-200 dark:hover:border-brand-500/30
                              ${i === 2 ? 'hidden sm:block' : ''}`}>
                  {/* Image */}
                  <div className="h-[60px] sm:h-[90px] bg-gray-100 dark:bg-[#141724] overflow-hidden relative">
                    {car.primary_image ? (
                      <img src={car.primary_image} alt="" className="w-full h-full object-cover
                               group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car size={18} className="text-gray-300 dark:text-gray-700" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 bg-white/80 dark:bg-black/60 backdrop-blur-sm
                                     text-[6px] sm:text-[8px] font-semibold
                                     text-gray-700 dark:text-gray-200 px-1 sm:px-1.5 py-0.5 rounded capitalize">
                      {car.transmission || 'automatic'}
                    </span>
                    <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 sm:gap-1
                                     text-[6px] sm:text-[7px] font-bold
                                     bg-green-50 dark:bg-green-900/40
                                     text-green-700 dark:text-green-400
                                     px-1 sm:px-1.5 py-0.5 rounded backdrop-blur-sm">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500" />
                      <span className="hidden sm:inline">Available</span>
                    </span>
                  </div>
                  {/* Info */}
                  <div className="p-2 sm:p-3">
                    <p className="text-[9px] sm:text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {car.name}
                    </p>
                    <p className="text-[7px] sm:text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {car.brand} {car.model} · {car.year}
                    </p>
                    {/* Specs — hidden below sm */}
                    <div className="hidden sm:flex items-center gap-2 mt-2 text-[8px] text-gray-400 dark:text-gray-500">
                      {car.location && (
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin size={8} className="text-brand-400 shrink-0" />
                          {car.location.split(',')[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 shrink-0">
                        <Users size={8} className="text-brand-400" />{car.seats}
                      </span>
                      <span className="flex items-center gap-0.5 shrink-0 capitalize">
                        <Fuel size={8} className="text-brand-400" />{car.fuel_type}
                      </span>
                    </div>
                    {/* Price row */}
                    <div className="flex items-center justify-between mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2
                                    border-t border-gray-100 dark:border-gray-700/50">
                      <div>
                        <span className="text-[9px] sm:text-[11px] font-bold text-brand-500 dark:text-brand-400">
                          {formatCurrency(car.price_per_day)}
                        </span>
                        <span className="text-[6px] sm:text-[8px] text-gray-400 dark:text-gray-600">/day</span>
                      </div>
                      <div className="bg-brand-500 rounded text-[6px] sm:text-[8px] text-white font-semibold
                                      px-1.5 sm:px-2.5 py-0.5 sm:py-1">
                        View
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                [...Array(3)].map((_, i) => (
                  <div key={i} className={`bg-white dark:bg-[#1e2235] rounded-lg sm:rounded-xl
                                border border-gray-100 dark:border-gray-700/50 overflow-hidden
                                ${i === 2 ? 'hidden sm:block' : ''}`}>
                    <div className="h-[60px] sm:h-[90px] shimmer" />
                    <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                      <div className="h-2.5 sm:h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded shimmer" />
                      <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded shimmer" />
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded shimmer mt-2 sm:mt-3" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="h-12 sm:h-20 bg-gradient-to-b from-white dark:from-[#1a1d2e] to-transparent
                      rounded-b-xl sm:rounded-b-2xl -mt-1 relative z-10
                      border-x border-gray-200 dark:border-gray-800/80
                      border-b-0" />
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { data, isLoading } = useCars({ ordering: '-created_at' })
  const featuredCars = (data?.results || data || []).slice(0, 6)
  const { data: stats } = usePublicStats()

  const [usersCount, usersRef] = useCounter(stats?.total_users || 0, 1800)
  const [carsCount, carsRef] = useCounter(stats?.available_cars || 0, 1800)
  const [citiesCount, citiesRef] = useCounter(stats?.cities || 0, 1800)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/cars?search=${encodeURIComponent(searchQuery.trim())}`)
    else navigate('/cars')
  }

  const handleLocationClick = (loc) => navigate(`/cars?location=${encodeURIComponent(loc)}`)

  return (
    <div className="overflow-hidden">

      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative pb-6 sm:pb-10">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-gray-100/50 to-white
                        dark:from-[#0f1117] dark:via-[#0f1117] dark:to-[#0f1117]" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
               style={{
                 backgroundImage: `linear-gradient(rgba(79,107,246,0.3) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(79,107,246,0.3) 1px, transparent 1px)`,
                 backgroundSize: '60px 60px',
               }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px]
                          bg-gradient-to-b from-brand-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 -left-40 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px]
                          bg-gradient-to-br from-blue-500/8 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 lg:pt-24">

          {/* ─── Centered hero text ─── */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 lg:mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-500/10 dark:bg-brand-500/15
                            text-brand-600 dark:text-brand-400 text-[11px] sm:text-xs font-semibold
                            px-3 sm:px-4 py-1.5 sm:py-2 rounded-full
                            border border-brand-200/50 dark:border-brand-700/40
                            shadow-sm mb-6 sm:mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              {stats ? `Trusted by ${stats.total_users}+ renters` : 'Trusted car rental platform'}
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white
                           leading-[1.1] tracking-tight mb-4 sm:mb-6 animate-slide-up px-2">
              The Smartest Way to{' '}
              <span className="relative inline-block">
                <span className="text-gradient">Rent a Car</span>
                <svg className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M2 6C50 2 150 2 198 6" stroke="url(#ug)" strokeWidth="3" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ug" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#4F6BF6" /><stop offset="1" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto
                          leading-relaxed mb-6 sm:mb-8 animate-slide-up px-4" style={{ animationDelay: '0.1s' }}>
              Rent from trusted local partners across the Philippines.
              Affordable, convenient, and tailored for the Filipino lifestyle.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-3 animate-slide-up"
                 style={{ animationDelay: '0.15s' }}>
              <Link to="/cars"
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-brand-500 hover:bg-brand-600
                           text-white px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold
                           transition-all shadow-lg shadow-brand-500/25 active:scale-[0.97]">
                Browse Cars <ArrowRight size={15} />
              </Link>
              <Link to="/onboarding/step1"
                className="inline-flex items-center gap-2 bg-white dark:bg-white/10
                           text-gray-700 dark:text-white
                           border border-gray-200 dark:border-gray-700
                           px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold
                           hover:bg-gray-50 dark:hover:bg-white/15 transition-all">
                List Your Car
              </Link>
            </div>
          </div>

          {/* ─── Dashboard Mockup ─── */}
          <DashboardMockup cars={featuredCars} />
        </div>
      </section>

      {/* ══════════ STATS BAR ══════════ */}
      <section className="relative py-8 sm:py-12 bg-white dark:bg-[#0f1117]
                          border-t border-gray-100 dark:border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {[
              { value: usersCount, suffix: '+', label: 'Users', fullLabel: 'Registered Users', icon: Users, ref: usersRef },
              { value: carsCount, suffix: '', label: 'Cars', fullLabel: 'Cars Available', icon: Car, ref: carsRef },
              { value: citiesCount, suffix: '', label: 'Cities', fullLabel: 'Cities Covered', icon: MapPin, ref: citiesRef },
            ].map(({ value, suffix, label, fullLabel, icon: Icon, ref }, i) => (
              <div key={i} ref={ref} className="text-center group">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl
                                  bg-brand-50 dark:bg-brand-900/20
                                  flex items-center justify-center
                                  group-hover:scale-110 transition-transform">
                    <Icon size={16} className="sm:hidden text-brand-500 dark:text-brand-400" />
                    <Icon size={20} className="hidden sm:block text-brand-500 dark:text-brand-400" />
                  </div>
                  <span className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                    {value}{suffix}
                  </span>
                </div>
                <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <span className="sm:hidden">{label}</span>
                  <span className="hidden sm:inline">{fullLabel}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURED CARS ══════════ */}
      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-brand-500 dark:text-brand-400
                               tracking-widest uppercase mb-1 sm:mb-2 block">
                Browse Fleet
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Featured Cars
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 max-w-md">
                Handpicked rides from our verified partners
              </p>
            </div>
            <Link to="/cars"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold
                         text-brand-600 dark:text-brand-400
                         bg-brand-50 dark:bg-brand-900/20 px-4 py-2 rounded-xl
                         hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all group">
              View all cars
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => <CarSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredCars.map(car => <CarCard key={car.id} car={car} />)}
            </div>
          )}

          {!isLoading && featuredCars.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <Car size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="font-medium text-gray-700 dark:text-gray-300">No cars available yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon!</p>
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link to="/cars"
              className="inline-flex items-center gap-1.5 text-sm font-semibold
                         text-brand-600 dark:text-brand-400
                         bg-brand-50 dark:bg-brand-900/20 px-5 py-2.5 rounded-xl transition-all">
              View all cars <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-12 sm:py-20 bg-white dark:bg-[#0f1117] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/5 dark:bg-brand-500/10
                        rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-8 sm:mb-14">
            <span className="text-[10px] sm:text-xs font-bold text-brand-500 dark:text-brand-400
                             tracking-widest uppercase mb-1 sm:mb-2 block">
              How It Works
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Three Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2 max-w-lg mx-auto">
              Getting on the road has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 relative">
            <div className="hidden sm:block absolute top-[72px] left-[16.67%] right-[16.67%] h-[2px]
                            bg-gradient-to-r from-brand-200 via-green-200 to-amber-200
                            dark:from-brand-800 dark:via-green-800 dark:to-amber-800" />

            {[
              { icon: Search, title: 'Browse & Select',
                desc: 'Explore our curated selection of cars from verified local partners.',
                color: 'from-brand-500 to-blue-500',
                bgLight: 'bg-brand-50', bgDark: 'dark:bg-brand-900/20' },
              { icon: Clock, title: 'Book Instantly',
                desc: 'Choose your dates, pay via GCash or cash, and get confirmed.',
                color: 'from-green-500 to-emerald-500',
                bgLight: 'bg-green-50', bgDark: 'dark:bg-green-900/20' },
              { icon: Car, title: 'Hit the Road',
                desc: 'Pick up your car and enjoy the ride. We handle the rest.',
                color: 'from-orange-500 to-amber-500',
                bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20' },
            ].map(({ icon: Icon, title, desc, color, bgLight, bgDark }, i) => (
              <div key={i} className="relative group">
                <div className="card p-5 sm:p-8 text-center hover:shadow-card-hover dark:hover:shadow-dark-card-hover
                                hover:-translate-y-1 transition-all duration-300 h-full">
                  <div className="relative z-10 mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl
                                    bg-gradient-to-br ${color}
                                    flex items-center justify-center shadow-lg
                                    group-hover:scale-110 group-hover:shadow-glow transition-all duration-300`}>
                      <Icon size={22} className="sm:hidden text-white" />
                      <Icon size={28} className="hidden sm:block text-white" />
                    </div>
                    <div className={`absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2
                                    w-5 h-5 sm:w-7 sm:h-7 rounded-full
                                    ${bgLight} ${bgDark} border-2 border-white dark:border-gray-800
                                    flex items-center justify-center
                                    text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm`}>
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ WHY CHOOSE SAKYAN ══════════ */}
      <section className="py-12 sm:py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-brand-500 dark:text-brand-400
                               tracking-widest uppercase mb-1 sm:mb-2 block">
                Why Choose Us
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                What Makes Sakyan Different
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 max-w-md leading-relaxed">
                We&apos;re not just another rental platform. Here&apos;s why Filipinos trust Sakyan.
              </p>

              <div className="space-y-3 sm:space-y-5">
                {[
                  { icon: Shield, title: 'Verified Partners', desc: 'Every partner is KYC-checked with valid documents.', color: 'text-brand-500 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/30' },
                  { icon: Star, title: 'Quality Assured', desc: 'Each vehicle meets strict standards for safety.', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
                  { icon: Zap, title: 'Instant Booking', desc: 'Book and get instant confirmation with real-time availability.', color: 'text-green-500 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
                  { icon: HeartHandshake, title: 'Local Support', desc: 'Filipino-first with GCash support and local service.', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
                ].map(({ icon: Icon, title, desc, color, bg }, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl
                                          hover:bg-white dark:hover:bg-gray-800/30 transition-colors group">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl ${bg}
                                    flex items-center justify-center shrink-0
                                    group-hover:scale-110 transition-transform`}>
                      <Icon size={18} className={`sm:hidden ${color}`} />
                      <Icon size={22} className={`hidden sm:block ${color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5 sm:mb-1">{title}</h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual cards */}
            <div className="relative hidden lg:block">
              <div className="relative bg-gradient-to-br from-brand-500/10 to-blue-500/10
                              dark:from-brand-500/5 dark:to-blue-500/5 rounded-3xl p-8 sm:p-10">
                <div className="space-y-4">
                  {[
                    { icon: Monitor, label: 'Web Platform', desc: 'Browse & book from any device', pct: '85%', color: 'from-brand-500 to-blue-400', iconBg: 'bg-brand-100 dark:bg-brand-900/40' },
                    { icon: Phone, label: 'Mobile Ready', desc: 'Optimized for on-the-go booking', pct: '92%', color: 'from-green-500 to-emerald-400', iconBg: 'bg-green-100 dark:bg-green-900/40' },
                    { icon: TrendingUp, label: 'Growing Network', desc: 'Expanding across the Philippines', pct: '78%', color: 'from-amber-500 to-orange-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
                  ].map(({ icon: Icon, label, desc, pct, color, iconBg }, i) => (
                    <div key={i} className={`bg-white dark:bg-gray-800 rounded-2xl p-5
                                  shadow-card dark:shadow-dark-card
                                  border border-gray-100 dark:border-gray-700
                                  transform ${i === 0 ? 'rotate-1' : i === 1 ? '-rotate-1' : 'rotate-[0.5deg]'}
                                  hover:rotate-0 transition-transform`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                          <Icon size={18} className={`${i === 0 ? 'text-brand-500' : i === 1 ? 'text-green-500' : 'text-amber-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: pct }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ PARTNER CTA ══════════ */}
      <section className="py-12 sm:py-20 bg-white dark:bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl
                          bg-gradient-to-br from-brand-500 via-brand-600 to-blue-600
                          p-6 sm:p-10 lg:p-16">
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full
                            -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-white/10 rounded-full
                            translate-y-1/2 -translate-x-1/3" />
            <div className="absolute inset-0 opacity-10"
                 style={{
                   backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                   backgroundSize: '24px 24px',
                 }} />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm
                              text-white/90 text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5
                              rounded-full mb-4 sm:mb-6">
                <Car size={12} /> For Car Owners
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                Got a car? Start earning today
              </h2>
              <p className="text-blue-100 max-w-md mx-auto mb-6 sm:mb-8 text-xs sm:text-sm lg:text-base leading-relaxed">
                Join our platform as a partner and turn your idle vehicle into income.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
                <Link to="/onboarding/step1"
                  className="inline-flex items-center gap-2 bg-white text-brand-600
                             px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm
                             hover:bg-gray-100 transition-all shadow-lg active:scale-95 w-full sm:w-auto justify-center">
                  Become a Partner <ArrowRight size={15} />
                </Link>
                <Link to="/cars"
                  className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white
                             border border-white/20
                             px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm
                             hover:bg-white/20 transition-all w-full sm:w-auto justify-center">
                  Browse Cars Instead
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}