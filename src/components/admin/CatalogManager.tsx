import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { errorMessage, notifyCatalogChanged } from '@/lib/catalog'
import type { Category } from '@/types/catalog'

type CatalogUsage = { products: number; children: number }
export function CatalogManager({ open, onOpenChange, categories }: { open: boolean; onOpenChange: (value: boolean) => void; categories: Category[] }) {
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [usage, setUsage] = useState<CatalogUsage | null>(null)
  const roots = categories.filter(c => !c.parent_slug)
  const validParent = roots.some(c => c.slug === parent) ? parent : ''

  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try {
      const clean = name.trim()
      if (!clean) throw new Error('Enter a catalog name.')
      const stem = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'catalog'
      const slug = `${stem.slice(0, 60)}-${crypto.randomUUID().slice(0, 8)}`
      const { error } = await supabase.from('categories').insert({ slug, name_th: clean, name_en: clean, parent_slug: validParent || null, sort_order: categories.length + 1 })
      if (error) throw error
      notifyCatalogChanged(); setName(''); setSuccess(`${clean} created.`)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  async function checkDeletion(category: Category) {
    setDeleting(category); setUsage(null); setBusy(true); setError(''); setSuccess('')
    try {
      // Count every product, including Pending/hidden records; public counts are unsuitable here.
      const [products, children] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('category', category.slug).limit(1),
        supabase.from('categories').select('slug', { count: 'exact' }).eq('parent_slug', category.slug).limit(1),
      ])
      if (products.error) throw products.error
      if (children.error) throw children.error
      if (products.count === null || children.count === null) throw new Error('Could not check this catalog. Please try again.')
      setUsage({ products: products.count, children: children.count })
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }

  async function deleteCatalog() {
    if (!deleting || !usage || usage.products || usage.children || busy) return
    setBusy(true); setError('')
    try {
      // Existing RESTRICT foreign keys also protect concurrent product/sub-catalog inserts.
      const { data, error } = await supabase.from('categories').delete().eq('slug', deleting.slug).select('slug').single()
      if (error?.code === '23503') throw new Error('This catalog now contains products or sub catalogs. Move its products and delete its sub catalogs first, then check again.')
      if (error?.code === 'PGRST116' || (!error && !data)) throw new Error('The catalog was not deleted. It may already be removed, or your admin access has changed. Close this dialog and refresh.')
      if (error) throw error
      if (parent === deleting.slug) setParent('')
      setSuccess(`${deleting.name_en} deleted.`); setDeleting(null); setUsage(null)
    } catch (err) { setError(errorMessage(err)); setUsage(null) }
    finally { setBusy(false); notifyCatalogChanged() }
  }

  function close(value: boolean) {
    if (busy) return
    if (!value) { setDeleting(null); setUsage(null); setError(''); setSuccess('') }
    onOpenChange(value)
  }
  const canDelete = usage !== null && usage.products === 0 && usage.children === 0
  function row(category: Category) {
    return <div className="flex items-center justify-between gap-3 py-1">
      <p className={`min-w-0 break-words ${category.parent_slug ? 'text-sm text-zinc-400' : 'font-medium text-white'}`}>{category.parent_slug && '↳ '}{category.name_en}</p>
      <Button size="sm" variant="ghost" className="shrink-0 text-red-400 hover:text-red-300" aria-label={`Delete ${category.name_en}`} disabled={busy} onClick={() => void checkDeletion(category)}><Trash2 size={15} />Delete</Button>
    </div>
  }
  return <Dialog open={open} onOpenChange={close} title={deleting ? `Delete ${deleting.parent_slug ? 'sub catalog' : 'catalog'}?` : 'Manage catalogs'}>
    {deleting ? <div className="space-y-4">
      <p className="break-words text-lg font-medium text-white">{deleting.name_en}</p>
      {busy && !usage && !error && <p role="status" className="text-sm text-zinc-400">Checking products and sub catalogs…</p>}
      {usage && <div className="space-y-2 text-sm text-zinc-300">
        {usage.products > 0 && <p>This catalog contains {usage.products} product{usage.products === 1 ? '' : 's'}, including any Pending or hidden items. Move or reassign them before deleting this catalog.</p>}
        {usage.children > 0 && <p>This catalog contains {usage.children} sub catalog{usage.children === 1 ? '' : 's'}. Delete those sub catalogs first.</p>}
        {canDelete && <p>This catalog is empty. Delete it permanently?</p>}
      </div>}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" disabled={busy} onClick={() => { setDeleting(null); setUsage(null); setError('') }}>Back</Button>
        {canDelete ? <Button variant="danger" disabled={busy} onClick={() => void deleteCatalog()}>{busy ? 'Deleting…' : 'Confirm delete'}</Button> : <Button variant="outline" disabled={busy} onClick={() => void checkDeletion(deleting)}>Check again</Button>}
      </div>
    </div> : <>
      <form onSubmit={create} className="space-y-4">
        <div><Label htmlFor="catalog-parent">Create in</Label><Select id="catalog-parent" value={validParent} onChange={e => setParent(e.target.value)} disabled={busy}><option value="">New main catalog</option>{roots.map(c => <option key={c.slug} value={c.slug}>{c.name_en} — new sub catalog</option>)}</Select></div>
        <div><Label htmlFor="catalog-name">Catalog name</Label><Input id="catalog-name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required disabled={busy} /></div>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}{success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
        <Button disabled={busy || !name.trim()}>{busy ? 'Creating…' : validParent ? 'Create sub catalog' : 'Create catalog'}</Button>
      </form>
      <div className="mt-6 space-y-3 border-t border-border pt-4">
        <p className="text-xs text-zinc-500">Delete empty catalogs here. Move products first, and delete sub catalogs before their main catalog.</p>
        {roots.map(root => <div key={root.slug}>{row(root)}<div className="ml-4">{categories.filter(c => c.parent_slug === root.slug).map(child => <div key={child.slug}>{row(child)}</div>)}</div></div>)}
      </div>
    </>}
  </Dialog>
}
