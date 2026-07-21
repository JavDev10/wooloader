import { useEffect, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { getProductsByCatalog } from '@/lib/api/products'

/** Ensures editorStore holds the products for `catalogId`, fetching once per catalog change. */
export function useLoadedProducts(catalogId: string): boolean {
  const storeCatalogId = useEditorStore((s) => s.catalogId)
  const setCatalogId = useEditorStore((s) => s.setCatalogId)
  const setProducts = useEditorStore((s) => s.setProducts)
  const [loading, setLoading] = useState(storeCatalogId !== catalogId)

  useEffect(() => {
    if (storeCatalogId === catalogId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    getProductsByCatalog(catalogId).then((products) => {
      if (cancelled) return
      setCatalogId(catalogId)
      setProducts(products)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [catalogId, storeCatalogId, setCatalogId, setProducts])

  return loading
}
