import { useCallback, useEffect, useState } from 'react'
import { getCatalog } from '@/lib/api/catalogs'
import { getMyShareLink } from '@/lib/api/shareLinks'
import { effectiveLinkStatus, type Catalog, type ShareLink } from '@/lib/types'

export type CatalogAccess =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready'
      catalog: Catalog
      /** 'owner' manages the catalog; 'member' is a client who joined through a share link. */
      role: 'owner' | 'member'
      /** The member's link (null for the owner). */
      link: ShareLink | null
      /** Whether the caller may add/edit/delete products right now. */
      editable: boolean
    }

/**
 * Who the signed-in user is for this catalog. The database enforces all of it
 * (RLS, migration 0011); this only shapes the UI — hiding owner-only actions
 * from a client and going read-only once their link is closed or expired.
 */
export function useCatalogAccess(catalogId: string, userId: string) {
  const [access, setAccess] = useState<CatalogAccess>({ status: 'loading' })

  const load = useCallback(async () => {
    try {
      const catalog = await getCatalog(catalogId)
      if (catalog.user_id === userId) {
        setAccess({ status: 'ready', catalog, role: 'owner', link: null, editable: true })
        return
      }
      const link = await getMyShareLink(catalogId)
      setAccess({
        status: 'ready',
        catalog,
        role: 'member',
        link,
        editable: link !== null && effectiveLinkStatus(link) === 'open',
      })
    } catch {
      setAccess({ status: 'error' })
    }
  }, [catalogId, userId])

  useEffect(() => {
    load()
  }, [load])

  return { access, reload: load, setAccess }
}
