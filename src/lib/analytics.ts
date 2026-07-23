import { CF_ANALYTICS_TOKEN } from '@/lib/config'

/**
 * Injects the Cloudflare Web Analytics beacon when a token is configured
 * (hosted instance). Cookieless and without fingerprinting, so it needs no
 * consent banner — it's disclosed in the privacy policy. SPA route changes are
 * tracked automatically by the beacon via the History API.
 *
 * No-op when the token is empty (self-host): no third-party script is loaded.
 * The CSP in netlify.toml allows static.cloudflareinsights.com (script) and
 * cloudflareinsights.com (the beacon's POSTs).
 */
export function initAnalytics(): void {
  if (!CF_ANALYTICS_TOKEN) return
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_ANALYTICS_TOKEN }))
  document.head.appendChild(script)
}
