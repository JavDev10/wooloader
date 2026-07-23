import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSession, signIn, signInAnonymously, signUp } from '@/lib/api/auth'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Turnstile, type TurnstileHandle } from '@/components/ui/Turnstile'
import { CAPTCHA_ENABLED, DEMO_MODE } from '@/lib/config'

const inputCls = 'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-link'

export default function Login() {
  const { t } = useTranslation()
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

      {DEMO_MODE ? (
        // Demo instance: anonymous entry only. Email sign-in/up is deliberately
        // absent — email signups are disabled server-side on the demo, and demo
        // visitors shouldn't create real accounts.
        <div className="w-full max-w-sm space-y-4 text-center motion-safe:animate-fade-up">
          <h1 className="font-display text-2xl font-bold text-accent-ink">WooLoader</h1>
          <p className="text-muted">{t('login.demoIntro')}</p>
          {CAPTCHA_ENABLED && (
            <div className="flex justify-center">
              <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />
            </div>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleDemo}
            disabled={loading || needsCaptcha}
            className="w-full rounded-md bg-accent px-4 py-2 font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '…' : t('login.tryDemo')}
          </button>
          {acceptanceLine}
        </div>
      ) : (
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

          {acceptanceLine}
        </form>
      )}
    </div>
  )
}
