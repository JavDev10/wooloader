import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { getSession, isShareLinkGuest, onAuthStateChange } from '@/lib/api/auth'
import { AppHeader } from '@/routes/app/AppHeader'
import { AdSlot } from '@/components/ui/AdSlot'
import { LimitsProvider } from '@/context/LimitsContext'
import { GUEST_TTL_HOURS } from '@/lib/config'

export type AppContext = {
  session: Session
  /** Convenience: the signed-in user's id (also the first segment of image storage paths). */
  userId: string
}

export default function RequireAuth() {
  const { t } = useTranslation()
  const [session, setSession] = useState<Session | null | 'loading'>('loading')

  useEffect(() => {
    getSession().then(setSession)
    return onAuthStateChange(setSession)
  }, [])

  if (session === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        {t('common.loading')}
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen">
      <AppHeader session={session} />
      {/* Demo guests lose everything after the TTL; a link client doesn't (the
          products belong to the developer's catalog), so no warning for them. */}
      {session.user.is_anonymous && !isShareLinkGuest(session) && (
        <p className="border-b border-line bg-amber-400/10 px-4 py-2 text-center text-sm text-muted sm:px-6">
          {t('app.guestBanner', { hours: GUEST_TTL_HOURS })}
        </p>
      )}
      <LimitsProvider userId={session.user.id}>
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
