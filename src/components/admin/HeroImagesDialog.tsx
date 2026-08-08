import { useRef, useState, type DragEvent } from 'react'
import { CloudUpload, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { supabase } from '@/lib/supabase'
import { uploadHeroFloatingImage, uploadLogo, deleteStorageImage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { useHeroImages } from '@/hooks/useHeroImages'

const MAX_FLOATING = 6

interface HeroImagesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HeroImagesDialog({ open, onOpenChange }: HeroImagesDialogProps) {
  const { logo, floating, refetch } = useHeroImages()
  const [savingLogo, setSavingLogo] = useState(false)
  const [uploadingFloating, setUploadingFloating] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  async function handleLogoChange(file: File | null) {
    if (!file) return
    setSavingLogo(true)
    const { url, error } = await uploadLogo(file)
    if (url && !error) {
      const oldUrl = logo?.image_url
      if (logo) {
        await supabase.from('hero_images').update({ image_url: url }).eq('id', logo.id)
      } else {
        await supabase.from('hero_images').insert({ image_url: url, kind: 'logo' })
      }
      if (oldUrl && oldUrl !== url) await deleteStorageImage(oldUrl)
      await refetch()
    }
    setSavingLogo(false)
  }

  async function addFloatingFiles(fileList: FileList | null) {
    if (!fileList) return
    const room = MAX_FLOATING - floating.length
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, Math.max(room, 0))
    if (files.length === 0) return

    setUploadingFloating(true)
    for (const file of files) {
      const { url, error } = await uploadHeroFloatingImage(file)
      if (url && !error) {
        await supabase.from('hero_images').insert({ image_url: url, kind: 'floating' })
      }
    }
    await refetch()
    setUploadingFloating(false)
  }

  async function handleDeleteFloating(id: string, url: string) {
    await supabase.from('hero_images').delete().eq('id', id)
    await deleteStorageImage(url)
    await refetch()
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    addFloatingFiles(e.dataTransfer.files)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="รูปหน้าแรก (โลโก้ + รูปลอย)" className="max-w-xl">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">โลโก้ (อยู่กลางหน้าแรก ไม่ลอย)</p>
          <label className="flex aspect-[3/1] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface-2 transition-colors hover:border-brand-500">
            {savingLogo ? (
              <LoaderCircle size={22} className="animate-spin text-zinc-400" />
            ) : logo ? (
              <img src={logo.image_url} alt="โลโก้" className="h-full w-full object-contain p-4" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-500">
                <ImagePlus size={22} />
                <span className="text-xs">คลิกเพื่ออัพโหลดโลโก้</span>
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            รูปลอยรอบโลโก้ ({floating.length}/{MAX_FLOATING}) — ใช้รูป dicut พื้นหลังโปร่งใส
          </p>

          {floating.length > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {floating.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-surface-2">
                  <img src={img.image_url} alt="" className="h-full w-full object-contain p-1" />
                  <button
                    onClick={() => handleDeleteFloating(img.id, img.image_url)}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
                    aria-label="ลบ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {floating.length < MAX_FLOATING && (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-center transition-colors',
                dragOver ? 'border-brand-500 bg-brand-600/5' : 'border-border bg-surface-2',
              )}
            >
              {uploadingFloating ? (
                <LoaderCircle size={22} className="animate-spin text-zinc-400" />
              ) : (
                <>
                  <CloudUpload size={22} className="text-zinc-500" />
                  <p className="text-xs text-zinc-400">ลากรูปมาวาง หรือ</p>
                  <label className="cursor-pointer text-sm font-medium text-brand-400 hover:text-brand-300">
                    เลือกไฟล์
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => addFloatingFiles(e.target.files)}
                    />
                  </label>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
