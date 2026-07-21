import { supabase } from '@/lib/supabaseClient'
import type { ProductImage } from '@/lib/types'

const BUCKET = 'product-images'

/**
 * Uploads a product image under {userId}/{catalogId}/{productId}/{uuid}.{ext}.
 * The first path segment (the owner's auth.uid()) is what the Storage RLS
 * policy checks to isolate each user's uploads (see 0001_init.sql). Pass the
 * signed-in user's id — read it from the current session.
 */
export async function uploadProductImage(
  userId: string,
  catalogId: string,
  productId: string,
  file: File,
): Promise<ProductImage> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${userId}/${catalogId}/${productId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return {
    url: publicUrlData.publicUrl,
    storage_path: path,
    is_primary: false,
    sort_order: 0,
  }
}

export async function deleteProductImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}
