import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Select, Label } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { uploadProductImage, cleanupUnusedUpload, IMAGE_ACCEPT } from '@/lib/storage'
import { nameFromFilename } from '@/lib/utils'
import { catalogLabel, errorMessage, notifyCatalogChanged } from '@/lib/catalog'
import type { Category } from '@/types/catalog'
interface QueuedFile { id: string; file: File; preview: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }
interface Props { open: boolean; onOpenChange: (open: boolean) => void; categories: Category[]; onDone: () => void; initialCategory?: string }
export function BulkUploadDialog({ open, onOpenChange, categories, onDone, initialCategory }: Props) {
  const [category, setCategory] = useState(initialCategory && initialCategory !== 'all' ? initialCategory : '')
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [publish, setPublish] = useState(false)
  const currentQueue = useRef(queue); currentQueue.current = queue
  useEffect(() => () => currentQueue.current.forEach(item => URL.revokeObjectURL(item.preview)), [])
  const selectedCategory = category || categories.find(c => !c.parent_slug)?.slug || ''
  function addFiles(files: FileList | null) {
    if (!files || uploading) return
    setQueue(value => [...value, ...Array.from(files).slice(0, Math.max(0, 100 - value.length)).map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), status: 'pending' as const }))])
  }
  function close(next: boolean) {
    if (uploading) return
    if (!next) { queue.forEach(item => URL.revokeObjectURL(item.preview)); setQueue([]); setPublish(false) }
    onOpenChange(next)
  }
  function status(id: string, values: Partial<QueuedFile>) { setQueue(items => items.map(item => item.id === id ? { ...item, ...values } : item)) }
  async function uploadAll() {
    if (uploading || !selectedCategory) return
    setUploading(true)
    const pending = queue.filter(item => item.status !== 'done')
    let cursor = 0
    async function worker() {
      while (cursor < pending.length) {
        const item = pending[cursor++]; status(item.id, { status: 'uploading', error: undefined })
        let url: string | null = null
        try {
          const existing = await supabase.from('products').select('id').eq('id', item.id).maybeSingle()
          if (existing.error) throw existing.error
          if (existing.data) { status(item.id, { status: 'done' }); continue }
          const result = await uploadProductImage(item.file)
          if (result.error || !result.url) throw new Error(result.error ?? 'Upload failed.')
          url = result.url
          const { error } = await supabase.from('products').insert({ id: item.id, name: nameFromFilename(item.file.name), category: selectedCategory, image_url: url, review_status: publish ? 'approved' : 'pending', status: 'active' })
          if (error) throw error
          status(item.id, { status: 'done' })
        } catch (err) {
          const cleanup = url ? await cleanupUnusedUpload(url) : null
          status(item.id, { status: 'error', error: errorMessage(err) + (cleanup ? ` ${cleanup}` : '') })
        }
      }
    }
    try { await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker)); notifyCatalogChanged(); onDone() } finally { setUploading(false) }
  }
  function drop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); addFiles(event.dataTransfer.files) }
  const done = queue.filter(item => item.status === 'done').length
  return <Dialog open={open} onOpenChange={close} title="Upload product images" className="max-w-3xl">
    <div className="space-y-4"><div><Label htmlFor="upload-catalog">Catalog / sub catalog</Label><Select id="upload-catalog" value={selectedCategory} disabled={uploading} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c.slug} value={c.slug}>{catalogLabel(categories, c.slug)}</option>)}</Select></div>
      <div onDragOver={e => e.preventDefault()} onDrop={drop} className="rounded-xl border-2 border-dashed border-border bg-ink p-8 text-center"><p className="mb-3 text-sm text-zinc-400">Drop images here, or choose up to 100 files.</p><label className="cursor-pointer text-brand-400">Choose images<input type="file" className="sr-only" accept={IMAGE_ACCEPT} multiple disabled={uploading} onChange={e => { addFiles(e.target.files); e.target.value = '' }} /></label><p className="mt-2 text-xs text-zinc-500">Up to 20 MB each. Images are optimized for the catalog.</p></div>
      <div className="grid max-h-72 grid-cols-3 gap-3 overflow-auto sm:grid-cols-5">{queue.map(item => <div key={item.id} className="rounded-xl border border-border bg-ink p-2"><img src={item.preview} alt={item.file.name} className="aspect-square w-full object-contain" /><p className="mt-1 truncate text-xs text-zinc-400">{item.file.name}</p><p className={`text-xs ${item.status === 'error' ? 'text-red-300' : item.status === 'done' ? 'text-emerald-300' : 'text-zinc-300'}`}>{item.status}</p>{item.error && <p className="text-xs text-red-300">{item.error}</p>}{!uploading && item.status !== 'done' && <button className="mt-1 text-xs text-zinc-400 underline" onClick={() => { URL.revokeObjectURL(item.preview); setQueue(items => items.filter(value => value.id !== item.id)) }}>Remove</button>}</div>)}</div>
      <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm text-zinc-300"><input type="checkbox" checked={publish} disabled={uploading || done > 0} onChange={e => setPublish(e.target.checked)} className="mt-1 accent-red-600" /><span>I have reviewed these images. Publish after upload.<span className="mt-1 block text-xs text-zinc-500">Leave unchecked to save as Pending. Only published products appear on other devices.</span></span></label>
      {queue.length > 0 && <p role="status" className="text-sm text-zinc-300">{done} of {queue.length} uploaded{done > 0 ? publish ? ' · Published' : ' · Pending review' : ''}</p>}
      <div className="flex justify-end gap-2"><Button variant="ghost" disabled={uploading} onClick={() => close(false)}>{done ? 'Done' : 'Cancel'}</Button><Button disabled={uploading || !selectedCategory || !queue.length || done === queue.length} onClick={() => void uploadAll()}>{uploading ? 'Uploading…' : queue.some(item => item.status === 'error') ? 'Retry failed images' : 'Upload images'}</Button></div>
    </div>
  </Dialog>
}
