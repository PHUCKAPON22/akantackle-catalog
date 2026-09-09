import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useLiveQuery } from './useLiveQuery'
import type { Category } from '@/types/catalog'
export function useCategories() {
  const query = useCallback(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order').order('name_en')
    if (error) throw error
    return (data ?? []) as Category[]
  }, [])
  const { data: categories, ...state } = useLiveQuery(query, [])
  return { categories, ...state }
}
