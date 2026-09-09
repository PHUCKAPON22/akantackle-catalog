import { useEffect, useState, type ChangeEvent } from 'react'
import { Pencil, Upload } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { LogoArtwork } from '@/components/LogoArtwork'
import { supabase } from '@/lib/supabase'
import { uploadHeroFloatingImage, uploadLogo, deleteStorageImage, deleteStorageImages, cleanupUnusedUpload, prepareImage, IMAGE_ACCEPT } from '@/lib/storage'
import { DEFAULT_LOGO, errorMessage, logoGeometry, notifyCatalogChanged } from '@/lib/catalog'
import { useHeroImages } from '@/hooks/useHeroImages'
import type { LogoLayout } from '@/types/catalog'
export function HeroImagesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { logo, floating, loading, error: loadError, refetch } = useHeroImages()
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(DEFAULT_LOGO)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])
  async function beginEdit() {
    if (!logo) return
    setError(''); setSuccess(''); setBusy(true)
    try {
      const image = new Image(); image.src = logo.image_url; await image.decode()
      setDraft(logo.layout ?? { ...DEFAULT_LOGO, width: image.naturalWidth, height: image.naturalHeight })
      setPreview(logo.image_url); setFile(null); setEditing(true)
    } catch { setError('The logo could not be loaded. Choose a replacement image.') } finally { setBusy(false) }
  }
  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]; event.target.value = ''
    if (!selectedFile) return
    setBusy(true); setError(''); setSuccess('')
    try {
      const prepared = await prepareImage(selectedFile)
      setFile(prepared.file); setPreview(URL.createObjectURL(prepared.file))
      setDraft({ ...DEFAULT_LOGO, width: prepared.width, height: prepared.height }); setEditing(true)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function saveLogo() {
    if (!preview || busy) return
    setBusy(true); setError(''); setSuccess('')
    let newUrl: string | null = null
    let committed = false
    try {
      if (file) { const result = await uploadLogo(file); if (result.error || !result.url) throw new Error(result.error ?? 'Logo upload failed.'); newUrl = result.url }
      const url = newUrl ?? logo?.image_url
      if (!url) throw new Error('Choose a logo image first.')
      const values = { image_url: url, layout: draft }
      const request = logo ? supabase.from('hero_images').update(values).eq('id', logo.id) : supabase.from('hero_images').insert({ ...values, kind: 'logo' })
      const { error } = await request.select('id').single()
      if (error) throw error
      committed = true
      if (newUrl && logo?.image_url) {
        const cleanup = await deleteStorageImage(logo.image_url)
        if (cleanup) setError(`Logo saved, but the previous file could not be removed: ${cleanup}`)
      }
      setEditing(false); setFile(null); setPreview(''); setSuccess('Logo saved. Other devices refresh within 15 seconds.')
      notifyCatalogChanged(); await refetch()
    } catch (err) {
      let message = errorMessage(err)
      if (newUrl && !committed) { const cleanup = await cleanupUnusedUpload(newUrl); if (cleanup) message += ` ${cleanup}` }
      setError(message)
    } finally { setBusy(false) }
  }
  async function addFloating(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, 6 - floating.length)); event.target.value = ''
    if (!files.length) return
    setBusy(true); setError(''); setSuccess('')
    let completed = 0
    const failures: string[] = []
    try {
      for (const selectedFile of files) {
        const result = await uploadHeroFloatingImage(selectedFile)
        if (result.error || !result.url) { failures.push(`${selectedFile.name}: ${result.error}`); continue }
        const { error } = await supabase.from('hero_images').insert({ image_url: result.url, kind: 'floating' })
        if (error) { const cleanup = await cleanupUnusedUpload(result.url); failures.push(`${selectedFile.name}: ${error.message}${cleanup ? ` ${cleanup}` : ''}`) } else completed++
      }
      setSuccess(`${completed} homepage images added.`); setError(failures.join(' ')); notifyCatalogChanged(); await refetch()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function deleteFloating() {
    setBusy(true); setError(''); setSuccess('')
    try {
      const { data, error } = await supabase.from('hero_images').delete().in('id', selected).eq('kind', 'floating').select('id,image_url')
      if (error) throw error
      const cleanup = await deleteStorageImages((data ?? []).map(row => row.image_url))
      if (cleanup) setError(`Images removed from the homepage; storage cleanup needs a retry: ${cleanup}`)
      setSelected([]); setConfirmDelete(false); notifyCatalogChanged(); await refetch()
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  const overflow = logoGeometry(draft).overflow
  return <Dialog open={open} onOpenChange={value => { if (!busy) { setEditing(false); setPreview(''); setSelected([]); setConfirmDelete(false); onOpenChange(value) } }} title="Homepage images" className="max-w-2xl">
    <div className="space-y-6">
      {(error || loadError) && <p role="alert" className="rounded-xl border border-red-900 p-3 text-sm text-red-300">{error || loadError} {loadError && <button onClick={() => void refetch()} className="underline">Retry</button>}</p>}
      {success && <p role="status" className="text-sm text-emerald-300">{success}</p>}
      <section className="space-y-3"><h3 className="font-medium text-white">Homepage logo</h3>
        <p className="text-sm text-zinc-400">Use any image proportions. Fit, zoom and position inside the frame before saving.</p>
        {editing ? <>
          <div className={`rounded-xl border-2 border-dashed ${overflow ? 'border-amber-400' : 'border-emerald-400'} bg-[repeating-conic-gradient(#252525_0%_25%,#191919_0%_50%)] bg-[length:20px_20px]`}><LogoArtwork src={preview} layout={draft} alt="Logo preview" /></div>
          <p role="status" className={`text-sm ${overflow ? 'text-amber-300' : 'text-emerald-300'}`}>{overflow ? 'Outside frame — the overflowing edges will be cropped.' : 'Inside frame — the whole image is visible.'}</p>
          {([{ key: 'scale', label: 'Zoom', min: 0.1, max: 3, step: 0.01 }, { key: 'x', label: 'Horizontal position', min: -100, max: 100, step: 1 }, { key: 'y', label: 'Vertical position', min: -100, max: 100, step: 1 }] as const).map(control => <label key={control.key} className="flex items-center gap-3 text-sm text-zinc-300"><span className="w-40">{control.label}</span><input className="min-w-0 flex-1 accent-red-600" type="range" min={control.min} max={control.max} step={control.step} value={draft[control.key]} aria-label={control.label} disabled={busy} onChange={e => setDraft(value => ({ ...value, [control.key]: Number(e.target.value) }) as LogoLayout)} /><span className="w-14 text-right">{Math.round(draft[control.key] * (control.key === 'scale' ? 100 : 1))}%</span></label>)}
          <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => setDraft(value => ({ ...value, scale: 1, x: 0, y: 0 }))}>Fit image</Button><Button size="sm" disabled={busy} onClick={() => void saveLogo()}>{busy ? 'Saving…' : 'Save logo'}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => { setEditing(false); setFile(null); setPreview('') }}>Cancel edit</Button></div>
        </> : logo ? <div className="rounded-xl border border-border bg-ink p-2"><LogoArtwork src={logo.image_url} layout={logo.layout} /></div> : <div className="rounded-xl border border-dashed border-border p-10 text-center text-zinc-500">No logo yet</div>}
        <div className="flex flex-wrap gap-3">{logo && !editing && <Button size="sm" variant="outline" disabled={busy || loading || !!loadError} onClick={() => void beginEdit()}><Pencil size={14} />Edit logo</Button>}<label className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-zinc-200 ${busy ? 'opacity-40' : ''}`}><Upload size={14} />{logo || editing ? 'Replace image' : 'Choose logo'}<input className="sr-only" aria-label="Choose logo image" type="file" accept={IMAGE_ACCEPT} disabled={busy || loading || !!loadError} onChange={event => void chooseLogo(event)} /></label></div>
        <p className="text-xs text-zinc-500">Up to 20 MB. Images are optimized without upscaling. HEIC support depends on your browser.</p>
      </section>
      <section className="space-y-3 border-t border-border pt-5"><h3 className="font-medium text-white">Floating images ({floating.length}/6)</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">{floating.map(image => <label key={image.id} className="relative aspect-square cursor-pointer rounded-xl border border-border bg-ink p-2"><img src={image.image_url} alt="Homepage image" className="h-full w-full object-contain" /><input aria-label="Select homepage image" type="checkbox" className="absolute left-2 top-2 h-4 w-4 accent-red-600" disabled={busy} checked={selected.includes(image.id)} onChange={e => { setConfirmDelete(false); setSelected(value => e.target.checked ? [...value, image.id] : value.filter(id => id !== image.id)) }} /></label>)}</div>
        <div className="flex flex-wrap gap-2">{floating.length < 6 && <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm text-zinc-200">Add images<input className="sr-only" aria-label="Add floating images" type="file" accept={IMAGE_ACCEPT} multiple disabled={busy || loading || !!loadError} onChange={event => void addFloating(event)} /></label>}{floating.length > 0 && <Button size="sm" variant="outline" disabled={busy} onClick={() => setSelected(selected.length === floating.length ? [] : floating.map(image => image.id))}>Select all</Button>}{selected.length > 0 && <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete {selected.length} selected</Button>}</div>
        {confirmDelete && <div className="rounded-xl border border-red-900 p-4 text-sm text-red-200"><p>Delete {selected.length} selected homepage images and their files? This cannot be undone.</p><div className="mt-3 flex gap-2"><Button size="sm" variant="danger" disabled={busy} onClick={() => void deleteFloating()}>Confirm delete</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button></div></div>}
      </section>
    </div>
  </Dialog>
}
