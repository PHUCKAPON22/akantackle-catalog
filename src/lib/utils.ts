import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function nameFromFilename(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, '')
  const cleaned = base.replace(/[_-]+/g, ' ').trim()
  return cleaned || 'สินค้าใหม่'
}
