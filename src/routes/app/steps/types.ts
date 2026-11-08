import type { Product, WeightUnit } from '@/lib/types'

export type StepProps = {
  product: Product
  onChange: (patch: Partial<Product>) => void
  /** The catalog OWNER's id — first segment of the image storage path (see api/storage.ts), also for a client's uploads. */
  userId: string
  /** Catalog these products belong to — second segment of the image storage path. */
  catalogId: string
  /** The catalog's weight unit — drives the weight labels and the CSV header. */
  weightUnit: WeightUnit
  /** Persists a new weight unit on the catalog (values are not converted). Absent for a client, who can't change catalog settings. */
  onWeightUnitChange?: (unit: WeightUnit) => void
  /** The catalog's ISO currency code — drives price decimals and formatting. */
  currency: string
}
