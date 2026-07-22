import { supabase } from '@/lib/supabaseClient'

/**
 * Per-user limits live in the single `app_config` row (readable by anyone; only
 * writable from the SQL editor — see migration 0006). The DB triggers are the
 * real enforcement; the app reads these values just to show usage and disable
 * the "add" actions once you're at the cap.
 */

export type Limits = { enabled: boolean; maxProducts: number; maxCatalogs: number }

export async function getLimits(): Promise<Limits> {
  const { data, error } = await supabase
    .from('app_config')
    .select('limits_enabled, max_products_per_user, max_catalogs_per_user')
    .single()
  if (error) throw error
  return {
    enabled: data.limits_enabled,
    maxProducts: data.max_products_per_user,
    maxCatalogs: data.max_catalogs_per_user,
  }
}

/** Total products across all of the user's catalogs (RLS scopes this to the caller). */
export async function countUserProducts(): Promise<number> {
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

/** Total catalogs owned by the user. */
export async function countUserCatalogs(): Promise<number> {
  const { count, error } = await supabase.from('catalogs').select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}
