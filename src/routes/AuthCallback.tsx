import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSession, onAuthStateChange } from '@/lib/api/auth'

/** How long to wait for supabase-js to turn the OAuth response into a session. */
const TIMEOUT_MS = 10_000

/**
 * OAuth return URL. supabase-js parses the provider's response from the URL on
 * load (detectSessionInUrl) and stores the session; this screen just waits for
 * that to happen and forwards to the app — or explains the failure if the user
 * denied consent or the exchange didn't complete.
 */
export default function AuthCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // The provider reports denial/misconfiguration straight in the query string.
  // Derived (not copied into state) so it stays correct if the params change.
  const hasProviderError = params.has('error')
  const [timedOut, setTimedOut] = useState(false)
  const failed = hasProviderError || timedOut

  useEffect(() => {
    if (hasProviderError) return
    let cancelled = false
    setTimedOut(false)

    const unsubscribe = onAuthStateChange((session) => {
      if (session && !cancelled) navigate('/app', { replace: true })
    })
    // Covers the case where the session already exists by the time we mount.
    getSession()
      .then((session) => {
        if (session && !cancelled) navigate('/app', { replace: true })
      })
      .catch(() => {})

    const timer = setTimeout(() => {
      if (!cancelled) setTimedOut(true)
    }, TIMEOUT_MS)

    return () => {
      cancelled = true
      unsubscribe()
      clearTimeout(timer)
    }
  }, [navigate, hasProviderError])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      {failed ? (
        <>
          <p className="text-muted">{t('authCallback.failed')}</p>
          <Link
            to="/login"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:opacity-90"
          >
            {t('authCallback.backToLogin')}
          </Link>
        </>
      ) : (
        <p className="text-muted">{t('authCallback.signingIn')}</p>
      )}
    </div>
  )
}
