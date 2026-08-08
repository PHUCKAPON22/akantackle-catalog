export const CATEGORY_SLUGS = [
  'rods',
  'reels',
  'lures',
  'fishing-line',
  'accessories',
] as const

export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

export interface Category {
  slug: CategorySlug
  name_th: string
  name_en: string
  sort_order: number
}

export interface Product {
  id: string
  name: string
  category: CategorySlug
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>

export type HeroImageKind = 'logo' | 'floating'

export interface HeroImage {
  id: string
  image_url: string
  kind: HeroImageKind
  sort_order: number
  created_at: string
}
