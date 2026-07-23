/** Parses a weight typed with a comma decimal separator (e.g. "14,4" or "1,5"). Also accepts a period, since some browsers/keyboards produce one. */
export function parseWeightInput(raw: string): number | null {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '')
  if (normalized === '' || normalized === '.') return null
  const value = Number(normalized)
  return Number.isNaN(value) ? null : value
}

/** Formats a weight for display using a comma decimal separator. */
export function formatWeightDisplay(value: number | null): string {
  if (value === null) return ''
  return value.toString().replace('.', ',')
}
