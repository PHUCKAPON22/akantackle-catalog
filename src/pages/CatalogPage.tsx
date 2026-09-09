import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useHeroImages } from '@/hooks/useHeroImages'
import { useLiveQuery } from '@/hooks/useLiveQuery'
import { supabase } from '@/lib/supabase'
import { catalogScope } from '@/lib/catalog'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { FeaturedHero } from '@/components/FeaturedHero'
import { CategoryNav } from '@/components/CategoryNav'
import { ProductCard } from '@/components/ProductCard'
import { ProductModal } from '@/components/ProductModal'
import type { Product } from '@/types/catalog'
function ProductListing({ scope, onSelect }: { scope: string[]; onSelect: (product: Product) => void }) {
  const [pages, setPages] = useState(1)
  const { products, count, loading, error, refetch } = useProducts({ scope, publicOnly: true, pages })
  const more = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!more.current || loading || products.length >= count || error) return
    const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) setPages(value => value + 1) }, { rootMargin: '250px' })
    observer.observe(more.current)
    return () => observer.disconnect()
  }, [loading, count, products.length, error])
  return <>
    {error && <div role="alert" className="mb-4 rounded-xl border border-red-900 p-4 text-red-300">We couldn’t refresh the catalog. <button className="underline" onClick={() => void refetch()}>Try again</button></div>}
    {loading && products.length === 0 ? <p className="py-20 text-center text-zinc-400">Loading catalog…</p> : products.length === 0 ?
      <div className="rounded-2xl border border-dashed border-border py-24 text-center text-zinc-400">No published products in this catalog yet.</div> :
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{products.map(product => <ProductCard key={product.id} product={product} onClick={() => onSelect(product)} />)}</div>}
    <div ref={more} className="py-6 text-center">{products.length < count && <button disabled={loading} className="rounded-full border border-border px-6 py-2 text-sm text-zinc-300" onClick={() => setPages(value => value + 1)}>{loading ? 'Loading…' : 'Load more'}</button>}</div>
  </>
}
export function CatalogPage() {
  const { categories, error: categoryError } = useCategories()
  const { logo, floating } = useHeroImages()
  const [chosenCategory, setActiveCategory] = useState('all')
  const [chosenSub, setActiveSub] = useState('all')
  const activeCategory = categories.some(c => c.slug === chosenCategory && !c.parent_slug) ? chosenCategory : 'all'
  const activeSub = categories.some(c => c.slug === chosenSub && c.parent_slug === activeCategory) ? chosenSub : 'all'
  const [selected, setSelected] = useState<Product | null>(null)
  const query = useCallback(async () => { const { data, error } = await supabase.rpc('catalog_counts'); if (error) throw error; return data as { category: string; total: number }[] }, [])
  const { data: totals } = useLiveQuery(query, [])
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: 0 }
    for (const row of totals) {
      const count = Number(row.total); result.all += count; result[row.category] = (result[row.category] ?? 0) + count
      const parent = categories.find(c => c.slug === row.category)?.parent_slug
      if (parent) result[parent] = (result[parent] ?? 0) + count
    }
    return result
  }, [totals, categories])
  const scope = catalogScope(categories, activeSub === 'all' ? activeCategory : activeSub)
  const children = categories.filter(c => c.parent_slug === activeCategory)
  return <div className="min-h-screen">
    <Navbar /><FeaturedHero logo={logo} floating={floating} />
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {categoryError && <p role="alert" className="mb-3 text-red-300">Catalog names could not be refreshed.</p>}
      <div className="mb-6 space-y-3"><CategoryNav categories={categories.filter(c => !c.parent_slug)} active={activeCategory} onChange={value => { setActiveCategory(value); setActiveSub('all') }} counts={counts} />
        {children.length > 0 && <CategoryNav categories={children} active={activeSub} onChange={setActiveSub} counts={{ ...counts, all: counts[activeCategory] ?? 0 }} />}
      </div>
      <ProductListing key={activeCategory + '/' + activeSub} scope={scope} onSelect={setSelected} />
    </main><Footer /><ProductModal product={selected} onClose={() => setSelected(null)} />
  </div>
}
