import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getSession, signIn, signInAnonymously, signUp } from '@/lib/api/auth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Turnstile, type TurnstileHandle } from '@/components/ui/Turnstile'
import { CAPTCHA_ENABLED, DEMO_MODE } from '@/lib/config'

const inputCls = 'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-link'

export default function Login() {
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
      setError(mode === 'signup' ? 'No se pudo crear la cuenta.' : 'Email o contraseña incorrectos.')
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
      setError('No se pudo iniciar la demo.')
      resetCaptcha()
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      {DEMO_MODE ? (
        // Demo instance: anonymous entry only. Email sign-in/up is deliberately
        // absent — email signups are disabled server-side on the demo, and demo
        // visitors shouldn't create real accounts.
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="font-display text-2xl font-bold text-accent-ink">WooLoader</h1>
          <p className="text-muted">
            Probá WooLoader sin registrarte. Es una demo: los datos son temporales y se borran
            automáticamente.
          </p>
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
            {loading ? '…' : 'Probar la demo'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-2xl font-bold text-accent-ink">WooLoader</h1>
          <p className="text-muted">
            {mode === 'signup' ? 'Creá tu cuenta para empezar.' : 'Ingresá para gestionar tus catálogos.'}
          </p>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-muted">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-muted">Contraseña</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </div>

          {CAPTCHA_ENABLED && <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || needsCaptcha}
            className="w-full rounded-md bg-accent px-4 py-2 font-semibold text-on-accent transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '…' : mode === 'signup' ? 'Crear cuenta' : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
            className="w-full text-center text-sm text-faint hover:text-fg"
          >
            {mode === 'signup' ? '¿Ya tenés cuenta? Ingresá' : '¿No tenés cuenta? Registrate'}
          </button>
        </form>
      )}
    </div>
  )
}
