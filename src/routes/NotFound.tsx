import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-accent-ink">404</h1>
      <p className="text-muted">Esta página no existe.</p>
      <Link to="/" className="mt-2 text-sm text-link hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
