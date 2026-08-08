import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { useHeroImages } from '@/hooks/useHeroImages'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { FeaturedHero } from '@/components/FeaturedHero'
import { CategoryNav } from '@/components/CategoryNav'
import { ProductCard } from '@/components/ProductCard'
import { ProductModal } from '@/components/ProductModal'
import type { CategorySlug, Product } from '@/types/catalog'

export function CatalogPage() {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const { logo, floating } = useHeroImages()
  const [activeCategory, setActiveCategory] = useState<CategorySlug | 'all'>('all')
  const [selected, setSelected] = useState<Product | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length }
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1
    return c
  }, [products])

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return products
    return products.filter((p) => p.category === activeCategory)
  }, [products, activeCategory])

  return (
    <div className="min-h-screen">
      <Navbar />
      <FeaturedHero logo={logo} floating={floating} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <CategoryNav categories={categories} active={activeCategory} onChange={setActiveCategory} counts={counts} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <p className="text-zinc-400">ยังไม่มีสินค้าในหมวดนี้</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => setSelected(product)} />
            ))}
          </motion.div>
        )}
      </main>

      <Footer />

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
