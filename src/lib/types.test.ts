import { describe, expect, it } from 'vitest'
import { createEmptyProduct, productSchema } from '@/lib/types'

/**
 * Postgres `numeric` columns (weight, regular_price, sale_price, stock) come
 * back from Supabase/PostgREST as JSON strings, not numbers, to avoid
 * precision loss. These tests pin down that productSchema tolerates that —
 * a plain z.number() would throw on a real, correctly saved row and make
 * the product silently fail to load (which is what broke price export).
 */
describe('productSchema — Postgres numeric columns returned as strings', () => {
  function rowWithStringNumerics() {
    return {
      ...createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 0),
      regular_price: '3990',
      sale_price: '2990',
      weight: '14.4',
      stock: '5',
    }
  }

  it('parses regular_price/sale_price sent as strings', () => {
    const parsed = productSchema.parse(rowWithStringNumerics())
    expect(parsed.regular_price).toBe(3990)
    expect(parsed.sale_price).toBe(2990)
  })

  it('parses weight and stock sent as strings', () => {
    const parsed = productSchema.parse(rowWithStringNumerics())
    expect(parsed.weight).toBe(14.4)
    expect(parsed.stock).toBe(5)
  })

  it('still works when the same fields are already plain numbers', () => {
    const parsed = productSchema.parse({
      ...createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 0),
      regular_price: 3990,
      weight: 14.4,
      stock: 5,
    })
    expect(parsed.regular_price).toBe(3990)
    expect(parsed.weight).toBe(14.4)
    expect(parsed.stock).toBe(5)
  })

  it('still allows null for unset prices/weight/stock', () => {
    const parsed = productSchema.parse(createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 0))
    expect(parsed.regular_price).toBeNull()
    expect(parsed.weight).toBeNull()
    expect(parsed.stock).toBeNull()
  })
})

/**
 * The editor creates an attribute with an empty `values` array the instant the
 * user adds it (before typing any values), and that transient state gets
 * autosaved. Reloading such a catalog must NOT throw — a stricter schema
 * (values.min(1)) previously bricked the editor on a stuck "Loading…" screen
 * in production.
 */
describe('productSchema — attributes with no values yet', () => {
  it('parses a product whose attributes have empty values arrays', () => {
    const parsed = productSchema.parse({
      ...createEmptyProduct('494faa96-10c9-48ed-a746-8633545dbbc1', 0),
      attributes: [
        { name: 'Color', values: [] },
        { name: 'Talla', values: [] },
      ],
    })
    expect(parsed.attributes).toHaveLength(2)
    expect(parsed.attributes[0].values).toEqual([])
  })
})
