import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Select, Label } from '@/components/ui/Input'
import { uploadProductImage, deleteStorageImage, cleanupUnusedUpload, IMAGE_ACCEPT } from '@/lib/storage'
import { catalogLabel, errorMessage } from '@/lib/catalog'
import type { Category, Product, ProductInput } from '@/types/catalog'
interface Props { open: boolean; onOpenChange: (open: boolean) => void; product: Product | null; categories: Category[]; onUpdate: (id: string, input: Partial<ProductInput>) => Promise<{ error: { message: string } | null }> }
export function ProductFormDialog({ open, onOpenChange, product, categories, onUpdate }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [published, setPublished] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!open || !product) return
    setName(product.name); setCategory(product.category); setPublished(product.review_status === 'approved' && ['active','out_of_stock'].includes(product.status)); setPreview(product.image_url ?? ''); setFile(null); setError('')
  }, [open, product])
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])
  async function save(event: FormEvent) {
    event.preventDefault(); if (!product) return
    setSaving(true); setError('')
    let uploaded: string | null = null
    let committed = false
    try {
      if (file) { const result = await uploadProductImage(file); if (result.error || !result.url) throw new Error(result.error ?? 'Image upload failed.'); uploaded = result.url }
      const result = await onUpdate(product.id, { name: name.trim(), category, image_url: uploaded ?? product.image_url, review_status: published ? 'approved' : 'pending', status: published ? 'active' : product.status })
      if (result.error) throw result.error
      committed = true
      if (uploaded && product.image_url) { const cleanup = await deleteStorageImage(product.image_url); if (cleanup) { setError(`Product saved. Previous file cleanup failed: ${cleanup}`); return } }
      onOpenChange(false)
    } catch (err) {
      let message = errorMessage(err)
      if (uploaded && !committed) { const cleanup = await cleanupUnusedUpload(uploaded); if (cleanup) message += ` ${cleanup}` }
      setError(message)
    } finally { setSaving(false) }
  }
  return <Dialog open={open} onOpenChange={value => !saving && onOpenChange(value)} title="Edit product"><form onSubmit={save} className="space-y-4">
    <label className="block cursor-pointer rounded-xl border border-dashed border-border bg-ink p-3">{preview && <img src={preview} alt="Product preview" className="max-h-56 w-full object-contain" />}<span className="mt-2 block text-center text-sm text-brand-400">Replace image</span><input type="file" accept={IMAGE_ACCEPT} className="sr-only" disabled={saving} onChange={e => { const selected = e.target.files?.[0]; e.target.value = ''; if (selected) { setFile(selected); setPreview(URL.createObjectURL(selected)) } }} /></label>
    <div><Label htmlFor="product-name">Product name</Label><Input id="product-name" required value={name} disabled={saving} onChange={e => setName(e.target.value)} /></div>
    <div><Label htmlFor="product-catalog">Catalog / sub catalog</Label><Select id="product-catalog" value={category} disabled={saving} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c.slug} value={c.slug}>{catalogLabel(categories, c.slug)}</option>)}</Select></div>
    <label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={published} disabled={saving} onChange={e => setPublished(e.target.checked)} className="accent-red-600" />Reviewed and published on the public catalog</label>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={saving || !name.trim() || !category}>{saving ? 'Saving…' : 'Save product'}</Button></div>
  </form></Dialog>
}
