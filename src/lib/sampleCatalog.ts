import { createEmptyProduct, type Attribute, type Product } from '@/lib/types'
import { currencyDecimals } from '@/lib/currency'
import { reconcileVariants } from '@/lib/variantCombinations'

/**
 * A ready-made catalog so a new visitor can see every feature — a simple
 * product with a sale price, a variable product, a quote-only product — and
 * export a CSV right away instead of facing an empty screen. It's plain data
 * in the user's own catalog: they can edit or delete it like anything else.
 * No images, so loading it costs nothing against the Storage quota.
 */

type SampleLanguage = 'es' | 'en' | 'pt'

function sampleLanguage(language: string): SampleLanguage {
  if (language.startsWith('en')) return 'en'
  if (language.startsWith('pt')) return 'pt'
  return 'es'
}

/**
 * Rough USD exchange rates, only to make sample prices look plausible in the
 * catalog's currency (a T-shirt shouldn't cost 20 pesos). Illustrative — never
 * used for real prices.
 */
const APPROX_PER_USD: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.78, CAD: 1.37, CLP: 950, MXN: 18, ARS: 1000, COP: 4000, PEN: 3.7,
  UYU: 40, PYG: 7500, BOB: 6.9, CRC: 510, GTQ: 7.7, DOP: 60, BRL: 5.5,
}

/** A USD amount converted roughly and rounded to a store-like price: 12.99, 229, 12.290… */
export function samplePrice(usd: number, currency: string): number {
  const value = usd * (APPROX_PER_USD[currency] ?? 1)
  const step = value >= 1000 ? 100 : value >= 100 ? 10 : 1
  const rounded = Math.max(step, Math.round(value / step) * step)
  if (step === 1) return currencyDecimals(currency) > 0 ? Number((rounded - 0.01).toFixed(2)) : rounded
  return rounded - step / 10
}

const TEXT = {
  es: {
    catalog: 'Catálogo de ejemplo',
    mug: {
      name: 'Taza de cerámica 350 ml',
      short: 'Taza esmaltada apta para microondas y lavavajillas.',
      description:
        '<p>Taza de cerámica esmaltada con capacidad de <strong>350 ml</strong>, ideal para café o té.</p><ul><li>Apta para microondas y lavavajillas</li><li>Asa ergonómica</li></ul>',
      category: 'Cocina',
      subcategory: 'Tazas',
    },
    shirt: {
      name: 'Polera básica de algodón',
      short: 'Polera 100% algodón, corte clásico.',
      description: '<p>Polera de <strong>algodón peinado</strong>, suave y resistente. Corte clásico unisex.</p>',
      category: 'Ropa',
      subcategory: 'Poleras',
      color: 'Color',
      colors: ['Negro', 'Blanco'],
      size: 'Talla',
    },
    table: {
      name: 'Mesa de comedor a medida',
      short: 'Mesa de madera nativa fabricada a pedido.',
      description: '<p>Mesa de comedor de madera maciza, fabricada <em>a medida</em> según el espacio de tu hogar.</p>',
      category: 'Muebles',
      subcategory: 'Comedor',
    },
  },
  en: {
    catalog: 'Sample catalog',
    mug: {
      name: 'Ceramic mug 12 oz',
      short: 'Glazed mug, microwave and dishwasher safe.',
      description:
        '<p>Glazed ceramic mug with a <strong>12 oz</strong> capacity, perfect for coffee or tea.</p><ul><li>Microwave and dishwasher safe</li><li>Ergonomic handle</li></ul>',
      category: 'Kitchen',
      subcategory: 'Mugs',
    },
    shirt: {
      name: 'Basic cotton T-shirt',
      short: '100% cotton T-shirt, classic fit.',
      description: '<p>T-shirt made of <strong>combed cotton</strong>, soft and durable. Classic unisex fit.</p>',
      category: 'Clothing',
      subcategory: 'T-shirts',
      color: 'Color',
      colors: ['Black', 'White'],
      size: 'Size',
    },
    table: {
      name: 'Custom dining table',
      short: 'Solid wood table, made to order.',
      description: '<p>Solid wood dining table, made <em>to order</em> to fit your space.</p>',
      category: 'Furniture',
      subcategory: 'Dining',
    },
  },
  pt: {
    catalog: 'Catálogo de exemplo',
    mug: {
      name: 'Caneca de cerâmica 350 ml',
      short: 'Caneca esmaltada, pode ir ao micro-ondas e à lava-louças.',
      description:
        '<p>Caneca de cerâmica esmaltada com capacidade de <strong>350 ml</strong>, ideal para café ou chá.</p><ul><li>Pode ir ao micro-ondas e à lava-louças</li><li>Alça ergonômica</li></ul>',
      category: 'Cozinha',
      subcategory: 'Canecas',
    },
    shirt: {
      name: 'Camiseta básica de algodão',
      short: 'Camiseta 100% algodão, corte clássico.',
      description: '<p>Camiseta de <strong>algodão penteado</strong>, macia e resistente. Corte clássico unissex.</p>',
      category: 'Roupas',
      subcategory: 'Camisetas',
      color: 'Cor',
      colors: ['Preto', 'Branco'],
      size: 'Tamanho',
    },
    table: {
      name: 'Mesa de jantar sob medida',
      short: 'Mesa de madeira maciça feita sob encomenda.',
      description: '<p>Mesa de jantar de madeira maciça, feita <em>sob medida</em> para o seu espaço.</p>',
      category: 'Móveis',
      subcategory: 'Sala de jantar',
    },
  },
} as const

export const SAMPLE_PRODUCT_COUNT = 3

export function sampleCatalogName(language: string): string {
  return TEXT[sampleLanguage(language)].catalog
}

/** The sample products for `catalogId`, in the UI language with prices in the catalog's currency. */
export function buildSampleProducts(catalogId: string, language: string, currency: string): Product[] {
  const text = TEXT[sampleLanguage(language)]

  const mug: Product = {
    ...createEmptyProduct(catalogId, 0),
    name: text.mug.name,
    short_description: text.mug.short,
    description: text.mug.description,
    category: text.mug.category,
    subcategory: text.mug.subcategory,
    regular_price: samplePrice(12.99, currency),
    sale_price: samplePrice(9.99, currency),
    stock: 25,
    sku: 'MUG-350',
    weight: 0.35,
    dimensions: { length: 12, width: 9, height: 10 },
  }

  const attributes: Attribute[] = [
    { name: text.shirt.color, values: [...text.shirt.colors] },
    { name: text.shirt.size, values: ['S', 'M', 'L'] },
  ]
  const shirtPrice = samplePrice(19.99, currency)
  const shirt: Product = {
    ...createEmptyProduct(catalogId, 1),
    name: text.shirt.name,
    short_description: text.shirt.short,
    description: text.shirt.description,
    category: text.shirt.category,
    subcategory: text.shirt.subcategory,
    regular_price: shirtPrice,
    weight: 0.2,
    dimensions: { length: 30, width: 25, height: 2 },
    attributes,
    // Every combination gets the base price and stock; size L costs a bit
    // more, to show that each variation can have its own price.
    variants: reconcileVariants(attributes, [], { price: shirtPrice }).map((variant) => ({
      ...variant,
      price: variant.attribute_values[text.shirt.size] === 'L' ? samplePrice(21.99, currency) : variant.price,
      stock: 10,
    })),
  }

  const table: Product = {
    ...createEmptyProduct(catalogId, 2),
    name: text.table.name,
    short_description: text.table.short,
    description: text.table.description,
    category: text.table.category,
    subcategory: text.table.subcategory,
    is_quote_only: true,
    weight: 35,
    dimensions: { length: 180, width: 90, height: 75 },
  }

  return [mug, shirt, table]
}
