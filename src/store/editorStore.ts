import { create } from 'zustand'
import { createEmptyProduct, type Product } from '@/lib/types'

/**
 * Local editing state for the products of one catalog. Persistence is a
 * separate side-effect (see useAutosave); this store is just the in-memory
 * working copy the editor renders and mutates. Keyed by catalogId so switching
 * catalogs reloads the right set (see useLoadedProducts).
 */
type EditorState = {
  catalogId: string | null
  products: Product[]
  setCatalogId: (id: string) => void
  setProducts: (products: Product[]) => void
  getProduct: (id: string) => Product | undefined
  addProduct: (catalogId: string) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  removeProductLocal: (id: string) => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  catalogId: null,
  products: [],

  setCatalogId: (id) => set({ catalogId: id }),
  setProducts: (products) => set({ products }),
  getProduct: (id) => get().products.find((p) => p.id === id),

  addProduct: (catalogId) => {
    const product = createEmptyProduct(catalogId, get().products.length)
    set((state) => ({ products: [...state.products, product] }))
    return product
  },

  updateProduct: (id, patch) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p,
      ),
    }))
  },

  removeProductLocal: (id) => {
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }))
  },
}))
