import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useLiveQuery } from './useLiveQuery'
import type { HeroImage } from '@/types/catalog'
export function useHeroImages() {
  const query = useCallback(async (signal: AbortSignal) => {
    const { data, error } = await supabase.from('hero_images').select('*').order('sort_order').order('created_at').abortSignal(signal)
    if (error) throw error
    return (data ?? []) as HeroImage[]
  }, [])
  const { data: images, ...state } = useLiveQuery(query, [])
  return { logo: images.find(image => image.kind === 'logo') ?? null, floating: images.filter(image => image.kind === 'floating'), ...state }
}
