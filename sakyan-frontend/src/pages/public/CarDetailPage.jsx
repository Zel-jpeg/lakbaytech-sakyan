import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Users, Fuel, Settings2, Palette, Calendar,
  ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2,
  XCircle, Tag, Building2, Shield, Car,
} from 'lucide-react'
import { useCar } from '@/hooks/useCars'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/utils/formatters'

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images = [], carName }) {
  const [activeIdx, setActiveIdx] = useState(0)

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  if (!sorted.length) {
    return (
      <div className="w-full h-72 sm:h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <Car size={48} className="text-gray-300 dark:text-gray-600" />
      </div>
    )
  }

  const prev = () => setActiveIdx(i => (i === 0 ? sorted.length - 1 : i - 1))
  const next = () => setActiveIdx(i => (i === sorted.length - 1 ? 0 : i + 1))

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative w-full h-72 sm:h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
        <img
          src={sorted[activeIdx].image_url}
          alt={`${carName} — photo ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-all duration-500"
        />

        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2
                         bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800
                         backdrop-blur-sm rounded-full p-2 shadow-md transition
                         opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={20} className="text-gray-800 dark:text-gray-200" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2
                         bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800
                         backdrop-blur-sm rounded-full p-2 shadow-md transition
                         opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={20} className="text-gray-800 dark:text-gray-200" />
            </button>

            <span className="absolute bottom-3 right-3 bg-black/50 dark:bg-white/20 text-white
                             text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              {activeIdx + 1} / {sorted.length}
            </span>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {sorted.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === activeIdx ? 'bg-white scale-150' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? 'border-brand-500 shadow-glow'
                  : 'border-transparent dark:border-gray-700 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.image_url} alt={`thumb ${i + 1}`}
                   className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Spec Item ────────────────────────────────────────────────────────────────

function SpecItem({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl
                    border border-gray-100 dark:border-gray-700/50 transition-colors">
      <div className="w-9 h-9 bg-brand-50 dark:bg-brand-900/30 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={18} className="text-brand-500 dark:text-brand-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{value}</p>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="w-full h-96 shimmer rounded-2xl" />
      <div className="space-y-3">
        <div className="h-7 shimmer rounded-lg w-2/3" />
        <div className="h-4 shimmer rounded-lg w-1/3" />
        <div className="h-4 shimmer rounded-lg w-1/4" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 shimmer rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CarDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: car, isLoading, isError } = useCar(id)

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
                           hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition">
          <ArrowLeft size={16} /> Back to cars
        </button>
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !car) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Car size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Car not found</p>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          This listing may have been removed or made unavailable.
        </p>
        <Link to="/cars"
              className="mt-6 inline-block btn-primary">
          Browse other cars
        </Link>
      </div>
    )
  }

  const isAvailable = car.is_available && car.status === 'active'

  const handleBookNow = () => {
    if (!user) {
      navigate('/login', { state: { from: `/booking/checkout/${car.id}` } })
      return
    }
    navigate(`/booking/checkout/${car.id}`)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Back */}
      <button onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400
                         hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to cars
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── LEFT: Gallery + Details ── */}
        <div className="lg:col-span-3 space-y-6">

          <ImageGallery images={car.images || []} carName={car.name} />

          {/* Title block */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{car.name}</h1>
              {isAvailable ? (
                <span className="flex items-center gap-1.5 shrink-0 text-sm text-green-700 dark:text-green-400
                                 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800
                                 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} /> Available
                </span>
              ) : (
                <span className="flex items-center gap-1.5 shrink-0 text-sm text-red-600 dark:text-red-400
                                 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800
                                 px-3 py-1 rounded-full">
                  <XCircle size={14} /> Unavailable
                </span>
              )}
            </div>

            {car.partner_name && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                <Building2 size={14} />
                <span>{car.partner_name}</span>
              </div>
            )}
            {car.location && (
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin size={14} />
                <span>{car.location}</span>
              </div>
            )}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 gap-3">
            <SpecItem icon={Settings2} label="Transmission" value={car.transmission} />
            <SpecItem icon={Fuel}      label="Fuel Type"    value={car.fuel_type} />
            <SpecItem icon={Users}     label="Seats"        value={car.seats ? `${car.seats} seats` : null} />
            <SpecItem icon={Palette}   label="Color"        value={car.color} />
            {car.year && (
              <SpecItem icon={Calendar} label="Year" value={String(car.year)} />
            )}
            {car.brand && car.model && (
              <SpecItem icon={Tag} label="Model" value={`${car.brand} ${car.model}`} />
            )}
          </div>

          {/* Description */}
          {car.description && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">About this car</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {car.description}
              </p>
            </div>
          )}

          {/* Features */}
          {car.features?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Features</h2>
              <div className="flex flex-wrap gap-2">
                {car.features.map((f, i) => (
                  <span key={i}
                        className="flex items-center gap-1.5 text-sm bg-brand-50 dark:bg-brand-900/30
                                   text-brand-700 dark:text-brand-300
                                   px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-800">
                    <CheckCircle2 size={12} />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Partner card */}
          {car.partner_name && (
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center
                              text-brand-600 dark:text-brand-400 font-bold text-sm shrink-0">
                <Building2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                  {car.partner_name}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                  <Shield size={11} /> Verified Partner
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Booking Card (sticky) ── */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-20 space-y-4">

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-brand-500 dark:text-brand-400">
                  {formatCurrency(car.price_per_day)}
                </span>
                <span className="text-sm text-gray-400 dark:text-gray-500"> / day</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Price may vary by dates</p>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Quick specs recap */}
            <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
              {car.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span>{car.location}</span>
                </div>
              )}
              {car.transmission && (
                <div className="flex items-center gap-2">
                  <Settings2 size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="capitalize">{car.transmission}</span>
                </div>
              )}
              {car.seats && (
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span>{car.seats} seats</span>
                </div>
              )}
              {car.fuel_type && (
                <div className="flex items-center gap-2">
                  <Fuel size={15} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="capitalize">{car.fuel_type}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            {user?.role === 'customer' && isAvailable && (
              <button
                onClick={handleBookNow}
                className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700
                           text-white text-sm font-semibold rounded-xl transition-all shadow-md
                           hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98]"
              >
                Book Now
              </button>
            )}

            {!user && (
              <div className="space-y-2">
                <button
                  onClick={handleBookNow}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700
                             text-white text-sm font-semibold rounded-xl transition-all shadow-md
                             hover:shadow-lg active:scale-[0.98]"
                >
                  Log in to Book
                </button>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline">Sign up</Link>
                </p>
              </div>
            )}

            {user?.role === 'partner' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                Partner accounts can't book cars. Switch to a customer account to book.
              </p>
            )}

            {!isAvailable && user?.role === 'customer' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                This car is currently unavailable. Check back later or{' '}
                <Link to="/cars" className="text-brand-600 dark:text-brand-400 hover:underline">browse similar cars</Link>.
              </p>
            )}

            {/* Trust signals */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2.5">
              {[
                'Free cancellation before approval',
                'KYC verification required',
                'GCash or cash accepted',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle2 size={13} className="text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}