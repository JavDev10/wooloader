/** One `Attribute N name/value(s)/visible/global` column group. Position in the array is the column index (N). */
export type CsvAttributeColumn = {
  name: string
  value: string
  visible: boolean
  global: boolean
}

/** A logical export row for one product or product variation, before attribute columns are flattened/aligned across the whole file (see buildCsv.ts). */
export type CsvRow = {
  Type: string
  SKU: string
  Name: string
  'Published': string
  'Is featured?': string
  'Visibility in catalog': string
  Description: string
  'Short description': string
  'Regular price': string
  'Sale price': string
  Categories: string
  Images: string
  'In stock?': string
  // No "Manage stock?" column — it isn't a real WooCommerce CSV importer
  // field. WooCommerce infers manage_stock from whether Stock is present.
  Stock: string
  'Weight (kg)': string
  'Length (cm)': string
  'Width (cm)': string
  'Height (cm)': string
  Parent: string
  attributes: CsvAttributeColumn[]
}
