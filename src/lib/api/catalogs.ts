import { supabase } from '@/lib/supabaseClient'
import { catalogSchema, type Catalog, type WeightUnit } from '@/lib/types'

/**
 * Catalog CRUD for the signed-in user. All access is direct table access,
 * safe because RLS scopes every row to its owner (auth.uid()) — see
 * supabase/migrations/0001_init.sql. user_id defaults to auth.uid() in the DB,
 * so inserts don't need to set it.
 */

export async function listCatalogs(): Promise<Catalog[]> {
  const { data, error } = await supabase
    .from('catalogs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row) => catalogSchema.parse(row))
}

export async function getCatalog(id: string): Promise<Catalog> {
  const { data, error } = await supabase.from('catalogs').select('*').eq('id', id).single()
  if (error) throw error
  return catalogSchema.parse(data)
}

export async function createCatalog(name: string): Promise<Catalog> {
  const { data, error } = await supabase
    .from('catalogs')
    .insert({ name })
    .select('*')
    .single()
  if (error) throw error
  return catalogSchema.parse(data)
}

export async function renameCatalog(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('catalogs').update({ name }).eq('id', id)
  if (error) throw error
}

/** Sets the catalog's weight unit (labels + CSV header only — stored values are not converted). */
export async function setCatalogWeightUnit(id: string, unit: WeightUnit): Promise<void> {
  const { error } = await supabase.from('catalogs').update({ weight_unit: unit }).eq('id', id)
  if (error) throw error
}

const IMAGES_BUCKET = 'product-images'

/** Lists every uploaded image path under {userId}/{catalogId}/* (Storage lists one level deep, so we walk the product-id folders). */
async function listCatalogImagePaths(userId: string, catalogId: string): Promise<string[]> {
  const prefix = `${userId}/${catalogId}`
  const { data: productFolders, error: listError } = await supabase.storage
    .from(IMAGES_BUCKET)
    .list(prefix)
  if (listError) throw listError

  const paths: string[] = []
  for (const folder of productFolders ?? []) {
    const { data: files, error: filesError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .list(`${prefix}/${folder.name}`)
    if (filesError) throw filesError
    for (const file of files ?? []) {
      paths.push(`${prefix}/${folder.name}/${file.name}`)
    }
  }
  return paths
}

/**
 * Permanently deletes a catalog: its uploaded images in Storage first, then the
 * catalog row (products cascade-delete via the FK, but Storage files don't —
 * they'd sit there taking up space otherwise). Needs the userId to build the
 * storage prefix; get it from the current session.
 */
export async function deleteCatalogCompletely(userId: string, catalogId: string): Promise<void> {
  const paths = await listCatalogImagePaths(userId, catalogId)
  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(IMAGES_BUCKET).remove(paths)
    if (removeError) throw removeError
  }

  const { error } = await supabase.from('catalogs').delete().eq('id', catalogId)
  if (error) throw error
}
