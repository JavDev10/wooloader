import type { Product } from '@/lib/types'
import { generateSku } from '@/lib/csv/generateSku'
import type { CsvRow } from '@/lib/csv/types'

const QUOTE_ONLY_NOTE = '[PRECIO A COTIZAR — contactar para cotización]'

function buildDescription(product: Product): string {
  const parts = [product.description]
  // The long description is HTML (rich-text editor), so the quote note goes in
  // its own paragraph rather than being appended as loose text.
  if (product.is_quote_only) parts.push(`<p>${QUOTE_ONLY_NOTE}</p>`)
  return parts.filter(Boolean).join('\n')
}

function dims(product: Product) {
  return {
    length: product.dimensions?.length != null ? String(product.dimensions.length) : '',
    width: product.dimensions?.width != null ? String(product.dimensions.width) : '',
    height: product.dimensions?.height != null ? String(product.dimensions.height) : '',
  }
}

/**
 * WooCommerce's CSV importer reads "Category > Subcategory" as a hierarchy
 * in the Categories column. Assigning only the child term ("Dining >
 * Tables") is standard WordPress taxonomy behavior but does NOT also check
 * the parent category — a product browsable under "Tables" wouldn't show up
 * browsing "Dining" itself. So when there's a subcategory, the product is
 * assigned to both the parent alone AND the parent>child path (WooCommerce's
 * Categories column accepts a comma-separated list of category assignments).
 */
function buildCategories(product: Product): string {
  if (!product.category) return ''
  if (!product.subcategory) return product.category
  return `${product.category}, ${product.category} > ${product.subcategory}`
}

/** Maps one Product to its WooCommerce CSV row(s): a single `simple` row, or one `variable` parent row + one `variation` row per variant. */
export function mapProductToRows(product: Product): CsvRow[] {
  const description = buildDescription(product)
  const { length, width, height } = dims(product)
  const images = product.images.map((img) => img.url).join(', ')
  const categories = buildCategories(product)

  if (product.attributes.length === 0) {
    const inStock = product.is_quote_only || product.stock === null || product.stock > 0
    return [
      {
        Type: 'simple',
        // Blank when the user didn't set a SKU — WooCommerce accepts simple
        // products with no SKU. We deliberately DON'T auto-generate one: a
        // generated SKU that collides with an existing store product makes the
        // import fail with a duplicate-SKU error.
        SKU: product.sku ?? '',
        Name: product.name,
        Published: '1',
        'Is featured?': '0',
        'Visibility in catalog': 'visible',
        Description: description,
        'Short description': product.short_description,
        'Regular price': product.is_quote_only ? '' : (product.regular_price ?? '').toString(),
        'Sale price': product.is_quote_only ? '' : (product.sale_price ?? '').toString(),
        Categories: categories,
        Images: images,
        'In stock?': inStock ? '1' : '0',
        Stock: product.stock === null ? '' : String(product.stock),
        'Weight (kg)': product.weight != null ? String(product.weight) : '',
        'Length (cm)': length,
        'Width (cm)': width,
        'Height (cm)': height,
        Parent: '',
        attributes: [],
      },
    ]
  }

  // A variable product's parent MUST carry a SKU: each variation row links
  // back to it through the Parent column (= the parent's SKU), and WooCommerce
  // can't attach variations to a parent with no SKU. So here — and only here —
  // fall back to a generated, unique-per-product SKU when the user left it
  // blank, rather than leaving it empty like we do for simple products.
  const parentSku = product.sku || generateSku(product.name, product.id)

  const parentRow: CsvRow = {
    Type: 'variable',
    SKU: parentSku,
    Name: product.name,
    Published: '1',
    'Is featured?': '0',
    'Visibility in catalog': 'visible',
    Description: description,
    'Short description': product.short_description,
    'Regular price': '',
    'Sale price': '',
    Categories: categories,
    Images: images,
    'In stock?': '1',
    Stock: '',
    'Weight (kg)': product.weight != null ? String(product.weight) : '',
    'Length (cm)': length,
    'Width (cm)': width,
    'Height (cm)': height,
    Parent: '',
    // global: true (not local/custom) so WooCommerce's importer creates/reuses
    // a real attribute taxonomy (pa_color, etc.) for this attribute name.
    // Local attributes read the values fine but WooCommerce's CSV importer
    // has a known issue where it doesn't reliably mark them "used for
    // variations", so the variation rows below get silently ignored — global
    // attributes don't have that problem.
    attributes: product.attributes.map((attr) => ({
      name: attr.name,
      value: attr.values.join(', '),
      visible: true,
      global: true,
    })),
  }

  // Combinations the user deleted (marked excluded) aren't real products —
  // don't emit variation rows for them.
  const variationRows: CsvRow[] = product.variants
    .filter((variant) => !variant.excluded)
    .map((variant) => {
    const variantInStock = variant.stock === null || variant.stock > 0
    return {
      Type: 'variation',
      // Blank when the user didn't set one — the variation still links to
      // its parent through the Parent column below, so it doesn't need its own
      // SKU, and leaving it blank avoids duplicate-SKU import errors.
      SKU: variant.sku ?? '',
      Name: '',
      Published: '1',
      // WooCommerce's importer validates these columns even on variation
      // rows (where they're actually meaningless — variations inherit
      // visibility/featured status from the parent) and rejects a blank
      // "Visibility in catalog" as an invalid enum value, so both need a
      // real value here even though WooCommerce ignores them for variations.
      'Is featured?': '0',
      'Visibility in catalog': 'visible',
      Description: '',
      'Short description': '',
      'Regular price': (variant.price ?? '').toString(),
      'Sale price': (variant.sale_price ?? '').toString(),
      Categories: '',
      Images: variant.image_url ?? '',
      'In stock?': variantInStock ? '1' : '0',
      Stock: variant.stock === null ? '' : String(variant.stock),
      // Blank means "same as the product" — WooCommerce falls back to the
      // parent's weight/dimensions for a variation that doesn't set its own.
      'Weight (kg)': variant.weight != null ? String(variant.weight) : '',
      'Length (cm)': variant.dimensions?.length != null ? String(variant.dimensions.length) : '',
      'Width (cm)': variant.dimensions?.width != null ? String(variant.dimensions.width) : '',
      'Height (cm)': variant.dimensions?.height != null ? String(variant.dimensions.height) : '',
      Parent: parentSku,
      // Must match the parent row's `global` flag for the same attribute.
      attributes: product.attributes.map((attr) => ({
        name: attr.name,
        value: variant.attribute_values[attr.name] ?? '',
        visible: true,
        global: true,
      })),
    }
  })

  return [parentRow, ...variationRows]
}
