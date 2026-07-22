/**
 * Build-time configuration (Vite inlines these).
 *
 * DEMO_MODE only controls the anonymous "try it" entry on the login page (and
 * the DEMO badge). It requires "Allow anonymous sign-ins" enabled in Supabase.
 *
 * Per-user limits are NOT here — they live in the `app_config` table so they can
 * be enforced server-side and changed without a rebuild (see LimitsContext and
 * migration 0006).
 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
