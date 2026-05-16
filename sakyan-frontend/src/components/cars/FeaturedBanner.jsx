import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Star, Flame, Car, Trophy,
  ArrowRight, Building2, User, TrendingUp, MapPin, Tag
} from 'lucide-react'
import api from '@/config/axios'

function useFeatured() {
  return useQuery({
    queryKey: ['public-featured'],
    queryFn: () => api.get('/public/featured/').then(r => r.data),
    staleTime: 5 * 60_000,
  })
}

/* ── Car thumbnail gallery (right side) ─────────────────── */
function CarThumbnails({ cars = [] }) {
  if (!cars || cars.length === 0) return null

  // Single car — larger display
  if (cars.length === 1) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-3">
        <div className="relative w-full max-w-[200px] sm:max-w-[240px] aspect-[4/3] rounded-2xl overflow-hidden
                        shadow-2xl border border-white/20 ring-1 ring-white/10">
          <img src={cars[0].image} alt={cars[0].name}
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold truncate drop-shadow-md">
            {cars[0].name}
          </p>
        </div>
      </div>
    )
  }

  // 2 cars — side-by-side
  if (cars.length === 2) {
    return (
      <div className="relative w-full h-full flex items-center justify-center gap-2.5 p-3">
        {cars.map((car, i) => (
          <div key={car.id}
            className={`relative w-[45%] aspect-[4/3] rounded-xl overflow-hidden shadow-xl
                        border border-white/20 ring-1 ring-white/10 transition-transform duration-500
                        ${i === 0 ? 'rotate-[-3deg] translate-y-1' : 'rotate-[3deg] -translate-y-1'}`}>
            <img src={car.image} alt={car.name}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <p className="absolute bottom-1.5 left-2 right-2 text-white text-[10px] sm:text-xs font-semibold truncate drop-shadow-md">
              {car.name}
            </p>
          </div>
        ))}
      </div>
    )
  }

  // 3 cars — overlapping fan layout
  return (
    <div className="relative w-full h-full flex items-center justify-center p-3">
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] h-full">
        {cars.map((car, i) => {
          const transforms = [
            'rotate-[-6deg] translate-x-[-10%] translate-y-[-8%] z-10',
            'rotate-[0deg] translate-x-[5%] translate-y-[-18%] z-20',
            'rotate-[6deg] translate-x-[20%] translate-y-[-8%] z-10',
          ]
          return (
            <div key={car.id}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[55%] aspect-[4/3] rounded-xl overflow-hidden shadow-xl
                          border border-white/20 ring-1 ring-white/10
                          transition-transform duration-500 ${transforms[i]}`}>
              <img src={car.image} alt={car.name}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <p className="absolute bottom-1.5 left-2 right-2 text-white text-[10px] sm:text-xs font-semibold truncate drop-shadow-md">
                {car.name}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Partner slide ─────────────────────────────────────── */
function PartnerSlide({ data, badge, badgeColor, badgeBg, icon: Icon, tagline, cta }) {
  if (!data) return null
  const hasCars = data.top_cars && data.top_cars.length > 0

  return (
    <div className="relative h-full flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-[0.08] ${badgeBg}`} />
        <div className={`absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-[0.05] ${badgeBg}`} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Left: text content */}
      <div className={`relative z-10 px-6 sm:px-10 lg:px-14 ${hasCars ? 'w-full sm:w-[55%] lg:w-[55%]' : 'w-full max-w-xl'}`}>
        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold
                          tracking-wide uppercase mb-2 sm:mb-3 ${badgeColor} border border-white/20`}
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <Icon size={12} />
          <span>{badge}</span>
        </div>

        {/* Name */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-1 tracking-tight">
          {data.business_name}
        </h2>
        <p className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-1.5">
          {data.partner_type === 'company'
            ? <><Building2 size={12} className="text-white/45" /> Company</>
            : <><User size={12} className="text-white/45" /> Individual</>
          }
          <span className="text-white/25 mx-0.5">·</span>
          {tagline}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
          {data.car_count !== undefined && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg
                            px-2.5 py-1 text-white text-[11px] sm:text-sm font-medium border border-white/10">
              <Car size={13} className="opacity-75" /> {data.car_count} Cars
            </div>
          )}
          {data.booking_count !== undefined && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg
                            px-2.5 py-1 text-white text-[11px] sm:text-sm font-medium border border-white/10">
              <Trophy size={13} className="opacity-75" /> {data.booking_count} Rentals
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/cars?partner_id=${data.id}`}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold
                     text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl
                     hover:bg-gray-50 hover:shadow-xl transition-all duration-200 shadow-lg group"
        >
          {cta}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Right: car thumbnails (hidden on very small mobile) */}
      {hasCars && (
        <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-[42%] lg:w-[40%]">
          <CarThumbnails cars={data.top_cars} />
        </div>
      )}
    </div>
  )
}

/* ── Car slide ─────────────────────────────────────────── */
function CarSlide({ car }) {
  if (!car) return null
  return (
    <div className="relative h-full flex items-center">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-400 opacity-[0.08]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Left: info */}
      <div className={`relative z-10 px-6 sm:px-10 lg:px-14 ${car.primary_image ? 'w-full sm:w-[55%]' : 'w-full max-w-xl'}`}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold
                        tracking-wide uppercase mb-2 sm:mb-3 text-orange-300 border border-white/20"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <TrendingUp size={12} /> Top Rented Car
        </div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1 tracking-tight">{car.name}</h2>
        <p className="text-white/60 text-xs sm:text-sm mb-1 flex items-center gap-1.5">
          {car.brand} {car.model}
          <span className="text-white/25">·</span>
          {car.year}
        </p>
        <p className="text-white/45 text-[11px] sm:text-xs mb-3 sm:mb-4 flex items-center gap-1">
          <MapPin size={11} /> {car.partner_name} · {car.location}
        </p>

        <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg
                          px-2.5 py-1 text-white text-[11px] sm:text-sm font-medium border border-white/10">
            <Trophy size={13} className="opacity-75" /> {car.booking_count} Rented
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg
                          px-2.5 py-1 text-white text-[11px] sm:text-sm font-medium border border-white/10">
            <Tag size={13} className="opacity-75" /> ₱{Number(car.price_per_day).toLocaleString()}/day
          </div>
        </div>

        <Link
          to={`/cars/${car.id}`}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold
                     text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl
                     hover:bg-gray-50 hover:shadow-xl transition-all duration-200 shadow-lg group"
        >
          View This Car
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Right: car image */}
      {car.primary_image && (
        <div className="hidden sm:flex absolute right-0 top-0 bottom-0 w-[42%] lg:w-[40%] items-center justify-center p-4">
          <div className="relative w-full max-w-[260px] aspect-[4/3] rounded-2xl overflow-hidden
                          shadow-2xl border border-white/20 ring-1 ring-white/10">
            <img src={car.primary_image} alt={car.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Gradients ──────────────────────────────────────────── */
const SLIDE_GRADIENTS = [
  'from-violet-600 via-purple-600 to-indigo-700',
  'from-brand-600 via-brand-500 to-cyan-600',
  'from-rose-600 via-pink-600 to-orange-600',
  'from-orange-500 via-amber-500 to-yellow-500',
]

/* ── Main component ────────────────────────────────────── */
export default function FeaturedBanner() {
  const { data, isLoading } = useFeatured()
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const slides = []
  if (data?.featured_partner)    slides.push({ type: 'featured',    data: data.featured_partner })
  if (data?.most_cars_partner)   slides.push({ type: 'most_cars',   data: data.most_cars_partner })
  if (data?.most_rented_partner) slides.push({ type: 'most_rented', data: data.most_rented_partner })
  if (data?.top_rented_car)      slides.push({ type: 'top_car',     data: data.top_rented_car })

  const total = slides.length

  const goTo = (idx) => setCurrent((idx + total) % total)

  // Auto-advance
  useEffect(() => {
    if (total < 2) return
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
    return () => clearInterval(timerRef.current)
  }, [total])

  const resetTimer = () => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), 5000)
  }

  if (isLoading) {
    return (
      <div className="h-44 sm:h-52 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300
                       dark:from-gray-800 dark:to-gray-700 animate-pulse mb-6" />
    )
  }

  if (!data || total === 0) return null

  const slide = slides[current]
  const gradient = SLIDE_GRADIENTS[current % SLIDE_GRADIENTS.length]

  return (
    <div className="mb-6 relative">
      {/* Carousel container — responsive height */}
      <div className={`relative h-[200px] sm:h-[220px] lg:h-[240px] rounded-2xl bg-gradient-to-br ${gradient}
                       overflow-hidden shadow-xl`}>

        {/* Subtle shine sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-full top-0 w-1/2 h-full bg-gradient-to-r
                          from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] animate-shine" />
        </div>

        {/* Slide content */}
        <div className="h-full transition-all duration-500">
          {slide.type === 'featured' && (
            <PartnerSlide
              data={slide.data}
              badge="Featured Partner"
              badgeColor="text-amber-300"
              badgeBg="bg-amber-400"
              icon={Star}
              tagline="Our spotlight rental partner"
              cta="Browse Their Cars"
            />
          )}
          {slide.type === 'most_cars' && (
            <PartnerSlide
              data={slide.data}
              badge="Largest Fleet"
              badgeColor="text-cyan-300"
              badgeBg="bg-cyan-400"
              icon={Car}
              tagline="Most cars listed on Sakyan"
              cta="Explore Fleet"
            />
          )}
          {slide.type === 'most_rented' && (
            <PartnerSlide
              data={slide.data}
              badge="Most Popular"
              badgeColor="text-rose-300"
              badgeBg="bg-rose-400"
              icon={Flame}
              tagline="Most trusted by Sakyan renters"
              cta="View Their Cars"
            />
          )}
          {slide.type === 'top_car' && (
            <CarSlide car={slide.data} />
          )}
        </div>

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button
              onClick={() => { goTo(current - 1); resetTimer() }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full
                         bg-black/25 hover:bg-black/45 flex items-center justify-center text-white
                         transition-all duration-200 backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { goTo(current + 1); resetTimer() }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full
                         bg-black/25 hover:bg-black/45 flex items-center justify-center text-white
                         transition-all duration-200 backdrop-blur-sm border border-white/10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); resetTimer() }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 sm:w-7 bg-white shadow-sm' : 'w-1.5 bg-white/35 hover:bg-white/55'
                }`}
              />
            ))}
          </div>
        )}

        {/* Slide count label */}
        <div className="absolute top-2.5 sm:top-3.5 right-3 sm:right-4 text-white/45 text-[10px] sm:text-xs font-medium tracking-wide">
          {current + 1} / {total}
        </div>
      </div>
    </div>
  )
}
