import { useRef, type CSSProperties, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import type { HeroImage } from '@/types/catalog'
import { LogoArtwork } from './LogoArtwork'

interface Slot {
  left: string
  top: string
  size: number
  depth: number
  duration: number
  delay: number
  rotate: number
}

const SLOTS: Slot[] = [
  { left: '16%', top: '26%', size: 128, depth: 26, duration: 6.5, delay: 0, rotate: -8 },
  { left: '80%', top: '20%', size: 104, depth: 18, duration: 7.2, delay: 0.4, rotate: 10 },
  { left: '9%', top: '72%', size: 92, depth: 14, duration: 8, delay: 0.8, rotate: 6 },
  { left: '87%', top: '68%', size: 124, depth: 22, duration: 6.8, delay: 0.2, rotate: -6 },
  { left: '50%', top: '84%', size: 88, depth: 12, duration: 7.6, delay: 1.1, rotate: 4 },
  { left: '38%', top: '10%', size: 84, depth: 16, duration: 6.2, delay: 0.6, rotate: -10 },
]

function FloatingItem({
  image,
  slot,
  mouseX,
  mouseY,
}: {
  image: HeroImage
  slot: Slot
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}) {
  const px = useSpring(useTransform(mouseX, [-0.5, 0.5], [-slot.depth, slot.depth]), {
    stiffness: 120,
    damping: 20,
  })
  const py = useSpring(useTransform(mouseY, [-0.5, 0.5], [-slot.depth, slot.depth]), {
    stiffness: 120,
    damping: 20,
  })

  return (
    <motion.div
      className="absolute"
      style={{
        left: slot.left,
        top: slot.top,
        width: slot.size,
        height: slot.size,
        marginLeft: -slot.size / 2,
        marginTop: -slot.size / 2,
        x: px,
        y: py,
      }}
    >
      <div
        className="h-full w-full animate-float"
        style={
          {
            animationDuration: `${slot.duration}s`,
            animationDelay: `${slot.delay}s`,
            '--float-rot': `${slot.rotate - 4}deg`,
            '--float-rot-alt': `${slot.rotate + 4}deg`,
          } as CSSProperties
        }
      >
        <img
          src={image.image_url}
          alt=""
          className="h-full w-full object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.55)]"
        />
      </div>
    </motion.div>
  )
}

interface FeaturedHeroProps {
  logo: HeroImage | null
  floating: HeroImage[]
}

export function FeaturedHero({ logo, floating }: FeaturedHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const items = floating.slice(0, SLOTS.length)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative h-[340px] w-full overflow-hidden bg-ink sm:h-[420px]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(239,35,60,0.22), transparent 70%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
        {logo ? (
          <div className="w-[70%] max-w-[540px]"><LogoArtwork src={logo.image_url} layout={logo.layout} /></div>
        ) : (
          <div className="text-center">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.3em] text-brand-400">
              Akantackle
            </span>
            <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-white sm:text-6xl">
              Tackle Catalog
            </h1>
          </div>
        )}
      </div>

      {items.map((image, i) => (
        <FloatingItem key={image.id} image={image} slot={SLOTS[i]} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  )
}
