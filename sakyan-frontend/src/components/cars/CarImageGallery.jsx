import { useState } from 'react'
import { ChevronLeft, ChevronRight, Car } from 'lucide-react'

export default function CarImageGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!images.length) {
    return (
      <div className="w-full h-72 sm:h-96 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Car size={48} className="text-gray-300" />
      </div>
    )
  }

  const prev = () => setActiveIdx(i => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setActiveIdx(i => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative w-full h-72 sm:h-96 bg-gray-100 rounded-2xl overflow-hidden">
        <img
          src={images[activeIdx]?.image_url}
          alt={`Car photo ${activeIdx + 1}`}
          className="w-full h-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80
                         hover:bg-white rounded-full flex items-center justify-center
                         shadow-sm transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80
                         hover:bg-white rounded-full flex items-center justify-center
                         shadow-sm transition"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    i === activeIdx ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition ${
                i === activeIdx ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.image_url} alt={`Thumb ${i + 1}`}
                   className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}