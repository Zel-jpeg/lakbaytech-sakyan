import { useState } from 'react'
import { supabase } from '@/config/supabase'
import toast from 'react-hot-toast'

// ─── Image compression ────────────────────────────────────────────────────────
const MAX_PX  = 1280
const QUALITY = 0.82

function compressImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return }

    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        if (width > height) { height = Math.round((height / width) * MAX_PX); width = MAX_PX }
        else                { width  = Math.round((width / height) * MAX_PX); height = MAX_PX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob || file), 'image/webp', QUALITY)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

// ─── Extract storage path from a public URL ───────────────────────────────────
function extractPath(publicUrl) {
  try {
    // Public URL format: .../storage/v1/object/public/<bucket>/<path>
    const match = publicUrl.match(/\/object\/public\/[^/]+\/(.+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFileUpload(bucket = 'uploads') {
  const [uploading, setUploading] = useState(false)

  /** Upload a file, optionally deleting the previous one first */
  const uploadFile = async (file, previousUrl = null) => {
    if (!file) return null

    // Size guard (5 MB max — images will be much smaller after WebP compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5 MB.')
      return null
    }

    setUploading(true)
    try {
      // Delete old file from storage if replacing
      if (previousUrl) {
        const oldPath = extractPath(previousUrl)
        if (oldPath) {
          await supabase.storage.from(bucket).remove([oldPath])
        }
      }

      const compressed = await compressImage(file)
      const isWebP     = compressed.type === 'image/webp'
      const ext        = isWebP ? 'webp' : file.name.split('.').pop()
      const path       = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
        contentType:  compressed.type || file.type,
        cacheControl: '31536000',
        upsert: false,
      })
      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'))
      return null
    } finally {
      setUploading(false)
    }
  }

  /** Delete a file from storage by its public URL */
  const deleteFile = async (publicUrl) => {
    const path = extractPath(publicUrl)
    if (!path) return
    await supabase.storage.from(bucket).remove([path])
  }

  return { uploadFile, uploading, deleteFile }
}
