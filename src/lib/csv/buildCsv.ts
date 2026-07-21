import Papa from 'papaparse'
import type { Product } from '@/lib/types'
import { mapProductToRows } from '@/lib/csv/mapProductToRows'
import type { CsvRow } from '@/lib/csv/types'

const BASE_COLUMNS: (keyof Omit<CsvRow, 'attributes'>)[] = [
  'Type',
  'SKU',
  'Name',
  'Published',
  'Is featured?',
  'Visibility in catalog',
  'Description',
  'Short description',
  'Regular price',
  'Sale price',
  'Categories',
  'Images',
  'In stock?',
  'Stock',
  'Weight (kg)',
  'Length (cm)',
  'Width (cm)',
  'Height (cm)',
  'Parent',
]

/**
 * Flattens every product into WooCommerce CSV Product Importer rows and
 * serializes to a CSV string. Attribute columns are padded to the widest
 * product in the export so every row lines up under the same header run
 * (Attribute 1 name/value(s)/visible/global, Attribute 2 ..., etc).
 */
export function buildCsv(products: Product[]): string {
  const rows = products.flatMap(mapProductToRows)
  const maxAttributes = rows.reduce((max, row) => Math.max(max, row.attributes.length), 0)

  const attributeColumns: string[] = []
  for (let n = 1; n <= maxAttributes; n++) {
    attributeColumns.push(
      `Attribute ${n} name`,
      `Attribute ${n} value(s)`,
      `Attribute ${n} visible`,
      `Attribute ${n} global`,
    )
  }

  const headers = [...BASE_COLUMNS, ...attributeColumns, 'Meta: price_tiers']

  const flatRows = rows.map((row) => {
    const flat: Record<string, string> = {}
    for (const col of BASE_COLUMNS) flat[col] = row[col]

    for (let n = 0; n < maxAttributes; n++) {
      const attr = row.attributes[n]
      flat[`Attribute ${n + 1} name`] = attr?.name ?? ''
      flat[`Attribute ${n + 1} value(s)`] = attr?.value ?? ''
      flat[`Attribute ${n + 1} visible`] = attr ? (attr.visible ? '1' : '0') : ''
      flat[`Attribute ${n + 1} global`] = attr ? (attr.global ? '1' : '0') : ''
    }

    flat['Meta: price_tiers'] = row['Meta: price_tiers']
    return flat
  })

  return Papa.unparse({ fields: headers, data: flatRows })
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
