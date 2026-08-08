import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus, LoaderCircle } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Select, Label } from '@/components/ui/Input'
import { uploadProductImage, deleteStorageImage } from '@/lib/storage'
import { nameFromFilename } from '@/lib/utils'
import type { Category, Product, ProductInput } from '@/types/catalog'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  onUpdate: (id: string, input: Partial<ProductInput>) => Promise<{ error: { message: string } | null }>
}

export function ProductFormDialog({ open, onOpenChange, product, categories, onUpdate }: ProductFormDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !product) return
    setName(product.name)
    setCategory(product.category)
    setPreviewUrl(product.image_url)
    setFile(null)
    setError(null)
  }, [open, product])

  function handleFileChange(f: File | null) {
    setFile(f)
    setPreviewUrl(f ? URL.createObjectURL(f) : product?.image_url ?? null)
    if (f) setName((current) => current || nameFromFilename(f.name))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!product) return
    setSaving(true)
    setError(null)

    let imageUrl = product.image_url
    if (file) {
      const { url, error: uploadError } = await uploadProductImage(file)
      if (uploadError || !url) {
        setError(`อัปโหลดรูปไม่สำเร็จ: ${uploadError}`)
        setSaving(false)
        return
      }
      imageUrl = url
    }

    const result = await onUpdate(product.id, {
      name: name.trim() || 'สินค้าใหม่',
      category: category as ProductInput['category'],
      image_url: imageUrl,
    })

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
      return
    }

    if (file && product.image_url && product.image_url !== imageUrl) {
      await deleteStorageImage(product.image_url)
    }

    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="แก้ไขสินค้า">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface-2 transition-colors hover:border-brand-500">
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="h-full w-full object-contain p-3" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <ImagePlus size={24} />
              <span className="text-xs">คลิกเพื่อเปลี่ยนรูป</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </label>

        <div>
          <Label htmlFor="category">หมวดหมู่</Label>
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name_th}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="name">ชื่อ (สำหรับ admin ดูภายใน ไม่แสดงบนหน้าเว็บ)</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <LoaderCircle size={15} className="animate-spin" />}
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
