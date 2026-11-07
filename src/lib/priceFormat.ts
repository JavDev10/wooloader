import { currencyDecimals, currencyLocale, DEFAULT_CURRENCY } from '@/lib/currency'

/**
 * Parses what the user typed into a price field. `decimals` is how many decimal
 * places the catalog's currency allows (see currencyDecimals).
 *
 * With 0 decimals (CLP, PYG…) every separator is a thousands separator, so
 * "3990", "3.990" and "3,990" all become 3990. This also avoids a real bug: a
 * native <input type="number"> parses "3.990" as the decimal 3.99.
 *
 * With decimals, both conventions are accepted ("1,234.56" and "1.234,56"):
 * - if both "." and "," appear, the last one is the decimal separator;
 * - a lone separator followed by exactly 3 digits ("1.234") is a thousands
 *   separator, unless the integer part is 0 ("0.125");
 * - otherwise it's the decimal separator ("19.99", "19,9", or "19." mid-typing).
 * Extra decimal digits are dropped, not rounded, so the value never shows more
 * precision than the currency has.
 */
export function parsePriceInput(raw: string, decimals = 0): number | null {
  const cleaned = raw.replace(/[^\d.,]/g, '')
  if (!/\d/.test(cleaned)) return null
  if (decimals === 0) return Number(cleaned.replace(/\D/g, ''))

  const lastSep = Math.max(cleaned.lastIndexOf('.'), cleaned.lastIndexOf(','))
  if (lastSep === -1) return Number(cleaned)

  const intPart = cleaned.slice(0, lastSep).replace(/\D/g, '')
  const fracPart = cleaned.slice(lastSep + 1)
  const mixedSeparators = cleaned.includes('.') && cleaned.includes(',')
  const isThousands = !mixedSeparators && fracPart.length === 3 && Number(intPart) > 0

  if (isThousands) return Number(intPart + fracPart)
  return Number(`${intPart || '0'}.${fracPart.slice(0, decimals) || '0'}`)
}

/** Grouped number with the currency's decimals and no symbol, e.g. "3.990" (CLP) or "1,234.50" (USD). Display only. */
export function formatPriceDisplay(value: number | null, currency: string = DEFAULT_CURRENCY): string {
  if (value === null) return ''
  const decimals = currencyDecimals(currency)
  return new Intl.NumberFormat(currencyLocale(currency), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * The value as shown while the field is focused: no grouping (so it can't be
 * mistaken for decimals), the locale's decimal separator, no padded zeros —
 * "19,9" (CLP-style locales) or "19.9" (en-US). parsePriceInput reads it back.
 */
export function formatPriceEditable(value: number | null, currency: string = DEFAULT_CURRENCY): string {
  if (value === null) return ''
  return new Intl.NumberFormat(currencyLocale(currency), {
    useGrouping: false,
    maximumFractionDigits: currencyDecimals(currency),
  }).format(value)
}

/** Price with the currency symbol, e.g. "$3.990", "$19.90", "R$ 19,90". Display only. */
export function formatMoney(value: number, currency: string = DEFAULT_CURRENCY): string {
  const decimals = currencyDecimals(currency)
  return new Intl.NumberFormat(currencyLocale(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * A price as WooCommerce's CSV importer expects it: "." as the decimal
 * separator, no thousands separator, no symbol ("3990", "19.9"). The importer
 * maps "." correctly whatever separators the store displays. Rounded to the
 * currency's decimals when given (e.g. a catalog switched from USD to CLP).
 */
export function formatPriceForCsv(value: number | null, decimals?: number): string {
  if (value === null) return ''
  if (decimals === undefined) return String(value)
  return String(Number(value.toFixed(decimals)))
}
