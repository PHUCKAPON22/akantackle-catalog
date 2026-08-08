import { useState, type DragEvent } from 'react'
import { Check, CloudUpload, LoaderCircle, X } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Select, Label } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { uploadProductImage } from '@/lib/storage'
import { nameFromFilename, cn } from '@/lib/utils'
import type { Category, CategorySlug } from '@/types/catalog'

interface BulkUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onDone: () => void
}

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface QueuedFile {
  file: File
  previewUrl: string
  status: FileStatus
}

export function BulkUploadDialog({ open, onOpenChange, categories, onDone }: BulkUploadDialogProps) {
  const [category, setCategory] = useState<string>(categories[0]?.slug ?? '')
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const next = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file), status: 'pending' as FileStatus }))
    setQueue((q) => [...q, ...next])
  }

  function removeFile(index: number) {
    setQueue((q) => q.filter((_, i) => i !== index))
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  function reset() {
    setQueue([])
    setUploading(false)
  }

  async function handleUploadAll() {
    if (!category || queue.length === 0) return
    setUploading(true)

    for (let i = 0; i < queue.length; i++) {
      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)))
      const { file } = queue[i]
      const { url, error: uploadError } = await uploadProductImage(file)

      if (uploadError || !url) {
        setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: 'error' } : item)))
        continue
      }

      const { error: insertError } = await supabase.from('products').insert({
        name: nameFromFilename(file.name),
        category: category as CategorySlug,
        image_url: url,
      })

      setQueue((q) => q.map((item, idx) => (idx === i ? { ...item, status: insertError ? 'error' : 'done' } : item)))
    }

    setUploading(false)
    onDone()
  }

  const doneCount = queue.filter((q) => q.status === 'done').length
  const allDone = queue.length > 0 && queue.every((q) => q.status === 'done' || q.status === 'error')

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
      title="อัพโหลดรูปหลายไฟล์"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="bulk-category">หมวดหมู่ (ใช้กับทุกรูปที่เลือก)</Label>
          <Select id="bulk-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={uploading}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name_th}
              </option>
            ))}
          </Select>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 text-center transition-colors',
            dragOver ? 'border-brand-500 bg-brand-600/5' : 'border-border bg-surface-2',
          )}
        >
          <CloudUpload size={28} className="text-zinc-500" />
          <p className="text-sm text-zinc-400">ลากรูปมาวางตรงนี้ หรือ</p>
          <label className="cursor-pointer text-sm font-medium text-brand-400 hover:text-brand-300">
            เลือกไฟล์จากเครื่อง
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>

        {queue.length > 0 && (
          <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
            {queue.map((item, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-surface-2">
                <img src={item.previewUrl} alt="" className="h-full w-full object-contain p-1" />
                {item.status === 'pending' && !uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white cursor-pointer"
                    aria-label="ลบออกจากคิว"
                  >
                    <X size={11} />
                  </button>
                )}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <LoaderCircle size={16} className="animate-spin text-white" />
                  </div>
                )}
                {item.status === 'done' && (
                  <div className="absolute right-1 top-1 rounded-full bg-emerald-600 p-0.5 text-white">
                    <Check size={11} />
                  </div>
                )}
                {item.status === 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 text-red-300">
                    <X size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {allDone && (
          <p className="text-sm text-emerald-400">
            อัพโหลดสำเร็จ {doneCount} จาก {queue.length} รูป
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>
            {allDone ? 'เสร็จสิ้น' : 'ยกเลิก'}
          </Button>
          {!allDone && (
            <Button type="button" onClick={handleUploadAll} disabled={uploading || queue.length === 0 || !category}>
              {uploading && <LoaderCircle size={15} className="animate-spin" />}
              {uploading ? 'กำลังอัพโหลด...' : `อัพโหลด ${queue.length || ''} รูป`}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  )
}
