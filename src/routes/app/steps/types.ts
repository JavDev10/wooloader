import type { Product, WeightUnit } from '@/lib/types'

export type StepProps = {
  product: Product
  onChange: (patch: Partial<Product>) => void
  /** Owner's auth.uid() — first segment of the image storage path (see api/storage.ts). */
  userId: string
  /** Catalog these products belong to — second segment of the image storage path. */
  catalogId: string
  /** The catalog's weight unit — drives the weight labels and the CSV header. */
  weightUnit: WeightUnit
  /** Persists a new weight unit on the catalog (values are not converted). */
  onWeightUnitChange: (unit: WeightUnit) => void
}
