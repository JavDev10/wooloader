import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getSession, signIn, signInAnonymously, signUp } from '@/lib/api/auth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DEMO_MODE } from '@/lib/config'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [alreadySignedIn, setAlreadySignedIn] = useState(false)

  useEffect(() => {
    getSession().then((session) => setAlreadySignedIn(session !== null))
  }, [])

  if (alreadySignedIn) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      navigate('/app', { replace: true })
    } catch {
      setError(mode === 'signup' ? 'No se pudo crear la cuenta.' : 'Email o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemo() {
    setError(null)
    setLoading(true)
    try {
      await signInAnonymously()
      navigate('/app', { replace: true })
    } catch {
      setError('No se pudo iniciar la demo.')
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-link'

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl font-bold text-accent-ink">WooLoader</h1>
        <p className="text-muted">
          {mode === 'signup' ? 'Creá tu cuenta para empezar.' : 'Ingresá para gestionar tus catálogos.'}
        </p>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-muted">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-muted">Contraseña</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
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

        {DEMO_MODE && (
          <>
            <div className="flex items-center gap-3 text-xs text-faint">
              <span className="h-px flex-1 bg-line" /> o <span className="h-px flex-1 bg-line" />
            </div>
            <button
              type="button"
              onClick={handleDemo}
              disabled={loading}
              className="w-full rounded-md border border-line px-4 py-2 text-sm hover:bg-elevated disabled:opacity-50"
            >
              Probar la demo sin registrarme
            </button>
          </>
        )}
      </form>
    </div>
  )
}
