/**
 * Runtime configuration derived from build-time env vars (Vite inlines these).
 *
 * DEMO_MODE turns the app into the limited, publicly-hosted showcase: visitors
 * sign in anonymously and can load at most DEMO_MAX_PRODUCTS products per
 * catalog, and ad slots are shown. For a normal self-hosted install, leave
 * VITE_DEMO_MODE unset/false — no cap, no ads, real accounts.
 */

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const parsedMax = Number(import.meta.env.VITE_DEMO_MAX_PRODUCTS)
export const DEMO_MAX_PRODUCTS =
  Number.isFinite(parsedMax) && parsedMax > 0 ? Math.floor(parsedMax) : 15

/** The per-catalog product cap in effect: a finite number in demo mode, Infinity otherwise. */
export const MAX_PRODUCTS_PER_CATALOG = DEMO_MODE ? DEMO_MAX_PRODUCTS : Infinity
