import { describe, expect, it } from 'vitest'
import Papa from 'papaparse'
import { buildSampleProducts, samplePrice, sampleCatalogName, SAMPLE_PRODUCT_COUNT } from '@/lib/sampleCatalog'
import { CURRENCIES, currencyDecimals } from '@/lib/currency'
import { productSchema } from '@/lib/types'
import { buildCsv } from '@/lib/csv/buildCsv'

const CATALOG_ID = '494faa96-10c9-48ed-a746-8633545dbbc1'

describe('samplePrice', () => {
  it('looks like a store price in each currency', () => {
    expect(samplePrice(12.99, 'USD')).toBe(12.99)
    expect(samplePrice(12.99, 'CLP')).toBe(12290)
    expect(samplePrice(12.99, 'BRL')).toBe(70.99)
  })

  it('is positive and within the currency decimals for every listed currency', () => {
    for (const { code } of CURRENCIES) {
      const price = samplePrice(9.99, code)
      expect(price).toBeGreaterThan(0)
      const decimals = (String(price).split('.')[1] ?? '').length
      expect(decimals).toBeLessThanOrEqual(currencyDecimals(code))
    }
  })
})

describe('buildSampleProducts', () => {
  it('builds products that match the DB schema, in each language', () => {
    for (const lang of ['es', 'en', 'pt-BR']) {
      const products = buildSampleProducts(CATALOG_ID, lang, 'USD')
      expect(products).toHaveLength(SAMPLE_PRODUCT_COUNT)
      for (const product of products) expect(() => productSchema.parse(product)).not.toThrow()
    }
  })

  it('covers a simple, a variable and a quote-only product', () => {
    const [mug, shirt, table] = buildSampleProducts(CATALOG_ID, 'es', 'CLP')
    expect(mug.attributes).toHaveLength(0)
    expect(mug.sale_price).toBeLessThan(mug.regular_price!)
    expect(shirt.variants).toHaveLength(6)
    expect(new Set(shirt.variants.map((v) => v.price)).size).toBe(2)
    expect(table.is_quote_only).toBe(true)
  })

  it('exports to a CSV with one row per product plus one per variation', () => {
    const csv = buildCsv(buildSampleProducts(CATALOG_ID, 'en', 'USD'), { currency: 'USD' })
    // Parse rather than split on newlines: a quote-only description holds a
    // newline inside a quoted cell, which is valid CSV.
    const rows = Papa.parse<Record<string, string>>(csv, { header: true }).data
    expect(rows).toHaveLength(3 + 6)
    expect(rows.map((r) => r.Type)).toEqual(['simple', 'variable', ...Array(6).fill('variation'), 'simple'])
  })

  it('uses unique ids so loading the sample twice never collides', () => {
    const ids = [...buildSampleProducts(CATALOG_ID, 'es', 'USD'), ...buildSampleProducts(CATALOG_ID, 'es', 'USD')].map(
      (p) => p.id,
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names the catalog in the UI language', () => {
    expect(sampleCatalogName('pt-BR')).toBe('Catálogo de exemplo')
    expect(sampleCatalogName('fr')).toBe('Catálogo de ejemplo')
  })
})
