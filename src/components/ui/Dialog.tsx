import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, title, children, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200',
            className,
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            {title ? (
              <RadixDialog.Title className="font-display text-lg font-semibold tracking-wide text-white">
                {title}
              </RadixDialog.Title>
            ) : (
              <RadixDialog.Title className="sr-only">Dialog</RadixDialog.Title>
            )}
            <RadixDialog.Close asChild>
              <button
                className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
