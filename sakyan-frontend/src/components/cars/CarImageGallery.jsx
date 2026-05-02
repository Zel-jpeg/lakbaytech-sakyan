import { useState } from 'react'
import { ChevronLeft, ChevronRight, Car } from 'lucide-react'

export default function CarImageGallery({ images = [], carName }) {
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

        {/* Prev / Next */}
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

            {/* Counter pill */}
            <span className="absolute bottom-3 right-3 bg-black/50 dark:bg-white/20 text-white
                             text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              {activeIdx + 1} / {sorted.length}
            </span>

            {/* Dot indicators */}
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