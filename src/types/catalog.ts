export type CategorySlug = string
export interface Category { slug: string; name_th: string; name_en: string; sort_order: number; parent_slug: string | null }
export interface Product {
  id: string
  name: string
  category: string
  image_url: string | null
  sort_order: number
  review_status: 'pending' | 'approved'
  status: 'active' | 'out_of_stock' | 'discontinued' | 'hidden'
  created_at: string
  updated_at: string
}
export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>
export interface LogoLayout { scale: number; x: number; y: number; width: number; height: number }
export type HeroImageKind = 'logo' | 'floating'
export interface HeroImage { id: string; image_url: string; kind: HeroImageKind; sort_order: number; created_at: string; layout: LogoLayout | null }
