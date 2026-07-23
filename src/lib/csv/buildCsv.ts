import Papa from 'papaparse'
import type { Product, WeightUnit } from '@/lib/types'
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
  'Weight',
  'Length (cm)',
  'Width (cm)',
  'Height (cm)',
  'Parent',
]

// Serialized header for the internal Weight key, matching how WooCommerce's own
// exporter labels the column for each store weight unit.
const WEIGHT_HEADER: Record<WeightUnit, string> = {
  kg: 'Weight (kg)',
  lb: 'Weight (lbs)',
}

// A cell starting with any of these is interpreted as a formula by Excel /
// Google Sheets / LibreOffice if the CSV is opened in a spreadsheet (CSV
// "formula injection"). PapaParse quoting does NOT prevent it — the quotes are
// stripped on parse, leaving the formula. Prefixing with a single quote makes
// the app treat the cell as text. This matches WooCommerce's own CSV exporter,
// so the output stays "WooCommerce-shaped".
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

export function escapeCsvValue(value: string): string {
  return FORMULA_TRIGGER.test(value) ? `'${value}` : value
}

/**
 * Flattens every product into WooCommerce CSV Product Importer rows and
 * serializes to a CSV string. Attribute columns are padded to the widest
 * product in the export so every row lines up under the same header run
 * (Attribute 1 name/value(s)/visible/global, Attribute 2 ..., etc).
 * `weightUnit` (the catalog's) only changes the Weight column header — values
 * are exported as entered.
 */
export function buildCsv(products: Product[], options: { weightUnit?: WeightUnit } = {}): string {
  const weightHeader = WEIGHT_HEADER[options.weightUnit ?? 'kg']
  const headerFor = (col: (typeof BASE_COLUMNS)[number]) => (col === 'Weight' ? weightHeader : col)

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

  const headers = [...BASE_COLUMNS.map(headerFor), ...attributeColumns]

  const flatRows = rows.map((row) => {
    const flat: Record<string, string> = {}
    for (const col of BASE_COLUMNS) flat[headerFor(col)] = row[col]

    for (let n = 0; n < maxAttributes; n++) {
      const attr = row.attributes[n]
      flat[`Attribute ${n + 1} name`] = attr?.name ?? ''
      flat[`Attribute ${n + 1} value(s)`] = attr?.value ?? ''
      flat[`Attribute ${n + 1} visible`] = attr ? (attr.visible ? '1' : '0') : ''
      flat[`Attribute ${n + 1} global`] = attr ? (attr.global ? '1' : '0') : ''
    }

    // Neutralize any formula-triggering cell before serialization.
    for (const key of Object.keys(flat)) flat[key] = escapeCsvValue(flat[key])
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
