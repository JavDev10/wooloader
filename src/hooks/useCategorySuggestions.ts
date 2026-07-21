import { useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * Category / subcategory autocomplete suggestions, derived live from the
 * products already loaded in the editor store — no extra round-trip. Scoped to
 * the current catalog (that's all the store holds at a time).
 */
export function useCategorySuggestions(): string[] {
  const products = useEditorStore((s) => s.products)
  return useMemo(
    () =>
      [...new Set(products.map((p) => p.category).filter((c) => c.trim() !== ''))].sort(),
    [products],
  )
}

/** Subcategory suggestions, further scoped to the category chosen for this product. */
export function useSubcategorySuggestions(category: string): string[] {
  const products = useEditorStore((s) => s.products)
  return useMemo(() => {
    if (!category.trim()) return []
    return [
      ...new Set(
        products
          .filter((p) => p.category === category && p.subcategory.trim() !== '')
          .map((p) => p.subcategory),
      ),
    ].sort()
  }, [products, category])
}
