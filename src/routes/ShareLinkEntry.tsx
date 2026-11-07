import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackagePlus } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { getValidatedSession, signInAnonymously } from '@/lib/api/auth'
import { getPublicShareLink, redeemShareLink } from '@/lib/api/shareLinks'
import { authErrorMessage } from '@/lib/authErrors'
import { CAPTCHA_ENABLED } from '@/lib/config'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Turnstile, type TurnstileHandle } from '@/components/ui/Turnstile'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { PublicShareLink } from '@/lib/types'

type LinkState = { status: 'loading' } | { status: 'missing' } | { status: 'error' } | { status: 'ok'; link: PublicShareLink }

/**
 * Landing page of a client share link (/c/<token>). Shows what the link is for
 * BEFORE creating anything, so a dead link never creates a guest user. "Start"
 * signs the visitor in as a guest (or reuses their session) and joins them to
 * the catalog, then hands over to the normal catalog editor.
 */
export default function ShareLinkEntry() {
  const { t, i18n } = useTranslation()
  const { token = '' } = useParams<{ token: string }>()
  const navigate = useNavigate()
  usePageTitle(t('shareLink.pageTitle'))

  const [linkState, setLinkState] = useState<LinkState>({ status: 'loading' })
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileHandle>(null)

  useEffect(() => {
    getPublicShareLink(token)
      .then((link) => setLinkState(link ? { status: 'ok', link } : { status: 'missing' }))
      .catch(() => setLinkState({ status: 'error' }))
    getValidatedSession()
      .then(setSession)
      .catch(() => setSession(null))
  }, [token])

  const hasSession = session !== null && session !== 'loading'
  const needsCaptcha = !hasSession && CAPTCHA_ENABLED && !captchaToken

  async function handleJoin() {
    setJoining(true)
    setError(null)
    try {
      if (!hasSession) await signInAnonymously(captchaToken ?? undefined, 'share_link')
      const catalogId = await redeemShareLink(token)
      navigate(`/app/catalog/${catalogId}`, { replace: true })
    } catch (err) {
      console.error(err)
      // Supabase errors aren't always Error instances; read the message duck-typed.
      const message = typeof err === 'object' && err && 'message' in err ? String(err.message) : ''
      setError(
        message.includes('link_closed')
          ? t('shareLink.closed')
          : message.includes('link_not_found')
            ? t('shareLink.missing')
            : authErrorMessage(err, 'shareLink.joinError', t),
      )
      turnstileRef.current?.reset()
      setJoining(false)
    }
  }

  const date = (iso: string) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(iso))

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div className="absolute right-6 top-6 flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-5 motion-safe:animate-fade-up">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <PackagePlus size={22} className="text-accent-ink" /> WooLoader
        </div>

        {linkState.status === 'loading' || session === 'loading' ? (
          <p className="text-muted">{t('common.loading')}</p>
        ) : linkState.status !== 'ok' ? (
          <p className="text-muted">{linkState.status === 'missing' ? t('shareLink.missing') : t('shareLink.loadError')}</p>
        ) : (
          <>
            <div>
              <p className="text-sm text-faint">{t('shareLink.invited')}</p>
              <h1 className="mt-1 break-words font-display text-3xl font-bold">{linkState.link.catalog_name}</h1>
              {linkState.link.label && (
                <p className="mt-1 text-muted">{t('shareLink.preparedFor', { label: linkState.link.label })}</p>
              )}
            </div>

            {linkState.link.status === 'open' ? (
              <ul className="space-y-1.5 rounded-md border border-line bg-surface p-4 text-sm text-muted">
                <li>• {t('shareLink.step1')}</li>
                <li>• {t('shareLink.step2')}</li>
                <li>• {t('shareLink.step3')}</li>
                <li className="pt-1 text-faint">
                  {t('shareLink.capacity', { max: linkState.link.max_products })}
                  {linkState.link.expires_at && <> {t('shareLink.until', { date: date(linkState.link.expires_at) })}</>}
                </li>
              </ul>
            ) : (
              <p className="rounded-md border border-line bg-elevated px-4 py-3 text-sm text-muted">
                {t(`shareLink.status.${linkState.link.status}`)}
              </p>
            )}

            {/* A closed link still lets an existing member in (read-only); a
                newcomer gets a clear error from the server instead. */}
            {(linkState.link.status === 'open' || hasSession) && (
              <>
                {!hasSession && CAPTCHA_ENABLED && (
                  <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />
                )}
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining || needsCaptcha}
                  className="w-full rounded-md bg-accent px-4 py-3 font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50"
                >
                  {joining ? '…' : hasSession ? t('shareLink.continue') : t('shareLink.start')}
                </button>
                {!hasSession && <p className="text-center text-xs text-faint">{t('shareLink.noAccount')}</p>}
              </>
            )}

            <p className="text-center text-xs text-faint">
              {t('login.acceptPrefix')}{' '}
              <Link to="/terminos" className="text-link hover:underline">
                {t('login.terms')}
              </Link>{' '}
              {t('login.acceptMiddle')}{' '}
              <Link to="/privacidad" className="text-link hover:underline">
                {t('login.privacy')}
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  )
}
