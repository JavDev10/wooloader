/** Minimum shippable weight. Default carrier constraint; adjust per store if needed. */
export const MIN_WEIGHT_KG = 0.5

/** Parses a weight typed with a comma decimal separator (e.g. "14,4" or "1,5"). Also accepts a period, since some browsers/keyboards produce one. */
export function parseWeightInput(raw: string): number | null {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '')
  if (normalized === '' || normalized === '.') return null
  const value = Number(normalized)
  return Number.isNaN(value) ? null : value
}

/** Clamps to the shipping minimum — only meant to be applied once the user is done typing (e.g. on blur), not on every keystroke. */
export function clampWeight(value: number | null): number | null {
  if (value === null) return null
  return Math.max(value, MIN_WEIGHT_KG)
}

/** Formats a weight for display using a comma decimal separator. */
export function formatWeightDisplay(value: number | null): string {
  if (value === null) return ''
  return value.toString().replace('.', ',')
}
