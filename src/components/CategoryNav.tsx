import type { Category, CategorySlug } from '@/types/catalog'
import { cn } from '@/lib/utils'

interface CategoryNavProps {
  categories: Category[]
  active: CategorySlug | 'all'
  onChange: (value: CategorySlug | 'all') => void
  counts: Record<string, number>
}

export function CategoryNav({ categories, active, onChange, counts }: CategoryNavProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
          active === 'all'
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-border bg-surface text-zinc-300 hover:border-brand-600/60 hover:text-white',
        )}
      >
        ทั้งหมด
        <span className="ml-1.5 opacity-70">{counts.all ?? 0}</span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onChange(cat.slug)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
            active === cat.slug
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-border bg-surface text-zinc-300 hover:border-brand-600/60 hover:text-white',
          )}
        >
          {cat.name_th}
          <span className="ml-1.5 opacity-70">{counts[cat.slug] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
