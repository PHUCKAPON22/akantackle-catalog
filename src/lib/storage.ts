import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/catalog'
const BUCKET = 'akantackle-products'
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/heic,image/heif'
export async function prepareImage(file: File) {
  if (file.size > 20 * 1024 * 1024) throw new Error('Choose an image smaller than 20 MB.')
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode().catch(() => { throw new Error('This image cannot be decoded in this browser. Export it as JPG, PNG or WebP and try again.') })
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image editing is unavailable in this browser.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not prepare this image.')), 'image/webp', 0.9))
    return { file: new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: blob.type }), width: canvas.width, height: canvas.height }
  } finally { URL.revokeObjectURL(objectUrl) }
}
async function uploadTo(folder: string, file: File, optimized = false) {
  try {
    const prepared = optimized ? file : (await prepareImage(file)).file
    const extension = prepared.type === 'image/webp' ? 'webp' : 'png'
    const path = `${folder}${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, prepared, { cacheControl: '31536000', upsert: false, contentType: prepared.type })
    if (error) throw error
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  } catch (error) { return { url: null, error: errorMessage(error) } }
}
export function uploadProductImage(file: File) { return uploadTo('', file) }
export function uploadHeroFloatingImage(file: File) { return uploadTo('hero/', file) }
export function uploadLogo(file: File) { return uploadTo('hero/logo-', file, true) }
export async function deleteStorageImages(urls: string[]) {
  try {
    const prefix = `/storage/v1/object/public/${BUCKET}/`
    const paths = [...new Set(urls.map(value => {
      const url = new URL(value)
      if (url.origin !== new URL(import.meta.env.VITE_SUPABASE_URL).origin || !url.pathname.startsWith(prefix)) throw new Error('Image does not belong to this catalog storage.')
      return decodeURIComponent(url.pathname.slice(prefix.length))
    }))]
    for (let start = 0; start < paths.length; start += 100) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(start, start + 100))
      if (error) throw error
    }
    return null
  } catch (error) { return errorMessage(error) }
}
export async function deleteStorageImage(url: string) { return deleteStorageImages([url]) }

// A lost response does not prove a database write failed. Check references first.
export async function cleanupUnusedUpload(url: string) {
  try {
    for (const table of ['products', 'product_images', 'hero_images'] as const) {
      const { data, error } = await supabase.from(table).select('id').eq('image_url', url).limit(1)
      if (error) throw error
      if (data?.length) return 'The image was saved. Refresh to check the latest result before retrying.'
    }
    return await deleteStorageImage(url)
  } catch {
    return 'The save result could not be checked. The uploaded file was kept; refresh before retrying.'
  }
}
