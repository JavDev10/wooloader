import { supabase } from '@/lib/supabaseClient'
import { productSchema, type Product } from '@/lib/types'

/**
 * Product reads/writes for the signed-in user. Direct table access, scoped by
 * RLS through the product's catalog owner (see supabase/migrations/0001_init.sql).
 */

export async function getProductsByCatalog(catalogId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('catalog_id', catalogId)
    .order('local_order')
  if (error) throw error
  return data.map((row) => productSchema.parse(row))
}

/** Inserts or updates one product (the app owns the uuid, so upsert on the primary key). */
export async function upsertProduct(product: Product): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select('*')
    .single()
  if (error) throw error
  return productSchema.parse(data)
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId)
  if (error) throw error
}

/** Distinct non-empty categories the user has already used in a catalog — feeds the category autocomplete. */
export async function listCatalogCategories(catalogId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('products')
    .select('category')
    .eq('catalog_id', catalogId)
    .neq('category', '')
  if (error) throw error
  return [...new Set((data ?? []).map((r) => r.category as string))].sort()
}
