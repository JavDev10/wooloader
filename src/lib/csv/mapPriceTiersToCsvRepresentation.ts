import type { PriceTier } from '@/lib/types'

/**
 * There's no native WooCommerce CSV column for quantity-tiered pricing, so it's
 * carried two ways: a human-readable summary appended to the Description (always
 * visible), and a structured `Meta: price_tiers` column that a store-side PHP
 * snippet / plugin can read. Isolated here so only this function changes if the
 * exact meta-key/format a given store expects differs.
 */

/** Human-readable summary appended to the product Description, visible even before a snippet is wired up. */
export function formatPriceTiersSummary(tiers: PriceTier[]): string {
  if (tiers.length === 0) return ''
  const lines = [...tiers]
    .sort((a, b) => a.min_qty - b.min_qty)
    .map((t) => `- ${t.min_qty}+ unidades: $${t.price} c/u`)
  return `Precios por cantidad:\n${lines.join('\n')}`
}

/** Raw structured data round-tripped into a `Meta: price_tiers` column (WooCommerce imports arbitrary `Meta: <key>` columns as post meta). */
export function mapPriceTiersToMeta(tiers: PriceTier[]): string {
  return tiers.length > 0 ? JSON.stringify(tiers) : ''
}
