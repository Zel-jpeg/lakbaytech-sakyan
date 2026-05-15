import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Star, Flame, Car, Trophy, Sparkles, ArrowRight } from 'lucide-react'
import api from '@/config/axios'

function useFeatured() {
  return useQuery({
    queryKey: ['public-featured'],
    queryFn: () => api.get('/public/featured/').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

function PartnerSlide({ data, badge, badgeColor, icon: Icon, tagline, cta }) {
  if (!data) return null
  return (
    <div className="relative h-full flex flex-col justify-center px-8 sm:px-14">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 ${badgeColor.replace('text-', 'bg-')}`} />
        <div className={`absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-5 ${badgeColor.replace('text-', 'bg-')}`} />
      </div>

      <div className="relative z-10 max-w-xl">
        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${badgeColor} bg-current/10`}
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <Icon size={13} />
          <span>{badge}</span>
        </div>

        {/* Name */}
        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
          {data.business_name}
        </h2>
        <p className="text-white/70 text-sm mb-4">
          {data.partner_type === 'company' ? '🏢 Company' : '👤 Individual'} · {tagline}
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {data.car_count !== undefined && (
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-lg px-3 py-1.5 text-white text-sm font-medium">
              <Car size={14} /> {data.car_count} Cars Available
            </div>
          )}
          {data.booking_count !== undefined && (
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-lg px-3 py-1.5 text-white text-sm font-medium">
              <Trophy size={14} /> {data.booking_count} Completed Rentals
            </div>
          )}
          {data.boost_end_date && (
            <div className="flex items-center gap-1.5 bg-amber-400/30 backdrop-blur rounded-lg px-3 py-1.5 text-amber-200 text-sm font-medium">
              <Sparkles size={14} /> Featured until {new Date(data.boost_end_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/cars?partner_id=${data.id}`}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition shadow-lg"
        >
          {cta} <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

function CarSlide({ car }) {
  if (!car) return null
  return (
    <div className="relative h-full flex flex-col sm:flex-row items-center gap-6 px-8 sm:px-14">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-orange-400 opacity-10" />
      </div>

      {/* Car image */}
      {car.primary_image && (
        <div className="relative z-10 shrink-0 w-40 h-28 sm:w-56 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
          <img src={car.primary_image} alt={car.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Info */}
      <div className="relative z-10 flex-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 text-orange-300"
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <Trophy size={13} /> 🚗 Top Rented Car
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">{car.name}</h2>
        <p className="text-white/70 text-sm mb-1">{car.brand} {car.model} · {car.year}</p>
        <p className="text-white/60 text-xs mb-3">{car.partner_name} · {car.location}</p>
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-lg px-3 py-1.5 text-white text-sm font-medium">
            <Trophy size={14} /> {car.booking_count} Times Rented
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-lg px-3 py-1.5 text-white text-sm font-medium">
            ₱{Number(car.price_per_day).toLocaleString()} / day
          </div>
        </div>
        <Link
          to={`/cars/${car.id}`}
          className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-gray-100 transition shadow-lg"
        >
          View This Car <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

const SLIDE_GRADIENTS = [
  'from-violet-600 via-purple-600 to-indigo-700',   // Featured (paid)
  'from-brand-600 via-brand-500 to-cyan-600',        // Most cars
  'from-rose-600 via-pink-600 to-orange-600',        // Most rented partner
  'from-orange-500 via-amber-500 to-yellow-500',     // Top rented car
]

export default function FeaturedBanner() {
  const { data, isLoading } = useFeatured()
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const slides = []
  if (data?.featured_partner)   slides.push({ type: 'featured',       data: data.featured_partner })
  if (data?.most_cars_partner)  slides.push({ type: 'most_cars',      data: data.most_cars_partner })
  if (data?.most_rented_partner) slides.push({ type: 'most_rented',   data: data.most_rented_partner })
  if (data?.top_rented_car)     slides.push({ type: 'top_car',        data: data.top_rented_car })

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
      <div className="h-48 rounded-2xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 animate-pulse mb-6" />
    )
  }

  if (!data || total === 0) return null

  const slide = slides[current]
  const gradient = SLIDE_GRADIENTS[current % SLIDE_GRADIENTS.length]

  return (
    <div className="mb-6 relative">
      {/* Carousel container */}
      <div className={`relative h-48 sm:h-52 rounded-2xl bg-gradient-to-br ${gradient} overflow-hidden shadow-xl`}>

        {/* Slide content */}
        <div className="h-full transition-all duration-500">
          {slide.type === 'featured' && (
            <PartnerSlide
              data={slide.data}
              badge="⭐ Featured Partner"
              badgeColor="text-amber-300"
              icon={Sparkles}
              tagline="Our spotlight rental partner"
              cta="Browse Their Cars"
            />
          )}
          {slide.type === 'most_cars' && (
            <PartnerSlide
              data={slide.data}
              badge="🚘 Most Cars Listed"
              badgeColor="text-cyan-300"
              icon={Car}
              tagline="Largest fleet on Sakyan"
              cta="Explore Fleet"
            />
          )}
          {slide.type === 'most_rented' && (
            <PartnerSlide
              data={slide.data}
              badge="🔥 Most Rented Partner"
              badgeColor="text-rose-300"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition backdrop-blur-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => { goTo(current + 1); resetTimer() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition backdrop-blur-sm"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); resetTimer() }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Slide count label */}
        <div className="absolute top-3 right-4 text-white/60 text-xs font-medium">
          {current + 1} / {total}
        </div>
      </div>
    </div>
  )
}
