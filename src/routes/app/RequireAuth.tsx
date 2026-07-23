import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange } from '@/lib/api/auth'
import { AppHeader } from '@/routes/app/AppHeader'
import { AdSlot } from '@/components/ui/AdSlot'
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
        {/* Side gutters host the ad slots on the hosted instance (≥ xl screens).
            With ads off the slots render nothing and this is just the content. */}
        <div className="mx-auto flex max-w-7xl justify-center gap-4 xl:px-4">
          <AdSlot position="left" />
          <main className="min-w-0 flex-1">
            <Outlet context={{ session, userId: session.user.id } satisfies AppContext} />
          </main>
          <AdSlot position="right" />
        </div>
      </LimitsProvider>
    </div>
  )
}
