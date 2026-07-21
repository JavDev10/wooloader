import type { Product } from '@/lib/types'

/**
 * Required fields, enforced only at submit/export time (not while editing or
 * autosaving — the user should never be blocked mid-draft): name, short
 * description (the long description is optional), category, weight+dimensions
 * (unless explicitly marked "no aplica"), a regular price (unless "a cotizar"),
 * and at least one product-level image — variant images don't count toward this.
 *
 * NOTE: messages are Spanish for now; i18n is a planned generalization (PLAN.md).
 */
export function getMissingFields(product: Product): string[] {
  const missing: string[] = []

  if (!product.name.trim()) missing.push('Nombre del producto')
  // The short description is required; the long `description` is optional.
  if (!product.short_description.trim()) missing.push('Descripción corta')
  if (!product.category.trim()) missing.push('Categoría')

  if (!product.no_physical_dimensions) {
    const hasWeight = product.weight != null
    const hasDimensions =
      product.dimensions?.length != null && product.dimensions?.width != null && product.dimensions?.height != null
    if (!hasWeight || !hasDimensions) {
      missing.push('Peso y dimensiones (o marcar "no aplica")')
    }
  }

  if (!product.is_quote_only && product.regular_price == null) {
    missing.push('Precio regular (o marcar "a cotizar")')
  }

  if (product.images.length === 0) {
    missing.push('Imagen del producto')
  }

  return missing
}

export function isProductComplete(product: Product): boolean {
  return getMissingFields(product).length === 0
}

/** Builds the summary shown when submit is blocked: one line per incomplete product. */
export function formatMissingFieldsSummary(products: Product[]): string {
  const lines = products
    .map((p) => ({ name: p.name.trim() || 'Producto sin nombre', missing: getMissingFields(p) }))
    .filter((p) => p.missing.length > 0)
    .map((p) => `• ${p.name}: falta ${p.missing.join(', ')}`)

  return `No se puede enviar el catálogo todavía. Falta completar:\n\n${lines.join('\n')}`
}
