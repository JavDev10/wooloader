import { describe, expect, it } from 'vitest'
import { formatMissingFieldsSummary, getMissingFields, isProductComplete } from '@/lib/productValidation'
import { createEmptyProduct, type Product } from '@/lib/types'

function completeProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 0),
    name: 'Mesa',
    short_description: 'Mesa de comedor de pino',
    description: 'Una mesa linda',
    category: 'Comedor',
    weight: 14.4,
    dimensions: { length: 100, width: 60, height: 75 },
    regular_price: 10000,
    images: [{ url: 'https://example.com/a.jpg', storage_path: 'x/a.jpg', is_primary: true, sort_order: 0 }],
    ...overrides,
  }
}

describe('getMissingFields', () => {
  it('returns nothing for a fully complete product', () => {
    expect(getMissingFields(completeProduct())).toEqual([])
  })

  it('flags a blank name, short description, and category', () => {
    const missing = getMissingFields(completeProduct({ name: '  ', short_description: '', category: '' }))
    expect(missing).toContain('Nombre del producto')
    expect(missing).toContain('Descripción corta')
    expect(missing).toContain('Categoría')
  })

  it('does not require the long description', () => {
    const missing = getMissingFields(completeProduct({ description: '' }))
    expect(missing).not.toContain('Descripción corta')
    expect(missing).toEqual([])
  })

  it('requires weight and dimensions by default', () => {
    const missing = getMissingFields(completeProduct({ weight: null, dimensions: null }))
    expect(missing).toContain('Peso y dimensiones (o marcar "no aplica")')
  })

  it('does not require weight/dimensions when marked "no aplica"', () => {
    const missing = getMissingFields(
      completeProduct({ weight: null, dimensions: null, no_physical_dimensions: true }),
    )
    expect(missing).not.toContain('Peso y dimensiones (o marcar "no aplica")')
  })

  it('flags incomplete dimensions (missing one axis) even if weight is set', () => {
    const missing = getMissingFields(
      completeProduct({ dimensions: { length: 100, width: null, height: 75 } }),
    )
    expect(missing).toContain('Peso y dimensiones (o marcar "no aplica")')
  })

  it('requires a regular price unless the product is quote-only', () => {
    const missing = getMissingFields(completeProduct({ regular_price: null }))
    expect(missing).toContain('Precio regular (o marcar "a cotizar")')
  })

  it('does not require a price when marked "a cotizar"', () => {
    const missing = getMissingFields(completeProduct({ regular_price: null, is_quote_only: true }))
    expect(missing).not.toContain('Precio regular (o marcar "a cotizar")')
  })

  it('requires at least one product-level image', () => {
    const missing = getMissingFields(completeProduct({ images: [] }))
    expect(missing).toContain('Imagen del producto')
  })

  it('does not accept a variant image in place of a product-level image', () => {
    const missing = getMissingFields(
      completeProduct({
        images: [],
        attributes: [{ name: 'Color', values: ['Rojo'] }],
        variants: [
          {
            id: 'v1',
            attribute_values: { Color: 'Rojo' },
            price: 1000,
            sale_price: null,
            stock: null,
            sku: null,
            image_url: 'https://example.com/variant.jpg',
            weight: null,
            dimensions: null,
          },
        ],
      }),
    )
    expect(missing).toContain('Imagen del producto')
  })
})

describe('isProductComplete', () => {
  it('is true only when there are no missing fields', () => {
    expect(isProductComplete(completeProduct())).toBe(true)
    expect(isProductComplete(completeProduct({ name: '' }))).toBe(false)
  })
})

describe('formatMissingFieldsSummary', () => {
  it('lists only the incomplete products, by name, with their missing fields', () => {
    const summary = formatMissingFieldsSummary([
      completeProduct({ name: 'Mesa' }),
      completeProduct({ name: 'Silla', category: '' }),
    ])
    expect(summary).not.toContain('Mesa:')
    expect(summary).toContain('Silla: falta Categoría')
  })

  it('falls back to a placeholder name for products with no name yet', () => {
    const summary = formatMissingFieldsSummary([completeProduct({ name: '', category: '' })])
    expect(summary).toContain('Producto sin nombre: falta')
  })
})
