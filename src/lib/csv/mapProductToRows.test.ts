import { describe, expect, it } from 'vitest'
import { mapProductToRows } from '@/lib/csv/mapProductToRows'
import { buildCsv } from '@/lib/csv/buildCsv'
import { createEmptyProduct, type Product } from '@/lib/types'

function simpleProduct(overrides: Partial<Product> = {}): Product {
  return {
    ...createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 0),
    id: 'prod-simple-1',
    name: 'Llavero disco olímpico',
    category: 'Fitness',
    regular_price: 3990,
    sale_price: 2990,
    stock: null,
    ...overrides,
  }
}

function variableProduct(): Product {
  return {
    ...createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 1),
    id: 'prod-variable-1',
    name: 'Mesa de comedor',
    category: 'Comedor',
    attributes: [
      { name: 'Color', values: ['Cafe', 'Roble'] },
    ],
    variants: [
      {
        id: 'v1',
        attribute_values: { Color: 'Cafe' },
        price: 50000,
        sale_price: null,
        stock: 5,
        sku: 'MESA-CAFE',
        image_url: null,
        weight: null,
        dimensions: null,
      },
      {
        id: 'v2',
        attribute_values: { Color: 'Roble' },
        price: 55000,
        sale_price: null,
        stock: 3,
        sku: null,
        image_url: null,
        weight: null,
        dimensions: null,
      },
    ],
  }
}

describe('mapProductToRows — simple products', () => {
  it('maps a simple product to a single row', () => {
    const rows = mapProductToRows(simpleProduct())
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      Type: 'simple',
      Name: 'Llavero disco olímpico',
      'Regular price': '3990',
      'Sale price': '2990',
      Categories: 'Fitness',
      'In stock?': '1',
    })
  })

  it('leaves the SKU blank when the user did not set one (no auto-generation)', () => {
    const rows = mapProductToRows(simpleProduct({ sku: null }))
    expect(rows[0].SKU).toBe('')
  })

  it('uses the user-provided SKU verbatim when there is one', () => {
    const rows = mapProductToRows(simpleProduct({ sku: 'LLAV-001' }))
    expect(rows[0].SKU).toBe('LLAV-001')
  })

  it('maps the short description to its own column, separate from the long description', () => {
    const rows = mapProductToRows(
      simpleProduct({ short_description: 'Resumen corto', description: 'Cuerpo largo del producto' }),
    )
    expect(rows[0]['Short description']).toBe('Resumen corto')
    expect(rows[0].Description).toBe('Cuerpo largo del producto')
  })

  it('leaves prices blank and adds a note for quote-only products', () => {
    const rows = mapProductToRows(simpleProduct({ is_quote_only: true, regular_price: null }))
    expect(rows[0]['Regular price']).toBe('')
    expect(rows[0]['Sale price']).toBe('')
    expect(rows[0]['In stock?']).toBe('1')
    expect(rows[0].Description).toContain('PRECIO A COTIZAR')
  })

  it('summarizes quantity tiers in the description and serializes them to Meta: price_tiers', () => {
    const rows = mapProductToRows(
      simpleProduct({ price_tiers: [{ min_qty: 6, price: 2500 }, { min_qty: 1, price: 3000 }] }),
    )
    expect(rows[0].Description).toContain('1+ unidades: $3000 c/u')
    expect(rows[0].Description).toContain('6+ unidades: $2500 c/u')
    expect(JSON.parse(rows[0]['Meta: price_tiers'])).toHaveLength(2)
  })

  it('sets a numeric Stock (which is what tells WooCommerce to manage inventory — there is no separate "Manage stock?" column)', () => {
    const rows = mapProductToRows(simpleProduct({ stock: 0 }))
    expect(rows[0].Stock).toBe('0')
    expect(rows[0]['In stock?']).toBe('0')
  })

  it('leaves Stock blank for unlimited stock, letting "In stock?" alone control availability', () => {
    const rows = mapProductToRows(simpleProduct({ stock: null }))
    expect(rows[0].Stock).toBe('')
    expect(rows[0]['In stock?']).toBe('1')
  })

  it('assigns both the parent category alone and the parent > subcategory path, so both get checked in WooCommerce', () => {
    const rows = mapProductToRows(simpleProduct({ category: 'Marca', subcategory: 'Marca1' }))
    expect(rows[0].Categories).toBe('Marca, Marca > Marca1')
  })

  it('falls back to just the category when there is no subcategory', () => {
    const rows = mapProductToRows(simpleProduct({ category: 'Fitness', subcategory: '' }))
    expect(rows[0].Categories).toBe('Fitness')
  })
})

describe('mapProductToRows — variable products', () => {
  it('produces one parent row and one row per variant', () => {
    const rows = mapProductToRows(variableProduct())
    expect(rows).toHaveLength(3)
    expect(rows[0].Type).toBe('variable')
    expect(rows[1].Type).toBe('variation')
    expect(rows[2].Type).toBe('variation')
  })

  it('links variation rows to the parent SKU and carries the specific attribute value', () => {
    const rows = mapProductToRows(variableProduct())
    const parentSku = rows[0].SKU
    expect(rows[1].Parent).toBe(parentSku)
    expect(rows[1].attributes).toEqual([{ name: 'Color', value: 'Cafe', visible: true, global: true }])
    expect(rows[1].SKU).toBe('MESA-CAFE')
    // variant 2 has no explicit sku, so its SKU is left blank — it still links
    // to the parent through the Parent column.
    expect(rows[2].SKU).toBe('')
    expect(rows[2].Parent).toBe(parentSku)
  })

  it('leaves parent prices blank and takes price/stock from each variant', () => {
    const rows = mapProductToRows(variableProduct())
    expect(rows[0]['Regular price']).toBe('')
    expect(rows[1]['Regular price']).toBe('50000')
    expect(rows[1].Stock).toBe('5')
    expect(rows[2]['Regular price']).toBe('55000')
  })

  it('sets a valid "Visibility in catalog" and "Is featured?" on variation rows, not blank', () => {
    // WooCommerce's importer validates these as an enum even on variation
    // rows (where they're actually meaningless) and rejects a blank
    // "Visibility in catalog" with "Opción de visibilidad del catálogo no válida",
    // which silently fails the whole variation row on import.
    const rows = mapProductToRows(variableProduct())
    expect(rows[1]['Visibility in catalog']).toBe('visible')
    expect(rows[1]['Is featured?']).toBe('0')
    expect(rows[2]['Visibility in catalog']).toBe('visible')
  })

  it('exports a variant’s own weight/dimensions when it has them', () => {
    const product = variableProduct()
    product.variants[0].weight = 14.4
    product.variants[0].dimensions = { length: 100, width: 60, height: 75 }
    const rows = mapProductToRows(product)
    expect(rows[1]['Weight (kg)']).toBe('14.4')
    expect(rows[1]['Length (cm)']).toBe('100')
    expect(rows[1]['Width (cm)']).toBe('60')
    expect(rows[1]['Height (cm)']).toBe('75')
  })

  it('leaves weight/dimensions blank on a variation with none of its own (falls back to the product in WooCommerce)', () => {
    const rows = mapProductToRows(variableProduct())
    expect(rows[1]['Weight (kg)']).toBe('')
    expect(rows[1]['Length (cm)']).toBe('')
  })

  it('skips variants the user deleted (marked excluded)', () => {
    const product = variableProduct()
    product.variants[1].excluded = true
    const rows = mapProductToRows(product)
    // parent + only the one remaining variation
    expect(rows).toHaveLength(2)
    expect(rows[1].SKU).toBe('MESA-CAFE')
    expect(rows.some((r) => r.attributes.some((a) => a.value === 'Roble'))).toBe(false)
  })

  it('marks attributes as global (taxonomy-based) on both parent and variation rows', () => {
    // Local/custom attributes have a known WooCommerce CSV importer issue
    // where "used for variations" never gets set, so variations silently
    // fail to import — global attributes (auto-created taxonomy) avoid it.
    const rows = mapProductToRows(variableProduct())
    expect(rows[0].attributes.every((a) => a.global)).toBe(true)
    expect(rows[1].attributes.every((a) => a.global)).toBe(true)
  })
})

describe('buildCsv', () => {
  it('pads attribute columns to the widest product and produces a parseable CSV', () => {
    const csv = buildCsv([simpleProduct(), variableProduct()])
    const [headerLine, ...lines] = csv.trim().split('\n')
    expect(headerLine).toContain('Attribute 1 name')
    expect(headerLine).toContain('Meta: price_tiers')
    // 1 simple row + 1 parent + 2 variations
    expect(lines).toHaveLength(4)
  })

  it('produces no attribute columns when every product is simple', () => {
    const csv = buildCsv([simpleProduct()])
    const [headerLine] = csv.trim().split('\n')
    expect(headerLine).not.toContain('Attribute 1 name')
  })
})
