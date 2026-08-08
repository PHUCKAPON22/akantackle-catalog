import { useState } from 'react'
import { Image, ImageOff, LogOut, Pencil, Trash2, Upload } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { ProductFormDialog } from '@/components/admin/ProductFormDialog'
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog'
import { HeroImagesDialog } from '@/components/admin/HeroImagesDialog'
import { deleteStorageImage } from '@/lib/storage'
import type { Product } from '@/types/catalog'

interface DashboardProps {
  onSignOut: () => void
}

export function Dashboard({ onSignOut }: DashboardProps) {
  const { products, loading, updateProduct, deleteProduct, refetch } = useProducts()
  const { categories } = useCategories()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [heroOpen, setHeroOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(product: Product) {
    if (!confirm(`ลบรูป "${product.name}" ใช่หรือไม่?`)) return
    setDeletingId(product.id)
    const { error } = await deleteProduct(product.id)
    if (!error && product.image_url) await deleteStorageImage(product.image_url)
    setDeletingId(null)
  }

  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name_th ?? slug

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="font-display text-base font-semibold text-white">Akantackle Admin</h1>
            <p className="text-xs text-zinc-500">{products.length} รูปในระบบ</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setHeroOpen(true)}>
              <Image size={16} />
              รูปหน้าแรก
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload size={16} />
              อัพโหลดรูป
            </Button>
            <Button size="sm" variant="ghost" onClick={onSignOut}>
              <LogOut size={15} />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loading ? (
          <p className="py-16 text-center text-sm text-zinc-500">กำลังโหลด...</p>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <p className="mb-4 text-zinc-400">ยังไม่มีรูปในระบบ</p>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload size={16} />
              อัพโหลดรูปแรก
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface"
              >
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-700">
                    <ImageOff size={20} />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
                  <span className="truncate text-[10px] text-zinc-300">{categoryName(product.category)}</span>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setEditing(product)}
                      className="rounded p-1 text-zinc-200 hover:bg-white/20 cursor-pointer"
                      aria-label="แก้ไข"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      className="rounded p-1 text-zinc-200 hover:bg-red-600 cursor-pointer disabled:opacity-40"
                      aria-label="ลบ"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BulkUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} categories={categories} onDone={refetch} />

      <HeroImagesDialog open={heroOpen} onOpenChange={setHeroOpen} />

      <ProductFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        product={editing}
        categories={categories}
        onUpdate={updateProduct}
      />
    </div>
  )
}
