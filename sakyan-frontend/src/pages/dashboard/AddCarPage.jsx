import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Upload, X, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useCreateCar } from '@/hooks/useCars'
import { useFileUpload } from '@/hooks/useFileUpload'

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
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
const selectCls = inputCls + " bg-white"

export default function AddCarPage() {
  const navigate = useNavigate()
  const createCar = useCreateCar()
  const { uploadFile, uploading } = useFileUpload('car-images')
  const [imageUrls, setImageUrls] = useState([])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { seats: 5, transmission: 'automatic', fuel_type: 'gasoline' }
  })

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const url = await uploadFile(file)
      if (url) setImageUrls(prev => [...prev, url])
    }
    e.target.value = ''
  }

  const removeImage = (url) => setImageUrls(prev => prev.filter(u => u !== url))

  const onSubmit = (data) => {
    createCar.mutate(
      { ...data, images: imageUrls },
      { onSuccess: () => navigate('/dashboard/cars') }
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/cars')}
          className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Car</h1>
          <p className="text-sm text-gray-500">Fill in your car details to start getting bookings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Information</h2>
          <Field label="Car Name / Title" error={errors.name?.message} required>
            <input {...register('name')} placeholder="e.g. Toyota Vios 2022 — White" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Brand" error={errors.brand?.message} required>
              <input {...register('brand')} placeholder="Toyota" className={inputCls} />
            </Field>
            <Field label="Model" error={errors.model?.message} required>
              <input {...register('model')} placeholder="Vios" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Year" error={errors.year?.message} required>
              <input {...register('year')} type="number" placeholder="2022" className={inputCls} />
            </Field>
            <Field label="Plate Number" error={errors.plate_number?.message} required>
              <input {...register('plate_number')} placeholder="ABC 1234" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Specs</h2>
          <div className="grid grid-cols-3 gap-4">
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
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Pricing & Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price per Day (₱)" error={errors.price_per_day?.message} required>
              <input {...register('price_per_day')} type="number" placeholder="1500" className={inputCls} />
            </Field>
            <Field label="Location" error={errors.location?.message} required>
              <input {...register('location')} placeholder="Quezon City, Metro Manila" className={inputCls} />
            </Field>
          </div>
          <Field label="Description" error={errors.description?.message}>
            <textarea {...register('description')} rows={3} placeholder="Any extra details about the car…"
                      className={inputCls + " resize-none"} />
          </Field>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Photos</h2>
          <p className="text-xs text-gray-400">First photo will be used as the main listing image.</p>

          <div className="grid grid-cols-3 gap-3">
            {imageUrls.map((url, i) => (
              <div key={url} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt={`Car photo ${i+1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px]
                                   font-bold px-1.5 py-0.5 rounded-md">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white
                             rounded-full w-5 h-5 flex items-center justify-center transition"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Upload button */}
            <label className={`aspect-video rounded-xl border-2 border-dashed border-gray-200
                               flex flex-col items-center justify-center cursor-pointer
                               hover:border-blue-400 hover:bg-blue-50/40 transition
                               ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading
                ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                : <Upload size={20} className="text-gray-400" />
              }
              <span className="text-xs text-gray-400 mt-1">{uploading ? 'Uploading…' : 'Add photo'}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createCar.isPending || uploading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200
                     text-white font-semibold rounded-xl transition text-sm"
        >
          {createCar.isPending ? 'Listing car…' : 'List Car'}
        </button>
      </form>
    </div>
  )
}