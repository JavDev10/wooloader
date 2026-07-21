import { supabase } from '@/lib/supabaseClient'
import type { Session } from '@supabase/supabase-js'

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

/**
 * Self-host onboarding: create the owner account. On a personal instance this
 * is fine to leave enabled. If you host a PUBLIC instance, disable email
 * sign-ups in the Supabase dashboard (Authentication → Providers → Email)
 * after creating your account, or create it from the dashboard instead.
 */
export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

/** Demo mode: visitors get a real (but anonymous) auth.uid(), so the same RLS isolates them. Requires "Allow anonymous sign-ins" enabled in the Supabase dashboard. */
export async function signInAnonymously(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

/** Lets a signed-in user set a display name (stored in Supabase Auth user_metadata). */
export async function updateDisplayName(fullName: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
  if (error) throw error
}
