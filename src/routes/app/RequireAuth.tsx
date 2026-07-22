import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from '@/lib/api/auth'
import { AppHeader } from '@/routes/app/AppHeader'
import { LimitsProvider } from '@/context/LimitsContext'

export type AppContext = {
  session: Session
  /** Convenience: the signed-in user's id (also the first segment of image storage paths). */
  userId: string
}

export default function RequireAuth() {
  const [session, setSession] = useState<Session | null | 'loading'>('loading')

  useEffect(() => {
    getSession().then(setSession)
    return onAuthStateChange(setSession)
  }, [])

  if (session === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Cargando…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      <AppHeader session={session} />
      <LimitsProvider>
        <Outlet context={{ session, userId: session.user.id } satisfies AppContext} />
      </LimitsProvider>
    </div>
  )
}
