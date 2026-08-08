import { useRef, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import type { Product } from '@/types/catalog'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 22 })
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 22 })
  const scale = useSpring(1, { stiffness: 300, damping: 22 })

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleLeave() {
    x.set(0)
    y.set(0)
    scale.set(1)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => scale.set(1.045)}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, scale, transformPerspective: 900 }}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-[border-color,box-shadow] duration-300 hover:border-brand-600/60 hover:shadow-glow"
    >
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-zinc-700">
          <ImageOff size={26} strokeWidth={1.5} />
        </div>
      )}
    </motion.div>
  )
}
