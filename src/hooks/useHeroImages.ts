import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { HeroImage } from '@/types/catalog'

export function useHeroImages() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('hero_images').select('*').order('sort_order').order('created_at')
    setImages(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function deleteHeroImage(id: string) {
    const { error } = await supabase.from('hero_images').delete().eq('id', id)
    if (!error) await refetch()
    return { error }
  }

  const logo = images.find((img) => img.kind === 'logo') ?? null
  const floating = images.filter((img) => img.kind === 'floating')

  return { logo, floating, loading, refetch, deleteHeroImage }
}
