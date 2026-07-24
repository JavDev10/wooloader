/**
 * Build-time configuration (Vite inlines these).
 *
 * DEMO_MODE only controls the anonymous "try it" entry on the login page (and
 * the DEMO badge). It requires "Allow anonymous sign-ins" enabled in Supabase.
 *
 * TURNSTILE_SITE_KEY, when set, turns on the Cloudflare Turnstile CAPTCHA on the
 * login page. It must match the widget whose *secret* key is configured in
 * Supabase (Authentication → Attack Protection). Leave it empty to disable
 * CAPTCHA (self-host).
 *
 * Per-user limits are NOT here — they live in the `app_config` table so they can
 * be enforced server-side and changed without a rebuild (see LimitsContext and
 * migration 0006).
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? ''
export const CAPTCHA_ENABLED = TURNSTILE_SITE_KEY !== ''

/**
 * Shows the side ad slots in the app area (hosted instance only). The slots are
 * placeholders until an ad network snippet is dropped into AdSlot.tsx — see that
 * file for the CSP note. Leave false for self-host.
 */
export const ADS_ENABLED = import.meta.env.VITE_ADS_ENABLED === 'true'

/**
 * Cloudflare Web Analytics (cookieless, no consent banner needed). When the
 * token is set, the beacon is injected at startup (src/lib/analytics.ts).
 * Leave empty for self-host — no third-party script is loaded at all.
 */
export const CF_ANALYTICS_TOKEN = (import.meta.env.VITE_CF_ANALYTICS_TOKEN as string | undefined) ?? ''

/**
 * Shows the "continue with Google" button on the login page. Requires the
 * Google provider configured in Supabase (Authentication → Providers), which is
 * where the client ID/secret live — nothing secret is needed here. Off by
 * default so a self-hosted install without Google credentials is unaffected.
 */
export const GOOGLE_AUTH_ENABLED = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true'
