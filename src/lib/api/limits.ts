import { supabase } from '@/lib/supabaseClient'

/**
 * Per-user limits live in the single `app_config` row (readable by anyone; only
 * writable from the SQL editor — see migrations 0006/0011). The DB triggers are
 * the real enforcement; the app reads these values just to show usage and
 * disable the "add" actions once you're at the cap. Caps depend on the plan.
 */

export type Limits = {
  enabled: boolean
  free: { maxProducts: number; maxCatalogs: number }
  developer: { maxProducts: number; maxCatalogs: number }
  maxImages: number
  maxProductsPerLink: number
}

export async function getLimits(): Promise<Limits> {
  const { data, error } = await supabase
    .from('app_config')
    .select(
      'limits_enabled, max_products_per_user, max_catalogs_per_user, max_images_per_product, dev_max_products_per_user, dev_max_catalogs_per_user, max_products_per_link',
    )
    .single()
  if (error) throw error
  return {
    enabled: data.limits_enabled,
    free: { maxProducts: data.max_products_per_user, maxCatalogs: data.max_catalogs_per_user },
    developer: { maxProducts: data.dev_max_products_per_user, maxCatalogs: data.dev_max_catalogs_per_user },
    maxImages: data.max_images_per_product,
    maxProductsPerLink: data.max_products_per_link,
  }
}

/** Products in the catalogs the user OWNS (a client's shared catalogs don't count against them). */
export async function countUserProducts(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('products')
    .select('id, catalogs!inner(user_id)', { count: 'exact', head: true })
    .eq('catalogs.user_id', userId)
  if (error) throw error
  return count ?? 0
}

/** Catalogs the user owns. */
export async function countUserCatalogs(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('catalogs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return count ?? 0
}
