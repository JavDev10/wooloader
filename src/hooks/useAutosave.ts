import { useEffect, useRef, useState } from 'react'
import { upsertProduct } from '@/lib/api/products'
import type { Product } from '@/lib/types'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DEBOUNCE_MS = 800

/**
 * Debounced persist of a product to Supabase as it changes. Purely a save
 * side-effect — local UI state lives in editorStore. Accepts `undefined` so
 * callers can invoke this hook unconditionally (rules of hooks) even before
 * the product has loaded; it simply stays idle until one is provided.
 */
export function useAutosave(product: Product | undefined): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const latestProduct = useRef(product)
  latestProduct.current = product
  const serialized = product ? JSON.stringify(product) : null

  useEffect(() => {
    if (!serialized) return
    setStatus('idle')
    const timer = setTimeout(async () => {
      setStatus('saving')
      try {
        await upsertProduct(latestProduct.current!)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // `serialized` is a deliberate deep-equality proxy for `product` so the debounce resets on any field change, not just identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized])

  return status
}
