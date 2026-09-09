import { DEFAULT_LOGO, logoGeometry } from '@/lib/catalog'
import type { LogoLayout } from '@/types/catalog'
export function LogoArtwork({ src, layout, alt = 'Akantackle' }: { src: string; layout?: LogoLayout | null; alt?: string }) {
  const value = layout ?? DEFAULT_LOGO
  const { width, height } = logoGeometry(value)
  return <div className="relative aspect-[3/1] w-full overflow-hidden">
    <img src={src} alt={alt} draggable={false} className="absolute object-contain" style={{ width: `${width * 100}%`, height: `${height * 100}%`, left: `${50 + value.x}%`, top: `${50 + value.y}%`, transform: `translate(-50%, -50%) scale(${value.scale})` }} />
  </div>
}
