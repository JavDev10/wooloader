/**
 * Deletes guest (anonymous) users older than CLEANUP_TTL_HOURS (default 24),
 * along with their catalogs, products and uploaded images. Meant to run on a
 * schedule (pg_cron + pg_net, see supabase/hosted/schedule_anonymous_cleanup.sql)
 * on the hosted instance, where "Try without an account" creates guest users.
 *
 * Deploy with JWT verification off — the caller proves itself with the
 * x-cleanup-secret header instead, which must equal the CLEANUP_SECRET secret:
 *   supabase functions deploy cleanup-anonymous-users --no-verify-jwt
 *   supabase secrets set CLEANUP_SECRET=<long random string>
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform.
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cleanupAnonymousUsers, secretsMatch, type CleanupClient } from './cleanup.ts'

const BUCKET = 'product-images'
// Stop starting new users well before the platform's wall-clock limit.
const TIME_BUDGET_MS = 100_000

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (!secretsMatch(req.headers.get('x-cleanup-secret'), Deno.env.get('CLEANUP_SECRET') ?? '')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const client: CleanupClient = {
    async listExpiredUsers(ttlHours, maxUsers) {
      const { data, error } = await supabase.rpc('list_expired_anonymous_users', {
        ttl_hours: ttlHours,
        max_users: maxUsers,
      })
      if (error) throw error
      return (data ?? []) as string[]
    },
    async listFolder(prefix, offset, limit) {
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { offset, limit })
      if (error) throw error
      // Storage reports sub-folders as entries with a null id.
      return (data ?? []).map((entry) => ({ name: entry.name, isFolder: entry.id === null }))
    },
    async removeFiles(paths) {
      const { error } = await supabase.storage.from(BUCKET).remove(paths)
      if (error) throw error
    },
    async deleteUser(userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
    },
  }

  const startedAt = Date.now()
  const result = await cleanupAnonymousUsers(client, {
    ttlHours: Number(Deno.env.get('CLEANUP_TTL_HOURS') ?? 24),
    maxUsers: 25,
    shouldContinue: () => Date.now() - startedAt < TIME_BUDGET_MS,
  })

  console.log('cleanup-anonymous-users', JSON.stringify(result))
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
})
