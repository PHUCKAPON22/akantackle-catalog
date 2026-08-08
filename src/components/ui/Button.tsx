import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-500 shadow-[0_0_0_1px_rgba(239,35,60,0.4)] hover:shadow-glow',
        outline:
          'border border-border text-zinc-200 hover:border-brand-500 hover:text-brand-400 bg-transparent',
        ghost: 'text-zinc-300 hover:bg-white/5 hover:text-white',
        danger: 'bg-red-950 text-red-300 hover:bg-red-900 border border-red-900/60',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
