import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, ProductInput } from '@/types/catalog'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sort_order')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data ?? [])
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function updateProduct(id: string, input: Partial<ProductInput>) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) await refetch()
    return { data, error }
  }

  async function deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) await refetch()
    return { error }
  }

  return { products, loading, error, refetch, updateProduct, deleteProduct }
}
