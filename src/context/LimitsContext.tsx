import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { countUserCatalogs, countUserProducts, getLimits } from '@/lib/api/limits'

type LimitsState = {
  enabled: boolean
  maxProducts: number
  maxCatalogs: number
  productCount: number
  catalogCount: number
  loaded: boolean
}

type LimitsContextValue = LimitsState & {
  atProductLimit: boolean
  atCatalogLimit: boolean
  /** Optimistically adjust the counts after a create/delete so the UI stays in sync without a refetch. */
  bumpProducts: (delta: number) => void
  bumpCatalogs: (delta: number) => void
}

const LimitsContext = createContext<LimitsContextValue | null>(null)

const UNLIMITED: LimitsState = {
  enabled: false,
  maxProducts: Infinity,
  maxCatalogs: Infinity,
  productCount: 0,
  catalogCount: 0,
  loaded: false,
}

export function LimitsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LimitsState>(UNLIMITED)

  useEffect(() => {
    let cancelled = false
    getLimits()
      .then(async (limits) => {
        if (!limits.enabled) {
          if (!cancelled) setState({ ...UNLIMITED, loaded: true })
          return
        }
        const [productCount, catalogCount] = await Promise.all([countUserProducts(), countUserCatalogs()])
        if (!cancelled) {
          setState({
            enabled: true,
            maxProducts: limits.maxProducts,
            maxCatalogs: limits.maxCatalogs,
            productCount,
            catalogCount,
            loaded: true,
          })
        }
      })
      // If app_config can't be read (e.g. migration not applied yet), fail open: no limits.
      .catch(() => {
        if (!cancelled) setState({ ...UNLIMITED, loaded: true })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value: LimitsContextValue = {
    ...state,
    atProductLimit: state.enabled && state.productCount >= state.maxProducts,
    atCatalogLimit: state.enabled && state.catalogCount >= state.maxCatalogs,
    bumpProducts: (delta) => setState((s) => ({ ...s, productCount: Math.max(0, s.productCount + delta) })),
    bumpCatalogs: (delta) => setState((s) => ({ ...s, catalogCount: Math.max(0, s.catalogCount + delta) })),
  }

  return <LimitsContext.Provider value={value}>{children}</LimitsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLimits(): LimitsContextValue {
  const ctx = useContext(LimitsContext)
  if (!ctx) throw new Error('useLimits must be used within LimitsProvider')
  return ctx
}
