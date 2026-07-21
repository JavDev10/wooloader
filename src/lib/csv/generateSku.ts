const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

/** Slugifies the product name and appends a short id fragment so SKUs stay short but collision-resistant. */
export function generateSku(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const shortId = id.split('-')[0]
  return slug ? `${slug}-${shortId}` : shortId
}
