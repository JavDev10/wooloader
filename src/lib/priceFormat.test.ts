import { describe, expect, it } from 'vitest'
import {
  formatMoney,
  formatPriceDisplay,
  formatPriceEditable,
  formatPriceForCsv,
  parsePriceInput,
} from '@/lib/priceFormat'
import { currencyDecimals, guessCurrency } from '@/lib/currency'

describe('currency helpers', () => {
  it('knows each currency’s decimals', () => {
    expect(currencyDecimals('CLP')).toBe(0)
    expect(currencyDecimals('USD')).toBe(2)
    expect(currencyDecimals('BRL')).toBe(2)
  })

  it('guesses the currency from the browser region', () => {
    expect(guessCurrency(['es-CL', 'es'])).toBe('CLP')
    expect(guessCurrency(['pt-BR'])).toBe('BRL')
    expect(guessCurrency(['de-DE'])).toBe('EUR')
    expect(guessCurrency(['es', 'en'])).toBe('USD')
  })
})

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

describe('parsePriceInput with decimals', () => {
  it('reads a dot decimal', () => {
    expect(parsePriceInput('19.99', 2)).toBe(19.99)
  })

  it('reads a comma decimal', () => {
    expect(parsePriceInput('19,99', 2)).toBe(19.99)
  })

  it('reads either thousands/decimal convention', () => {
    expect(parsePriceInput('1,234.56', 2)).toBe(1234.56)
    expect(parsePriceInput('1.234,56', 2)).toBe(1234.56)
  })

  it('treats a lone separator before exactly 3 digits as thousands', () => {
    expect(parsePriceInput('1.234', 2)).toBe(1234)
    expect(parsePriceInput('12,345,678', 2)).toBe(12345678)
  })

  it('treats 0.xxx as a decimal, not thousands', () => {
    expect(parsePriceInput('0.125', 2)).toBe(0.12)
  })

  it('keeps a half-typed decimal ("19.") as the integer', () => {
    expect(parsePriceInput('19.', 2)).toBe(19)
    expect(parsePriceInput('19,5', 2)).toBe(19.5)
  })

  it('drops digits beyond the currency decimals instead of rounding', () => {
    expect(parsePriceInput('19,9999', 2)).toBe(19.99)
  })

  it('accepts a leading separator', () => {
    expect(parsePriceInput(',5', 2)).toBe(0.5)
  })

  it('ignores symbols and spaces', () => {
    expect(parsePriceInput('US$ 1,299.00', 2)).toBe(1299)
  })
})

describe('formatPriceDisplay', () => {
  it('formats with a thousands separator for readability', () => {
    expect(formatPriceDisplay(3990)).toBe('3.990')
  })

  it('returns an empty string for null', () => {
    expect(formatPriceDisplay(null)).toBe('')
  })

  it('pads to the currency decimals in its locale', () => {
    expect(formatPriceDisplay(1234.5, 'USD')).toBe('1,234.50')
    expect(formatPriceDisplay(1234.5, 'BRL')).toBe('1.234,50')
  })

  it('shows no decimals for a zero-decimal currency', () => {
    expect(formatPriceDisplay(3990, 'CLP')).toBe('3.990')
  })
})

describe('formatPriceEditable', () => {
  it('drops grouping so it parses back to the same value', () => {
    for (const [value, currency] of [
      [1234.5, 'USD'],
      [1234.5, 'BRL'],
      [3990, 'CLP'],
      [19.99, 'EUR'],
    ] as const) {
      const text = formatPriceEditable(value, currency)
      expect(parsePriceInput(text, currencyDecimals(currency))).toBe(value)
    }
  })
})

describe('formatMoney', () => {
  it('includes the currency symbol', () => {
    expect(formatMoney(3990, 'CLP')).toBe('$3.990')
    expect(formatMoney(19.9, 'USD')).toBe('$19.90')
  })
})

describe('formatPriceForCsv', () => {
  it('uses a dot decimal and no thousands separator', () => {
    expect(formatPriceForCsv(1234.5, 2)).toBe('1234.5')
  })

  it('rounds to the currency decimals', () => {
    expect(formatPriceForCsv(19.99, 0)).toBe('20')
  })

  it('writes the stored value when no decimals are given', () => {
    expect(formatPriceForCsv(3990)).toBe('3990')
  })

  it('is empty for null', () => {
    expect(formatPriceForCsv(null, 2)).toBe('')
  })
})
