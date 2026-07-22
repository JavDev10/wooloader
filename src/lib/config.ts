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
