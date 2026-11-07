import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSession, signIn, signInAnonymously, signInWithGoogle, signUp } from '@/lib/api/auth'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Turnstile, type TurnstileHandle } from '@/components/ui/Turnstile'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'
import { usePageTitle } from '@/hooks/usePageTitle'
import { CAPTCHA_ENABLED, DEMO_MODE, GOOGLE_AUTH_ENABLED, GUEST_TTL_HOURS } from '@/lib/config'

const inputCls = 'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-link'

export default function Login() {
  const { t } = useTranslation()
  usePageTitle(t('seo.login'))
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [alreadySignedIn, setAlreadySignedIn] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileHandle>(null)

  useEffect(() => {
    getSession().then((session) => setAlreadySignedIn(session !== null))
  }, [])

  if (alreadySignedIn) {
    return <Navigate to="/app" replace />
  }

  // With CAPTCHA on, actions stay disabled until the widget yields a token.
  const needsCaptcha = CAPTCHA_ENABLED && !captchaToken

  // A Turnstile token is single-use: after a failed attempt, refresh the widget
  // so the next try gets a fresh one.
  function resetCaptcha() {
    turnstileRef.current?.reset()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, captchaToken ?? undefined)
      } else {
        await signIn(email, password, captchaToken ?? undefined)
      }
      navigate('/app', { replace: true })
    } catch {
      setError(mode === 'signup' ? t('login.signupError') : t('login.signinError'))
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      // Redirects away to Google; on success the browser lands on /auth/callback.
      await signInWithGoogle()
    } catch {
      setError(t('login.googleError'))
      setLoading(false)
    }
  }

  async function handleDemo() {
    setError(null)
    setLoading(true)
    try {
      await signInAnonymously(captchaToken ?? undefined)
      navigate('/app', { replace: true })
    } catch {
      setError(t('login.demoError'))
      resetCaptcha()
      setLoading(false)
    }
  }

  const acceptanceLine = (
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
  )

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="absolute right-6 top-6 flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 motion-safe:animate-fade-up">
        <h1 className="font-display text-2xl font-bold text-accent-ink">WooLoader</h1>
        <p className="text-muted">{mode === 'signup' ? t('login.signupSubtitle') : t('login.signinSubtitle')}</p>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-muted">{t('login.email')}</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-muted">{t('login.password')}</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </div>

        {CAPTCHA_ENABLED && <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || needsCaptcha}
          className="w-full rounded-md bg-accent px-4 py-2 font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '…' : mode === 'signup' ? t('login.signupButton') : t('login.signinButton')}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className="w-full text-center text-sm text-faint hover:text-fg"
        >
          {mode === 'signup' ? t('login.toSignin') : t('login.toSignup')}
        </button>

        {GOOGLE_AUTH_ENABLED && (
          <>
            <div className="flex items-center gap-3 text-xs text-faint">
              <span className="h-px flex-1 bg-line" /> {t('login.or')} <span className="h-px flex-1 bg-line" />
            </div>
            <GoogleSignInButton onClick={handleGoogle} disabled={loading} />
          </>
        )}

        {DEMO_MODE && (
          // Guest entry for people who want to look around before signing
          // up. Shares the CAPTCHA token with the email form — only one of
          // the two actions consumes it.
          <div className="space-y-2 rounded-md border border-dashed border-line p-3 text-center">
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading || needsCaptcha}
              className="w-full rounded-md border border-line px-4 py-2 font-medium transition hover:bg-elevated disabled:opacity-50"
            >
              {t('login.tryDemo')}
            </button>
            <p className="text-xs text-faint">{t('login.guestNote', { hours: GUEST_TTL_HOURS })}</p>
          </div>
        )}

        {acceptanceLine}
      </form>
    </div>
  )
}
