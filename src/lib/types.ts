import { z } from 'zod'

/**
 * Shapes here mirror the Supabase schema (supabase/migrations/) field-for-field,
 * snake_case included. Keeping one shape end-to-end (DB row <-> JS object) avoids
 * a mapping/adapter layer that this app doesn't need.
 */

/**
 * Prices are currently modeled as whole integers (no decimals, no thousands
 * separator in the stored value — see src/lib/priceFormat.ts, which feeds this
 * from the UI). This works for zero-decimal currencies (CLP, JPY, …); adding
 * proper multi-currency / decimal support is a planned generalization (see
 * PLAN.md). Uses z.coerce because Postgres `numeric` columns (weight,
 * regular_price, sale_price, stock) come back from Supabase/PostgREST as JSON
 * strings, not numbers, to avoid precision loss — a plain z.number() would
 * silently fail to parse a real, correctly saved price.
 */
const priceSchema = z.coerce.number().int().positive()

export const dimensionsSchema = z.object({
  length: z.number().positive().nullable(),
  width: z.number().positive().nullable(),
  height: z.number().positive().nullable(),
})
export type Dimensions = z.infer<typeof dimensionsSchema>

export const attributeSchema = z.object({
  name: z.string().min(1),
  // No `.min(1)` here on purpose: the editor creates an attribute with an
  // empty `values` array the moment the user adds it (before typing any
  // values), and that transient state gets autosaved. Requiring at least one
  // value would make productSchema.parse throw when reloading such a catalog,
  // bricking the editor on a stuck "Loading…" screen. Empty values are
  // handled gracefully everywhere downstream (reconcileVariants yields no
  // combinations, the CSV export emits an empty value, the preview falls back
  // to ''). Individual values are still non-empty strings.
  values: z.array(z.string().min(1)),
})
export type Attribute = z.infer<typeof attributeSchema>

export const variantSchema = z.object({
  id: z.string().uuid(),
  // maps attribute name -> the specific value this variant has, e.g. { Color: "Red" }
  attribute_values: z.record(z.string(), z.string()),
  price: priceSchema.nullable(),
  sale_price: priceSchema.nullable(),
  stock: z.number().int().nonnegative().nullable(),
  sku: z.string().nullable(),
  image_url: z.string().url().nullable(),
  // Only set when this variant's weight/size differs from the product's own
  // (see the editor) — left null it just means "same as the product".
  weight: z.number().positive().nullable(),
  dimensions: dimensionsSchema.nullable(),
  // Marks a combination the user deleted because it isn't a real product
  // (e.g. "Red-L" doesn't exist even though both Red and L do). Kept in the
  // list instead of hard-removed so that re-editing attributes doesn't
  // resurrect it (reconcileVariants preserves it), and so it can be restored.
  // The grid, CSV export and preview all skip excluded variants. Optional so
  // variants saved before this field existed parse cleanly (missing = not
  // excluded).
  excluded: z.boolean().optional(),
})
export type Variant = z.infer<typeof variantSchema>

export const productImageSchema = z.object({
  url: z.string().url(),
  storage_path: z.string(),
  is_primary: z.boolean(),
  sort_order: z.number().int().nonnegative(),
})
export type ProductImage = z.infer<typeof productImageSchema>

export const productSchema = z.object({
  id: z.string().uuid(),
  catalog_id: z.string().uuid(),
  local_order: z.number().int().nonnegative(),
  name: z.string(),
  description: z.string(),
  // WooCommerce's "Short description" (the product excerpt shown next to the
  // price). This is the required one at submit time; `description` (the long
  // body) is optional — see src/lib/productValidation.ts.
  short_description: z.string().default(''),
  category: z.string(),
  subcategory: z.string(),
  // z.coerce because `weight` is a Postgres `numeric` column (see priceSchema note above).
  weight: z.coerce.number().positive().nullable(),
  dimensions: dimensionsSchema.nullable(),
  // Lets the user exempt weight/dimensions from the required-fields check
  // at submit time (e.g. a service or digital product genuinely has none).
  no_physical_dimensions: z.boolean(),
  is_quote_only: z.boolean(),
  regular_price: priceSchema.nullable(),
  sale_price: priceSchema.nullable(),
  attributes: z.array(attributeSchema),
  variants: z.array(variantSchema),
  images: z.array(productImageSchema),
  // When true, every image uploaded for this product is center-cropped to a
  // fixed square (see SQUARE_IMAGE_SIZE in imageValidation.ts); when false,
  // images keep their aspect ratio. `.default(false)` so rows saved before the
  // column existed still parse. Per-product because catalogs often mix square
  // packshots with non-square lifestyle photos.
  square_images: z.boolean().default(false),
  // z.coerce because `stock` is a Postgres `numeric` column (see priceSchema note above).
  stock: z.coerce.number().int().nonnegative().nullable(),
  sku: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Product = z.infer<typeof productSchema>

export const catalogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Catalog = z.infer<typeof catalogSchema>

export function createEmptyProduct(catalogId: string, localOrder: number): Product {
  return {
    id: crypto.randomUUID(),
    catalog_id: catalogId,
    local_order: localOrder,
    name: '',
    description: '',
    short_description: '',
    category: '',
    subcategory: '',
    weight: null,
    dimensions: null,
    no_physical_dimensions: false,
    is_quote_only: false,
    regular_price: null,
    sale_price: null,
    attributes: [],
    variants: [],
    images: [],
    square_images: false,
    stock: null,
    sku: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
