import type { Attribute, Variant } from '@/lib/types'

/** Cartesian product of every attribute's values, e.g. Color x Size -> one entry per Color/Size pair. */
export function generateCombinations(attributes: Attribute[]): Record<string, string>[] {
  if (attributes.length === 0) return []
  return attributes.reduce<Record<string, string>[]>(
    (acc, attr) => acc.flatMap((combo) => attr.values.map((value) => ({ ...combo, [attr.name]: value }))),
    [{}],
  )
}

function comboKey(combo: Record<string, string>): string {
  return Object.entries(combo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|')
}

export type VariantDefaults = {
  price?: number | null
  sale_price?: number | null
}

/**
 * Reconciles the variant list against the current attribute definitions:
 * keeps existing price/stock/sku/image for combinations that still exist,
 * adds a variant for newly-possible combinations, and drops variants whose
 * combination no longer exists (e.g. a value or attribute was removed).
 *
 * Brand-new combinations are seeded with `defaults.price`/`sale_price` (the
 * product's own regular/sale price, filled in a prior editor step) rather
 * than always starting blank — otherwise a user fills in "Regular price"
 * expecting it to apply, then adds attributes afterward, and every variant
 * silently ends up with no price at all since WooCommerce only reads price
 * off variation rows, never the parent, for variable products.
 */
export function reconcileVariants(
  attributes: Attribute[],
  existingVariants: Variant[],
  defaults: VariantDefaults = {},
): Variant[] {
  const combinations = generateCombinations(attributes)
  const existingByKey = new Map(existingVariants.map((v) => [comboKey(v.attribute_values), v]))

  return combinations.map((combo) => {
    const existing = existingByKey.get(comboKey(combo))
    if (existing) return { ...existing, attribute_values: combo }
    return {
      id: crypto.randomUUID(),
      attribute_values: combo,
      price: defaults.price ?? null,
      sale_price: defaults.sale_price ?? null,
      stock: null,
      sku: null,
      image_url: null,
      // null here means "same weight/size as the product" — unlike price,
      // that's a legitimate default (WooCommerce falls back to the parent
      // product's values for a variation with no weight/dimensions of its
      // own), so these don't need a defaults.weight/dimensions the way price does.
      weight: null,
      dimensions: null,
    }
  })
}
