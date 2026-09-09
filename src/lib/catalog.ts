import type { Category, LogoLayout } from '../types/catalog.ts'
export const PAGE_SIZE = 48
export const LIVE_REFRESH_MS = 15000
export const DEFAULT_LOGO: LogoLayout = { scale: 1, x: 0, y: 0, width: 3, height: 1 }
export function catalogScope(categories: Category[], slug: string): string[] {
  if (slug === 'all') return []
  return [slug, ...categories.filter(c => c.parent_slug === slug).map(c => c.slug)]
}
export function catalogLabel(categories: Category[], slug: string) {
  const category = categories.find(c => c.slug === slug)
  const parent = categories.find(c => c.slug === category?.parent_slug)
  return `${parent ? `${parent.name_en} / ` : ''}${category?.name_en ?? slug}`
}
export function logoGeometry(layout: LogoLayout) {
  const ratio = layout.width / Math.max(layout.height, 1)
  const width = Math.min(1, ratio / 3)
  const height = Math.min(1, 3 / ratio)
  const overflow = Math.abs(layout.x / 100) + width * layout.scale / 2 > 0.5001 || Math.abs(layout.y / 100) + height * layout.scale / 2 > 0.5001
  return { width, height, overflow }
}
export function errorMessage(error: unknown) {
  return error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Something went wrong. Please try again.'
}
export function notifyCatalogChanged() { window.dispatchEvent(new Event('catalog-changed')) }
