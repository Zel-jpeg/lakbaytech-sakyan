import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Star, Flame, Car, Trophy,
  Sparkles, ArrowRight, Building2, User, TrendingUp, MapPin, Tag
} from 'lucide-react'
import api from '@/config/axios'

function useFeatured() {
  return useQuery({
    queryKey: ['public-featured'],
    queryFn: () => api.get('/public/featured/').then(r => r.data),
    staleTime: 5 * 60_000,
  })
}

/* ── Partner slide ─────────────────────────────────────── */
function PartnerSlide({ data, badge, badgeColor, badgeBg, icon: Icon, tagline, cta, showBoostDate = false }) {
  if (!data) return null
  return (
    <div className="relative h-full flex flex-col justify-center px-8 sm:px-14">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-[0.08] ${badgeBg}`} />
        <div className={`absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-[0.05] ${badgeBg}`} />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10 max-w-xl">
        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-4 ${badgeColor} border border-white/20`}
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <Icon size={13} />
          <span>{badge}</span>
        </div>

        {/* Name */}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1.5 tracking-tight">
          {data.business_name}
        </h2>
        <p className="text-white/65 text-sm mb-5 flex items-center gap-1.5">
          {data.partner_type === 'company'
            ? <><Building2 size={13} className="text-white/50" /> Company</>
            : <><User size={13} className="text-white/50" /> Individual</>
          }
          <span className="text-white/30 mx-1">·</span>
          {tagline}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2.5 mb-6">
          {data.car_count !== undefined && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm font-medium border border-white/10">
              <Car size={14} className="opacity-80" /> {data.car_count} Cars Available
            </div>
          )}
          {data.booking_count !== undefined && (
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm font-medium border border-white/10">
              <Trophy size={14} className="opacity-80" /> {data.booking_count} Completed Rentals
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/cars?partner_id=${data.id}`}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:shadow-xl transition-all duration-200 shadow-lg group"
        >
          {cta}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}

/* ── Car slide ─────────────────────────────────────────── */
function CarSlide({ car }) {
  if (!car) return null
  return (
    <div className="relative h-full flex flex-col sm:flex-row items-center gap-6 px-8 sm:px-14">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-orange-400 opacity-[0.08]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Car image */}
      {car.primary_image && (
        <div className="relative z-10 shrink-0 w-40 h-28 sm:w-56 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15">
          <img src={car.primary_image} alt={car.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Info */}
      <div className="relative z-10 flex-1">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase mb-3 text-orange-300 border border-white/20"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
          <TrendingUp size={13} /> Top Rented Car
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 tracking-tight">{car.name}</h2>
        <p className="text-white/65 text-sm mb-1 flex items-center gap-1.5">
          {car.brand} {car.model}
          <span className="text-white/30">·</span>
          {car.year}
        </p>
        <p className="text-white/50 text-xs mb-4 flex items-center gap-1">
          <MapPin size={11} /> {car.partner_name} · {car.location}
        </p>
        <div className="flex flex-wrap gap-2.5 mb-5">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm font-medium border border-white/10">
            <Trophy size={14} className="opacity-80" /> {car.booking_count} Times Rented
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm font-medium border border-white/10">
            <Tag size={14} className="opacity-80" /> ₱{Number(car.price_per_day).toLocaleString()} / day
          </div>
        </div>
        <Link
          to={`/cars/${car.id}`}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:shadow-xl transition-all duration-200 shadow-lg group"
        >
          View This Car
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
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
  if (data?.featured_partner)    slides.push({ type: 'featured',     data: data.featured_partner })
  if (data?.most_cars_partner)   slides.push({ type: 'most_cars',    data: data.most_cars_partner })
  if (data?.most_rented_partner) slides.push({ type: 'most_rented',  data: data.most_rented_partner })
  if (data?.top_rented_car)      slides.push({ type: 'top_car',      data: data.top_rented_car })

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
      <div className="h-52 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 animate-pulse mb-8" />
    )
  }

  if (!data || total === 0) return null

  const slide = slides[current]
  const gradient = SLIDE_GRADIENTS[current % SLIDE_GRADIENTS.length]

  return (
    <div className="mb-8 relative">
      {/* Carousel container */}
      <div className={`relative h-52 sm:h-56 rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden shadow-xl`}>

        {/* Subtle shine sweep animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] animate-shine" />
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45
                         flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => { goTo(current + 1); resetTimer() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/25 hover:bg-black/45
                         flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); resetTimer() }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-7 bg-white shadow-sm' : 'w-1.5 bg-white/35 hover:bg-white/55'
                }`}
              />
            ))}
          </div>
        )}

        {/* Slide count label */}
        <div className="absolute top-3.5 right-4 text-white/50 text-xs font-medium tracking-wide">
          {current + 1} / {total}
        </div>
      </div>
    </div>
  )
}
