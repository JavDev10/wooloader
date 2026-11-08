import { supabase } from '@/lib/supabaseClient'
import {
  planSchema,
  publicShareLinkSchema,
  shareLinkSchema,
  type Plan,
  type PublicShareLink,
  type ShareLink,
} from '@/lib/types'

/**
 * Client share links (migration 0011). The owner manages links with plain
 * table access (RLS: owner of the catalog, developer plan to create); clients
 * go through the RPCs, which validate the token server-side.
 */

/** The caller's effective plan. 'developer' everywhere limits are off (self-host). */
export async function getMyPlan(): Promise<Plan> {
  const { data, error } = await supabase.rpc('my_plan')
  if (error) throw error
  return planSchema.parse(data)
}

export function shareLinkUrl(token: string): string {
  return `${window.location.origin}/c/${token}`
}

export async function listShareLinks(catalogId: string): Promise<ShareLink[]> {
  const { data, error } = await supabase
    .from('share_links')
    .select('*')
    .eq('catalog_id', catalogId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((row) => shareLinkSchema.parse(row))
}

export async function createShareLink(input: {
  catalogId: string
  label: string
  maxProducts: number
  expiresAt: string | null
}): Promise<ShareLink> {
  const { data, error } = await supabase
    .from('share_links')
    .insert({
      catalog_id: input.catalogId,
      label: input.label,
      max_products: input.maxProducts,
      expires_at: input.expiresAt,
    })
    .select('*')
    .single()
  if (error) throw error
  return shareLinkSchema.parse(data)
}

export async function updateShareLink(
  id: string,
  patch: Partial<Pick<ShareLink, 'status' | 'expires_at' | 'label' | 'max_products'>>,
): Promise<ShareLink> {
  const { data, error } = await supabase.from('share_links').update(patch).eq('id', id).select('*').single()
  if (error) throw error
  return shareLinkSchema.parse(data)
}

/**
 * The link a MEMBER joined the catalog through. RLS only shows a member their
 * own link, so this is that one row (null if the caller isn't a member).
 */
export async function getMyShareLink(catalogId: string): Promise<ShareLink | null> {
  const { data, error } = await supabase.from('share_links').select('*').eq('catalog_id', catalogId).limit(1)
  if (error) throw error
  return data.length > 0 ? shareLinkSchema.parse(data[0]) : null
}

/** Public info for the /c/<token> page, readable before signing in. null = no such link. */
export async function getPublicShareLink(token: string): Promise<PublicShareLink | null> {
  const { data, error } = await supabase.rpc('get_share_link', { p_token: token })
  if (error) throw error
  const rows = (data ?? []) as unknown[]
  return rows.length > 0 ? publicShareLinkSchema.parse(rows[0]) : null
}

/** Joins the signed-in user to the link's catalog; returns the catalog id. */
export async function redeemShareLink(token: string): Promise<string> {
  const { data, error } = await supabase.rpc('redeem_share_link', { p_token: token })
  if (error) throw error
  return data as string
}

/** The client's "Done": closes their link, making the catalog read-only for them. */
export async function submitSharedCatalog(catalogId: string): Promise<void> {
  const { error } = await supabase.rpc('submit_shared_catalog', { p_catalog_id: catalogId })
  if (error) throw error
}
