import { describe, expect, it } from 'vitest'
import { formatPriceDisplay, parsePriceInput } from '@/lib/priceFormat'

describe('parsePriceInput', () => {
  it('parses a plain integer', () => {
    expect(parsePriceInput('3990')).toBe(3990)
  })

  it('strips a dot thousands separator instead of treating it as a decimal', () => {
    expect(parsePriceInput('3.990')).toBe(3990)
  })

  it('strips a thousands comma too', () => {
    expect(parsePriceInput('3,990')).toBe(3990)
  })

  it('strips multiple separators and stray characters', () => {
    expect(parsePriceInput('$15.000,00')).toBe(1500000)
  })

  it('returns null for an empty string', () => {
    expect(parsePriceInput('')).toBeNull()
  })

  it('returns null when nothing but separators/letters were typed', () => {
    expect(parsePriceInput('abc.,')).toBeNull()
  })
})

describe('formatPriceDisplay', () => {
  it('formats with a thousands separator for readability', () => {
    expect(formatPriceDisplay(3990)).toBe('3.990')
  })

  it('returns an empty string for null', () => {
    expect(formatPriceDisplay(null)).toBe('')
  })
})
