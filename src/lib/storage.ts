import { supabase } from '@/lib/supabase'

const BUCKET = 'akantackle-products'

async function uploadTo(path: string, file: File, upsert: boolean) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert,
  })
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export function uploadProductImage(file: File) {
  const ext = file.name.split('.').pop() ?? 'jpg'
  return uploadTo(`${crypto.randomUUID()}.${ext}`, file, false)
}

export function uploadHeroFloatingImage(file: File) {
  const ext = file.name.split('.').pop() ?? 'png'
  return uploadTo(`hero/${crypto.randomUUID()}.${ext}`, file, false)
}

export function uploadLogo(file: File) {
  const ext = file.name.split('.').pop() ?? 'png'
  return uploadTo(`hero/logo.${ext}`, file, true)
}

export async function deleteStorageImage(url: string) {
  const path = url.split(`${BUCKET}/`).pop()
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}
