import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { errorMessage, notifyCatalogChanged } from '@/lib/catalog'
import type { Category } from '@/types/catalog'
export function CatalogManager({ open, onOpenChange, categories }: { open: boolean; onOpenChange: (value: boolean) => void; categories: Category[] }) {
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('')
    try {
      const clean = name.trim()
      if (!clean) throw new Error('Enter a catalog name.')
      const stem = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'catalog'
      const slug = `${stem.slice(0, 60)}-${crypto.randomUUID().slice(0, 8)}`
      const { error } = await supabase.from('categories').insert({ slug, name_th: clean, name_en: clean, parent_slug: parent || null, sort_order: categories.length + 1 })
      if (error) throw error
      notifyCatalogChanged(); setName(''); setSuccess(`${clean} created.`)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  const roots = categories.filter(c => !c.parent_slug)
  return <Dialog open={open} onOpenChange={value => !busy && onOpenChange(value)} title="Manage catalogs">
    <form onSubmit={create} className="space-y-4">
      <div><Label htmlFor="catalog-parent">Create in</Label><Select id="catalog-parent" value={parent} onChange={e => setParent(e.target.value)} disabled={busy}><option value="">New main catalog</option>{roots.map(c => <option key={c.slug} value={c.slug}>{c.name_en} — new sub catalog</option>)}</Select></div>
      <div><Label htmlFor="catalog-name">Catalog name</Label><Input id="catalog-name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required disabled={busy} /></div>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}{success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
      <Button disabled={busy || !name.trim()}>{busy ? 'Creating…' : parent ? 'Create sub catalog' : 'Create catalog'}</Button>
    </form>
    <div className="mt-6 space-y-3 border-t border-border pt-4">{roots.map(root => <div key={root.slug}><p className="font-medium text-white">{root.name_en}</p>{categories.filter(c => c.parent_slug === root.slug).map(child => <p key={child.slug} className="ml-4 mt-1 text-sm text-zinc-400">↳ {child.name_en}</p>)}</div>)}</div>
  </Dialog>
}
