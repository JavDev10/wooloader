/**
 * Prices are currently whole integers — no decimals, no thousands separator in
 * the stored/exported value. Strips everything but digits so it doesn't matter
 * whether the user types "3990", "3.990" (dot thousands convention) or "3,990"
 * — all three become the plain integer 3990. This also fixes a real bug: a
 * native <input type="number"> parses "3.990" as the decimal 3.99, silently
 * wrecking the price.
 *
 * NOTE: this assumes a zero-decimal currency (CLP, JPY, …). Proper decimal /
 * multi-currency support is a planned generalization (see PLAN.md).
 */
export function parsePriceInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return null
  return Number(digits)
}

/** Formats a clean integer price with a thousands separator for readability — display only, never what gets stored or exported. */
export function formatPriceDisplay(value: number | null): string {
  if (value === null) return ''
  return value.toLocaleString('es-CL')
}
