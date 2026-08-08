import type { Product } from '@/types/catalog'
import { Dialog } from '@/components/ui/Dialog'

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()} className="max-w-xl p-2">
      {product?.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="max-h-[80vh] w-full rounded-xl object-contain"
        />
      )}
    </Dialog>
  )
}
