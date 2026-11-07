/**
 * Core of the cleanup-anonymous-users Edge Function, kept free of Deno and
 * Supabase imports so it can be unit-tested with Vitest (see cleanup.test.ts).
 * index.ts adapts a real Supabase client to `CleanupClient`.
 */

export type StorageEntry = { name: string; isFolder: boolean }

export type CleanupClient = {
  /** Guest user ids older than the TTL, oldest first (RPC from migration 0010). */
  listExpiredUsers: (ttlHours: number, maxUsers: number) => Promise<string[]>
  /** One page of a Storage "folder" listing. */
  listFolder: (prefix: string, offset: number, limit: number) => Promise<StorageEntry[]>
  /** Deletes files by full path (the Storage API accepts up to 1000 per call). */
  removeFiles: (paths: string[]) => Promise<void>
  /** Deletes the auth user; catalogs/products cascade in Postgres. */
  deleteUser: (userId: string) => Promise<void>
}

export type CleanupOptions = {
  ttlHours: number
  maxUsers: number
  /** Checked before each user; return false to stop early (e.g. near the function's time limit). */
  shouldContinue?: () => boolean
}

export type CleanupResult = {
  deletedUsers: number
  removedFiles: number
  failed: { userId: string; error: string }[]
}

const PAGE_SIZE = 100
const REMOVE_BATCH = 1000

/** Every file path under `prefix`, walking sub-folders (Storage lists one level at a time). */
export async function listAllFiles(client: CleanupClient, prefix: string): Promise<string[]> {
  const files: string[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await client.listFolder(prefix, offset, PAGE_SIZE)
    for (const entry of page) {
      const path = `${prefix}/${entry.name}`
      if (entry.isFolder) files.push(...(await listAllFiles(client, path)))
      else files.push(path)
    }
    if (page.length < PAGE_SIZE) return files
  }
}

/**
 * Deletes expired guest users: first their uploaded images (everything under
 * `{userId}/` in the bucket), then the user. If the files can't be removed the
 * user is kept, so the next run retries instead of orphaning files that would
 * keep counting against the Storage quota.
 */
export async function cleanupAnonymousUsers(client: CleanupClient, options: CleanupOptions): Promise<CleanupResult> {
  const result: CleanupResult = { deletedUsers: 0, removedFiles: 0, failed: [] }
  const userIds = await client.listExpiredUsers(options.ttlHours, options.maxUsers)

  for (const userId of userIds) {
    if (options.shouldContinue && !options.shouldContinue()) break
    try {
      const files = await listAllFiles(client, userId)
      for (let i = 0; i < files.length; i += REMOVE_BATCH) {
        await client.removeFiles(files.slice(i, i + REMOVE_BATCH))
      }
      await client.deleteUser(userId)
      result.deletedUsers += 1
      result.removedFiles += files.length
    } catch (error) {
      result.failed.push({ userId, error: error instanceof Error ? error.message : String(error) })
    }
  }

  return result
}

/** Compares two secrets without exiting early on the first differing character. */
export function secretsMatch(given: string | null, expected: string): boolean {
  if (given === null || expected === '' || given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}
