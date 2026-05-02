import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, ArrowRight, Shield, Clock, Car, Star, Sparkles, ChevronRight } from 'lucide-react'
import { useCars } from '@/hooks/useCars'
import CarCard from '@/components/cars/CarCard'
import CarSkeleton from '@/components/cars/CarSkeleton'

const POPULAR_LOCATIONS = ['Cebu City', 'Manila', 'Davao', 'Iloilo', 'Baguio']

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { data, isLoading } = useCars({ ordering: '-created_at' })
  const featuredCars = (data?.results || data || []).slice(0, 6)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/cars?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/cars')
    }
  }

  const handleLocationClick = (loc) => {
    navigate(`/cars?location=${encodeURIComponent(loc)}`)
  }

  return (
    <div>
      {/* ══════════ HERO SECTION ══════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-blue-500/5
                        dark:from-brand-500/10 dark:via-transparent dark:to-blue-600/10" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30
                            text-brand-600 dark:text-brand-400 text-xs font-semibold
                            px-4 py-1.5 rounded-full border border-brand-100 dark:border-brand-800 animate-fade-in">
              <Sparkles size={14} />
              Trusted by 500+ renters across the Philippines
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white
                           leading-tight tracking-tight animate-slide-up">
              Find Your Perfect
              <span className="text-gradient block sm:inline"> Ride</span>
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed animate-slide-up">
              Rent from trusted local partners. Affordable, convenient,
              and tailored for the Filipino lifestyle.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch}
                  className="flex items-center gap-2 max-w-xl mx-auto bg-white dark:bg-gray-800
                             rounded-2xl shadow-lg dark:shadow-dark-card border border-gray-100 dark:border-gray-700
                             p-2 animate-slide-up">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search brand, model, or city…"
                  className="w-full py-2 bg-transparent text-sm text-gray-700 dark:text-gray-200
                             placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2 shrink-0"
              >
                Search
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Popular locations */}
            <div className="flex flex-wrap justify-center gap-2 animate-slide-up">
              <span className="text-xs text-gray-400 dark:text-gray-500 self-center mr-1">Popular:</span>
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocationClick(loc)}
                  className="flex items-center gap-1 text-xs bg-white dark:bg-gray-800
                             text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full
                             border border-gray-200 dark:border-gray-700
                             hover:border-brand-300 dark:hover:border-brand-600
                             hover:text-brand-600 dark:hover:text-brand-400 transition"
                >
                  <MapPin size={10} />
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURED CARS ══════════ */}
      <section className="py-16 bg-white dark:bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Featured Cars
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Handpicked rides available for you
              </p>
            </div>
            <Link
              to="/cars"
              className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400
                         hover:text-brand-700 dark:hover:text-brand-300 transition group"
            >
              View all
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <CarSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map(car => <CarCard key={car.id} car={car} />)}
            </div>
          )}

          {!isLoading && featuredCars.length === 0 && (
            <div className="text-center py-16">
              <Car size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="font-medium text-gray-700 dark:text-gray-300">No cars available yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How It Works</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Three simple steps to get on the road
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: 'Browse & Select',
                desc: 'Explore our curated selection of cars from verified local partners.',
                color: 'from-brand-500 to-blue-500',
              },
              {
                icon: Clock,
                title: 'Book Instantly',
                desc: 'Choose your dates, pay securely via GCash or cash, and get confirmed fast.',
                color: 'from-green-500 to-emerald-500',
              },
              {
                icon: Car,
                title: 'Hit the Road',
                desc: 'Pick up your car and enjoy the ride. We handle the rest.',
                color: 'from-orange-500 to-amber-500',
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <div key={i} className="card p-6 text-center hover:shadow-card-hover dark:hover:shadow-dark-card-hover
                                      transition-all duration-300 group">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${color}
                                 flex items-center justify-center shadow-lg
                                 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
                  STEP {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TRUST SIGNALS ══════════ */}
      <section className="py-16 bg-white dark:bg-[#0f1117]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, label: 'Verified Partners', desc: 'KYC-checked & fully licensed' },
              { icon: Star, label: 'Quality Assured', desc: 'Every car meets our standards' },
              { icon: Clock, label: 'Fast Booking', desc: 'Instant confirmation, no waiting' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50
                                       border border-gray-100 dark:border-gray-700/50">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30
                                flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-brand-500 dark:text-brand-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PARTNER CTA ══════════ */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl
                          bg-gradient-to-r from-brand-500 to-blue-600
                          p-8 sm:p-12 text-center text-white">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Got a car? Start earning today
              </h2>
              <p className="text-blue-100 max-w-md mx-auto mb-6 text-sm sm:text-base">
                Join our platform as a partner and turn your idle vehicle into income.
                No upfront costs, no hidden fees.
              </p>
              <Link
                to="/onboarding/step1"
                className="inline-flex items-center gap-2 bg-white text-brand-600
                           px-6 py-3 rounded-xl font-semibold text-sm
                           hover:bg-gray-100 transition shadow-lg
                           active:scale-95"
              >
                Become a Partner
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}