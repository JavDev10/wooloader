import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { countUserCatalogs, countUserProducts, getLimits } from '@/lib/api/limits'
import { getMyPlan } from '@/lib/api/shareLinks'
import type { Plan } from '@/lib/types'

type LimitsState = {
  enabled: boolean
  /** Effective plan: always 'developer' when limits are off (self-host). */
  plan: Plan
  maxProducts: number
  maxCatalogs: number
  maxImages: number
  maxProductsPerLink: number
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

/** No limits, every feature: self-host, or app_config not readable yet. */
const UNLIMITED: LimitsState = {
  enabled: false,
  plan: 'developer',
  maxProducts: Infinity,
  maxCatalogs: Infinity,
  maxImages: Infinity,
  maxProductsPerLink: 1000,
  productCount: 0,
  catalogCount: 0,
  loaded: false,
}

export function LimitsProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [state, setState] = useState<LimitsState>(UNLIMITED)

  useEffect(() => {
    let cancelled = false
    getLimits()
      .then(async (limits) => {
        if (!limits.enabled) {
          if (!cancelled) setState({ ...UNLIMITED, loaded: true })
          return
        }
        const [plan, productCount, catalogCount] = await Promise.all([
          // Fail closed on the plan: if it can't be read, treat as free.
          getMyPlan().catch(() => 'free' as const),
          countUserProducts(userId),
          countUserCatalogs(userId),
        ])
        const caps = limits[plan]
        if (!cancelled) {
          setState({
            enabled: true,
            plan,
            maxProducts: caps.maxProducts,
            maxCatalogs: caps.maxCatalogs,
            maxImages: limits.maxImages,
            maxProductsPerLink: limits.maxProductsPerLink,
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
  }, [userId])

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
