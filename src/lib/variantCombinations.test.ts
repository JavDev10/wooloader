import { describe, expect, it } from 'vitest'
import { generateCombinations, reconcileVariants } from '@/lib/variantCombinations'
import type { Attribute, Variant } from '@/lib/types'

describe('generateCombinations', () => {
  it('returns no combinations for no attributes', () => {
    expect(generateCombinations([])).toEqual([])
  })

  it('returns one combination per value for a single attribute', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro', 'azul', 'rojo'] }]
    expect(generateCombinations(attrs)).toEqual([
      { Color: 'negro' },
      { Color: 'azul' },
      { Color: 'rojo' },
    ])
  })

  it('returns the full cartesian product for two attributes', () => {
    const attrs: Attribute[] = [
      { name: 'Color', values: ['negro', 'azul'] },
      { name: 'Peso', values: ['8kg', '12kg', '16kg'] },
    ]
    const combos = generateCombinations(attrs)
    expect(combos).toHaveLength(6)
    expect(combos).toContainEqual({ Color: 'negro', Peso: '8kg' })
    expect(combos).toContainEqual({ Color: 'azul', Peso: '16kg' })
  })
})

describe('reconcileVariants', () => {
  it('creates blank variants for a fresh set of attributes', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro', 'azul'] }]
    const result = reconcileVariants(attrs, [])
    expect(result).toHaveLength(2)
    expect(result[0].price).toBeNull()
    expect(result[0].attribute_values).toEqual({ Color: 'negro' })
  })

  it('preserves price/stock/sku for combinations that still exist', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro', 'azul'] }]
    const existing: Variant[] = [
      {
        id: 'v1',
        attribute_values: { Color: 'negro' },
        price: 5000,
        sale_price: null,
        stock: 10,
        sku: 'NEG-1',
        image_url: null,
        weight: null,
        dimensions: null,
      },
    ]
    const result = reconcileVariants(attrs, existing)
    const negro = result.find((v) => v.attribute_values.Color === 'negro')
    expect(negro).toMatchObject({ id: 'v1', price: 5000, stock: 10, sku: 'NEG-1' })
  })

  it('drops variants whose combination no longer exists', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro'] }]
    const existing: Variant[] = [
      {
        id: 'v1',
        attribute_values: { Color: 'negro' },
        price: 100,
        sale_price: null,
        stock: null,
        sku: null,
        image_url: null,
        weight: null,
        dimensions: null,
      },
      {
        id: 'v2',
        attribute_values: { Color: 'azul' },
        price: 200,
        sale_price: null,
        stock: null,
        sku: null,
        image_url: null,
        weight: null,
        dimensions: null,
      },
    ]
    const result = reconcileVariants(attrs, existing)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('v1')
  })

  it('returns no variants when there are no attributes', () => {
    expect(reconcileVariants([], [])).toEqual([])
  })

  it('keeps a deleted (excluded) variant excluded instead of resurrecting it when attributes change', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro', 'azul'] }]
    const existing: Variant[] = [
      {
        id: 'v1',
        attribute_values: { Color: 'negro' },
        price: 100,
        sale_price: null,
        stock: null,
        sku: null,
        image_url: null,
        weight: null,
        dimensions: null,
        excluded: true,
      },
    ]
    // Adding "azul" re-runs reconcile; the deleted "negro" must stay excluded.
    const result = reconcileVariants(attrs, existing)
    const negro = result.find((v) => v.attribute_values.Color === 'negro')
    const azul = result.find((v) => v.attribute_values.Color === 'azul')
    expect(negro?.excluded).toBe(true)
    expect(azul?.excluded).toBeFalsy()
  })

  it('seeds brand-new variants with the product-level price/sale_price as a default', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['claro', 'oscuro'] }]
    const result = reconcileVariants(attrs, [], { price: 10000, sale_price: 6000 })
    expect(result).toHaveLength(2)
    expect(result[0].price).toBe(10000)
    expect(result[0].sale_price).toBe(6000)
    expect(result[1].price).toBe(10000)
  })

  it('does not override an already-existing variant price with the default', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro'] }]
    const existing: Variant[] = [
      {
        id: 'v1',
        attribute_values: { Color: 'negro' },
        price: 500,
        sale_price: null,
        stock: null,
        sku: null,
        image_url: null,
        weight: null,
        dimensions: null,
      },
    ]
    const result = reconcileVariants(attrs, existing, { price: 10000 })
    expect(result[0].price).toBe(500)
  })

  it('falls back to null when no defaults are given, same as before', () => {
    const attrs: Attribute[] = [{ name: 'Color', values: ['negro'] }]
    const result = reconcileVariants(attrs, [])
    expect(result[0].price).toBeNull()
    expect(result[0].sale_price).toBeNull()
  })
})
