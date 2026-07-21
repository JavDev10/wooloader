import type { Product } from '@/lib/types'

export type StepProps = {
  product: Product
  onChange: (patch: Partial<Product>) => void
  /** Owner's auth.uid() — first segment of the image storage path (see api/storage.ts). */
  userId: string
  /** Catalog these products belong to — second segment of the image storage path. */
  catalogId: string
}
