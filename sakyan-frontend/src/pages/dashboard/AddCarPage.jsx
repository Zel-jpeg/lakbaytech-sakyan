import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useCreateCar } from '@/hooks/useCars'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useQuery } from '@tanstack/react-query'
import api from '@/config/axios'
import CarLocationPicker from '@/components/cars/CarLocationPicker'

const schema = z.object({
  name:          z.string().min(2, 'Car name is required'),
  brand:         z.string().min(1, 'Brand is required'),
  model:         z.string().min(1, 'Model is required'),
  year:          z.coerce.number().min(1990).max(new Date().getFullYear() + 1),
  plate_number:  z.string().min(4, 'Plate number is required'),
  transmission:  z.enum(['manual', 'automatic']),
  fuel_type:     z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  seats:         z.coerce.number().min(2).max(20),
  price_per_day: z.coerce.number().min(1, 'Price is required'),
  location:      z.string().min(3, 'Location is required'),
  description:   z.string().optional(),
})

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 dark:focus:ring-brand-500/40 focus:border-brand-500 transition-all duration-200"
const selectCls = inputCls + " appearance-none"
const sectionCls = "bg-white dark:bg-[#1a1d2e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6"

export default function AddCarPage() {
  const navigate = useNavigate()
  const createCar = useCreateCar()
  const { uploadFile, uploading, deleteFile } = useFileUpload('car-images')
  const [imageUrls, setImageUrls] = useState([])
  const [locationCoords, setLocationCoords] = useState({ lat: null, lng: null })

  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { seats: 5, transmission: 'automatic', fuel_type: 'gasoline' }
  })

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile'],
    queryFn: async () => {
      const res = await api.get('/partner/profile/')
      return res.data
    }
  })

  useEffect(() => {
    if (profile?.business_lat && profile?.business_lng && locationCoords.lat === null) {
      setLocationCoords({ lat: profile.business_lat, lng: profile.business_lng })
    }
  }, [profile, locationCoords.lat])

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const url = await uploadFile(file)
      if (url) setImageUrls(prev => [...prev, url])
    }
    e.target.value = ''
  }

  const removeImage = async (url) => {
    setImageUrls(prev => prev.filter(u => u !== url))
    await deleteFile(url)
  }

  const onSubmit = (data) => {
    createCar.mutate(
      {
        ...data,
        image_urls: imageUrls,
        location_lat: locationCoords.lat,
        location_lng: locationCoords.lng,
      },
      { onSuccess: () => navigate('/dashboard/cars') }
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard/cars')}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-brand-300 dark:hover:border-brand-600 bg-white dark:bg-[#1a1d2e] shadow-sm transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Car</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fill in your car details to start getting bookings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* Basic Info */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Basic Information</h2>
          <div className="space-y-4">
            <Field label="Car Name / Title" error={errors.name?.message} required>
              <input {...register('name')} placeholder="e.g. Toyota Vios 2022 — White" className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Brand" error={errors.brand?.message} required>
                <input {...register('brand')} placeholder="Toyota" className={inputCls} />
              </Field>
              <Field label="Model" error={errors.model?.message} required>
                <input {...register('model')} placeholder="Vios" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Year" error={errors.year?.message} required>
                <input {...register('year')} type="number" placeholder="2022" className={inputCls} />
              </Field>
              <Field label="Plate Number" error={errors.plate_number?.message} required>
                <input {...register('plate_number')} placeholder="ABC 1234" className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Specs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Transmission" error={errors.transmission?.message} required>
              <select {...register('transmission')} className={selectCls}>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </Field>
            <Field label="Fuel Type" error={errors.fuel_type?.message} required>
              <select {...register('fuel_type')} className={selectCls}>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Seats" error={errors.seats?.message} required>
              <input {...register('seats')} type="number" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Pricing & Location */}
        <div className={sectionCls}>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-5">Pricing & Location</h2>
          <div className="space-y-4">
            <Field label="Price per Day (₱)" error={errors.price_per_day?.message} required>
              <input {...register('price_per_day')} type="number" placeholder="1500" className={inputCls} />
            </Field>
            <Field label="Pickup Location" error={errors.location?.message} required>
              <Controller
                name="location"
                control={control}
                defaultValue={profile?.business_address || ''}
                render={({ field }) => (
                  <CarLocationPicker
                    initialAddress={profile?.business_address}
                    initialPin={profile?.business_lat && profile?.business_lng ? { lat: profile.business_lat, lng: profile.business_lng } : null}
                    onChange={field.onChange}
                    onCoordsChange={(lat, lng) => setLocationCoords({ lat, lng })}
                    error={errors.location?.message}
                  />
                )}
              />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <textarea {...register('description')} rows={4} placeholder="Any extra details about the car…"
                        className={inputCls + " resize-y"} />
            </Field>
          </div>
        </div>

        {/* Photos */}
        <div className={sectionCls}>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Photos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">The first photo will be used as the main listing image.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {imageUrls.map((url, i) => (
              <div key={url} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group">
                <img src={url} alt={`Car photo ${i+1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs
                                   font-bold px-2 py-1 rounded-lg shadow-sm">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white
                             rounded-full w-7 h-7 flex items-center justify-center transition opacity-0 group-hover:opacity-100 shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {/* Upload button */}
            <label className={`aspect-video rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700
                               flex flex-col items-center justify-center cursor-pointer bg-gray-50 dark:bg-gray-800/50
                               hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition
                               ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading
                ? <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                : <Upload size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
              }
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{uploading ? 'Uploading…' : 'Add photo'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createCar.isPending || uploading}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 
                     disabled:text-gray-500 dark:disabled:text-gray-400 text-white font-bold rounded-xl transition text-base shadow-sm hover:shadow-md"
        >
          {createCar.isPending ? 'Listing car…' : 'List Car'}
        </button>
      </form>
    </div>
  )
}