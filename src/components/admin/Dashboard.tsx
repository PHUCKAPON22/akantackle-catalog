import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, GripVertical, Image, ImageOff, LogOut, Pencil, Upload } from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { ProductFormDialog } from '@/components/admin/ProductFormDialog'
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog'
import { HeroImagesDialog } from '@/components/admin/HeroImagesDialog'
import { CatalogManager } from '@/components/admin/CatalogManager'
import { deleteStorageImages } from '@/lib/storage'
import { catalogLabel, catalogScope, errorMessage, notifyCatalogChanged, PAGE_SIZE } from '@/lib/catalog'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/catalog'
export function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const { categories, loading: catalogsLoading, error: catalogError } = useCategories()
  const [catalog, setCatalog] = useState('all')
  const [page, setPage] = useState(0)
  const { products, count, loading, error: loadError, updateProduct, refetch } = useProducts({ scope: catalogScope(categories, catalog), page })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [heroOpen, setHeroOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  useEffect(() => {
    if (!catalogsLoading && !catalogError && catalog !== 'all' && !categories.some(c => c.slug === catalog)) {
      setCatalog('all'); setPage(0); setSelected([])
    }
  }, [categories, catalogsLoading, catalogError, catalog])
  const visibleSelection = selected.filter(id => products.some(product => product.id === id))
  async function publish(value: boolean) {
    setBusy(true); setError(''); setMessage('')
    try {
      const updates = value ? { review_status: 'approved', status: 'active', updated_at: new Date().toISOString() } : { review_status: 'pending', updated_at: new Date().toISOString() }
      const { data, error } = await supabase.from('products').update(updates).in('id', visibleSelection).select('id')
      if (error) throw error
      setMessage(`${data?.length ?? 0} products ${value ? 'published. Other devices refresh within 15 seconds.' : 'moved to Pending.'}`); setSelected([]); notifyCatalogChanged()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function deleteSelected() {
    setBusy(true); setError(''); setMessage('')
    try {
      const { data: images, error: imageError } = await supabase.from('product_images').select('product_id,image_url').in('product_id', visibleSelection)
      if (imageError) throw imageError
      const { data, error } = await supabase.from('products').delete().in('id', visibleSelection).select('id,image_url')
      if (error) throw error
      const deleted = new Set((data ?? []).map(product => product.id))
      const urls = [...(data ?? []).map(product => product.image_url), ...(images ?? []).filter(image => deleted.has(image.product_id)).map(image => image.image_url)].filter(Boolean) as string[]
      const cleanup = await deleteStorageImages(urls)
      if (cleanup) setError(`Products deleted, but some files need cleanup: ${cleanup}`)
      setMessage(`${deleted.size} products deleted.`); setSelected([]); setConfirmDelete(false)
      if (deleted.size === products.length && page > 0) setPage(value => value - 1)
      notifyCatalogChanged()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function move(id: string, before: string | null, after = false) {
    if (busy || catalog === 'all' || id === before) return
    setBusy(true); setError(''); setMessage(''); setDragging(null); setDropTarget(null)
    try {
      const { error } = await supabase.rpc('move_product', { p_id: id, p_before: before, p_catalog: catalog, p_after: after })
      if (error) throw error
      setMessage('Display order saved.'); notifyCatalogChanged(); await refetch()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <div className="min-h-screen">
    <header className="sticky top-0 z-30 border-b border-border bg-ink/95 backdrop-blur-md"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div><h1 className="font-display text-xl font-semibold text-white">Akantackle Admin</h1><p className="text-xs text-zinc-500">{count} products in this view</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setCatalogOpen(true)}>Catalogs</Button><Button size="sm" variant="outline" onClick={() => setHeroOpen(true)}><Image size={15} />Homepage</Button><Button size="sm" onClick={() => setUploadOpen(true)}><Upload size={15} />Upload</Button><a href="/" target="_blank" rel="noreferrer" className="rounded-full border border-border px-4 py-2 text-sm text-zinc-300">View catalog</a><Button size="sm" variant="ghost" onClick={onSignOut}><LogOut size={15} />Sign out</Button></div></div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-3"><div className="w-full sm:w-80"><label htmlFor="admin-catalog" className="mb-1 block text-xs uppercase text-zinc-400">Catalog / sub catalog</label><Select id="admin-catalog" value={catalog} disabled={busy} onChange={event => { setCatalog(event.target.value); setPage(0); setSelected([]) }}><option value="all">All catalogs</option>{categories.map(category => <option key={category.slug} value={category.slug}>{catalogLabel(categories, category.slug)}</option>)}</Select></div><p className="text-sm text-zinc-400">{catalog === 'all' ? 'Choose a catalog to drag products into display order.' : 'Drag the grip to reorder. Arrow buttons also work with touch or keyboard.'}</p></div>
      {(error || loadError || catalogError) && <p role="alert" className="rounded-xl border border-red-900 p-3 text-sm text-red-300">{error || loadError || catalogError} <button className="underline" onClick={() => void refetch()}>Retry refresh</button></p>}{message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3"><label className="mr-2 flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={products.length > 0 && visibleSelection.length === products.length} disabled={busy || loading || !products.length} onChange={e => setSelected(e.target.checked ? products.map(p => p.id) : [])} className="h-4 w-4 accent-red-600" />Select this page ({visibleSelection.length})</label><Button size="sm" disabled={busy || !visibleSelection.length} onClick={() => void publish(true)}>Publish selected</Button><Button size="sm" variant="outline" disabled={busy || !visibleSelection.length} onClick={() => void publish(false)}>Unpublish</Button><Button size="sm" variant="danger" disabled={busy || !visibleSelection.length} onClick={() => setConfirmDelete(true)}>Delete selected</Button></div>
      <p className="text-xs text-zinc-500">Pending products are visible only in Admin. Publish reviewed products to make them visible on other devices.</p>
      {loading ? <p className="py-16 text-center text-zinc-400">Loading…</p> : products.length === 0 ? <div className="rounded-xl border border-dashed border-border py-20 text-center"><p className="mb-4 text-zinc-400">No products in this catalog yet.</p><Button onClick={() => setUploadOpen(true)}>Upload images</Button></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{products.map((product, index) => <article key={product.id} onDragOver={event => { if (dragging && !busy) { event.preventDefault(); setDropTarget(product.id) } }} onDrop={event => { event.preventDefault(); if (dragging) void move(dragging, product.id) }} className={`overflow-hidden rounded-xl border-2 bg-surface ${dropTarget === product.id ? 'border-brand-500' : visibleSelection.includes(product.id) ? 'border-brand-600/70' : 'border-border'}`}>
        <div className="relative aspect-square bg-ink">{product.image_url ? <img src={product.image_url} alt={product.name} draggable={false} className="h-full w-full object-contain p-3" /> : <ImageOff className="absolute left-1/2 top-1/2 text-zinc-600" />}<input aria-label={`Select ${product.name}`} className="absolute left-2 top-2 h-5 w-5 accent-red-600" type="checkbox" disabled={busy} checked={visibleSelection.includes(product.id)} onChange={e => setSelected(value => e.target.checked ? [...value, product.id] : value.filter(id => id !== product.id))} /><button type="button" aria-label={`Drag ${product.name}`} draggable={catalog !== 'all' && !busy} disabled={catalog === 'all' || busy} onDragStart={event => { event.dataTransfer.setData('text/plain', product.id); event.dataTransfer.effectAllowed = 'move'; setDragging(product.id) }} onDragEnd={() => { setDragging(null); setDropTarget(null) }} className="absolute right-2 top-2 cursor-grab rounded bg-black/70 p-1 text-white disabled:opacity-20"><GripVertical size={20} /></button></div>
        <div className="space-y-2 p-3"><p className="truncate text-sm text-white" title={product.name}>{product.name}</p><p className="truncate text-xs text-zinc-500">{catalogLabel(categories, product.category)}</p><span className={`inline-block rounded-full px-2 py-0.5 text-[11px] ${product.review_status === 'approved' && ['active','out_of_stock'].includes(product.status) ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>{product.review_status === 'approved' && ['active','out_of_stock'].includes(product.status) ? 'Published' : 'Pending / hidden'}</span><div className="flex justify-between gap-1"><button aria-label={`Edit ${product.name}`} disabled={busy} onClick={() => setEditing(product)} className="rounded p-1 text-zinc-300 hover:bg-white/10"><Pencil size={16} /></button><div className="flex"><button aria-label={`Move ${product.name} earlier`} disabled={busy || catalog === 'all' || index === 0} onClick={() => void move(product.id, products[index - 1].id)} className="rounded p-1 text-zinc-300 disabled:opacity-20"><ArrowLeft size={16} /></button><button aria-label={`Move ${product.name} later`} disabled={busy || catalog === 'all' || index === products.length - 1} onClick={() => void move(product.id, products[index + 1].id, true)} className="rounded p-1 text-zinc-300 disabled:opacity-20"><ArrowRight size={16} /></button></div></div></div>
      </article>)}</div>}
      <div className="flex items-center justify-between"><Button size="sm" variant="outline" disabled={busy || page === 0} onClick={() => { setPage(value => value - 1); setSelected([]) }}>Previous</Button><span className="text-sm text-zinc-400">Page {page + 1} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}</span><Button size="sm" variant="outline" disabled={busy || (page + 1) * PAGE_SIZE >= count} onClick={() => { setPage(value => value + 1); setSelected([]) }}>Next</Button></div>
    </main>
    <BulkUploadDialog key={catalog} initialCategory={catalog} open={uploadOpen} onOpenChange={setUploadOpen} categories={categories} onDone={() => void refetch()} />
    <HeroImagesDialog open={heroOpen} onOpenChange={setHeroOpen} /><CatalogManager open={catalogOpen} onOpenChange={setCatalogOpen} categories={categories} />
    <ProductFormDialog open={!!editing} onOpenChange={value => !value && setEditing(null)} product={editing} categories={categories} onUpdate={updateProduct} />
    <Dialog open={confirmDelete} onOpenChange={value => !busy && setConfirmDelete(value)} title={`Delete ${visibleSelection.length} selected products?`}><p className="text-sm text-zinc-300">Their images will also be deleted. This cannot be undone.</p><ul className="my-4 max-h-48 overflow-auto text-sm text-zinc-400">{products.filter(p => visibleSelection.includes(p.id)).map(p => <li key={p.id}>{p.name}</li>)}</ul><div className="flex justify-end gap-2"><Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" disabled={busy || !visibleSelection.length} onClick={() => void deleteSelected()}>{busy ? 'Deleting…' : 'Confirm delete'}</Button></div></Dialog>
  </div>
}
