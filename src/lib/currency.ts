/**
 * Per-catalog currency. A catalog targets one WooCommerce store, and the store
 * has a single currency — so, like the weight unit, the currency lives on the
 * catalog. It decides how many decimals a price may have (CLP: 0, USD: 2…) and
 * how prices are displayed. Values are NOT converted when it changes.
 *
 * Each currency is paired with the locale its stores typically use, so prices
 * read the way that store's customers write them ("$3.990" in Chile,
 * "$19.99" in the US, "R$ 19,90" in Brazil), whatever the UI language is.
 */
export type CurrencyOption = { code: string; locale: string }

export const CURRENCIES: CurrencyOption[] = [
  { code: 'CLP', locale: 'es-CL' },
  { code: 'USD', locale: 'en-US' },
  { code: 'EUR', locale: 'es-ES' },
  { code: 'MXN', locale: 'es-MX' },
  { code: 'ARS', locale: 'es-AR' },
  { code: 'COP', locale: 'es-CO' },
  { code: 'PEN', locale: 'es-PE' },
  { code: 'UYU', locale: 'es-UY' },
  { code: 'PYG', locale: 'es-PY' },
  { code: 'BOB', locale: 'es-BO' },
  { code: 'CRC', locale: 'es-CR' },
  { code: 'GTQ', locale: 'es-GT' },
  { code: 'DOP', locale: 'es-DO' },
  { code: 'BRL', locale: 'pt-BR' },
  { code: 'GBP', locale: 'en-GB' },
  { code: 'CAD', locale: 'en-CA' },
]

/** Matches the DB column default (migration 0009) — existing catalogs were CLP. */
export const DEFAULT_CURRENCY = 'CLP'

export function currencyLocale(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.locale ?? 'en-US'
}

/** How many decimals a price may have in this currency (ISO 4217 minor units, via Intl). */
export function currencyDecimals(code: string): number {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

/** "peso chileno" / "US dollar"… in the UI language; falls back to the bare code. */
export function currencyName(code: string, uiLanguage: string): string {
  try {
    return new Intl.DisplayNames([uiLanguage], { type: 'currency' }).of(code) ?? code
  } catch {
    return code
  }
}

const EUROZONE = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
])

const REGION_CURRENCY: Record<string, string> = {
  CL: 'CLP', US: 'USD', EC: 'USD', SV: 'USD', PA: 'USD', PR: 'USD',
  MX: 'MXN', AR: 'ARS', CO: 'COP', PE: 'PEN', UY: 'UYU', PY: 'PYG', BO: 'BOB',
  CR: 'CRC', GT: 'GTQ', DO: 'DOP', BR: 'BRL', GB: 'GBP', CA: 'CAD',
}

/**
 * Best guess for a new catalog's currency from the browser's languages
 * ("es-CL" → CLP, "pt-BR" → BRL). Only a starting point — the user can change
 * it on the catalog page. USD when no listed region is found.
 */
export function guessCurrency(languages: readonly string[] = navigator.languages ?? []): string {
  for (const lang of languages) {
    const region = lang.split('-')[1]?.toUpperCase()
    if (!region) continue
    if (REGION_CURRENCY[region]) return REGION_CURRENCY[region]
    if (EUROZONE.has(region)) return 'EUR'
  }
  return 'USD'
}
