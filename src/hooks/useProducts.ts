import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { notifyCatalogChanged, PAGE_SIZE } from '@/lib/catalog'
import { useLiveQuery } from './useLiveQuery'
import type { Product, ProductInput } from '@/types/catalog'
export function useProducts({ scope = [], publicOnly = false, page = 0, pages = 1 }: { scope?: string[]; publicOnly?: boolean; page?: number; pages?: number } = {}) {
  const scopeKey = JSON.stringify(scope)
  const query = useCallback(async (signal: AbortSignal) => {
    const selected = JSON.parse(scopeKey) as string[]
    const products: Product[] = []
    let total = 0
    const end = (page + pages) * PAGE_SIZE
    for (let start = page * PAGE_SIZE; start < end; start += 1000) {
      let request = supabase.from('products').select('*', { count: 'exact' })
      if (selected.length) request = request.in('category', selected)
      if (publicOnly) request = request.eq('review_status', 'approved').in('status', ['active', 'out_of_stock']).not('category', 'is', null)
      const { data, count, error } = await request.order('sort_order').order('created_at', { ascending: false }).order('id').range(start, Math.min(start + 999, end - 1)).abortSignal(signal)
      if (error) throw error
      total = count ?? 0
      products.push(...(data ?? []) as Product[])
      if (start + 1000 >= total) break
    }
    return { products, count: total }
  }, [scopeKey, publicOnly, page, pages])
  const { data, ...state } = useLiveQuery(query, { products: [] as Product[], count: 0 })
  async function updateProduct(id: string, input: Partial<ProductInput>) {
    const result = await supabase.from('products').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (!result.error) notifyCatalogChanged()
    return result
  }
  return { ...data, ...state, updateProduct }
}
