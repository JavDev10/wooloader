import { describe, expect, it } from 'vitest'
import { cleanupAnonymousUsers, listAllFiles, secretsMatch, type CleanupClient } from './cleanup.ts'

/** In-memory fake: `files` are full paths; folders are derived from them. */
function fakeClient(opts: { users: string[]; files: string[]; failRemoveFor?: string }) {
  const files = new Set(opts.files)
  const deletedUsers: string[] = []
  const removeCalls: string[][] = []

  const client: CleanupClient = {
    listExpiredUsers: async (_ttl, max) => opts.users.slice(0, max),
    listFolder: async (prefix, offset, limit) => {
      const children = new Map<string, boolean>()
      for (const path of files) {
        if (!path.startsWith(`${prefix}/`)) continue
        const rest = path.slice(prefix.length + 1).split('/')
        children.set(rest[0], rest.length > 1)
      }
      return [...children]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(offset, offset + limit)
        .map(([name, isFolder]) => ({ name, isFolder }))
    },
    removeFiles: async (paths) => {
      if (opts.failRemoveFor && paths.some((p) => p.startsWith(`${opts.failRemoveFor}/`))) {
        throw new Error('storage unavailable')
      }
      removeCalls.push(paths)
      for (const p of paths) files.delete(p)
    },
    deleteUser: async (id) => {
      deletedUsers.push(id)
    },
  }
  return { client, files, deletedUsers, removeCalls }
}

describe('listAllFiles', () => {
  it('walks nested folders', async () => {
    const { client } = fakeClient({
      users: [],
      files: ['u1/cat1/p1/a.webp', 'u1/cat1/p1/b.webp', 'u1/cat2/p9/c.webp', 'u2/cat/p/x.webp'],
    })
    expect((await listAllFiles(client, 'u1')).sort()).toEqual([
      'u1/cat1/p1/a.webp',
      'u1/cat1/p1/b.webp',
      'u1/cat2/p9/c.webp',
    ])
  })

  it('follows pagination past one page', async () => {
    const many = Array.from({ length: 250 }, (_, i) => `u1/cat/p/${String(i).padStart(3, '0')}.webp`)
    const { client } = fakeClient({ users: [], files: many })
    expect(await listAllFiles(client, 'u1')).toHaveLength(250)
  })
})

describe('cleanupAnonymousUsers', () => {
  it("removes each user's files, then the user, and leaves other users' files alone", async () => {
    const { client, files, deletedUsers } = fakeClient({
      users: ['u1', 'u2'],
      files: ['u1/c/p/a.webp', 'u2/c/p/b.webp', 'keep/c/p/z.webp'],
    })
    const result = await cleanupAnonymousUsers(client, { ttlHours: 24, maxUsers: 25 })
    expect(result).toEqual({ deletedUsers: 2, removedFiles: 2, failed: [] })
    expect(deletedUsers).toEqual(['u1', 'u2'])
    expect([...files]).toEqual(['keep/c/p/z.webp'])
  })

  it('deletes a user with no uploads without calling remove', async () => {
    const { client, deletedUsers, removeCalls } = fakeClient({ users: ['u1'], files: [] })
    await cleanupAnonymousUsers(client, { ttlHours: 24, maxUsers: 25 })
    expect(deletedUsers).toEqual(['u1'])
    expect(removeCalls).toEqual([])
  })

  it('keeps the user when its files fail to delete, and continues with the rest', async () => {
    const { client, deletedUsers } = fakeClient({
      users: ['u1', 'u2'],
      files: ['u1/c/p/a.webp', 'u2/c/p/b.webp'],
      failRemoveFor: 'u1',
    })
    const result = await cleanupAnonymousUsers(client, { ttlHours: 24, maxUsers: 25 })
    expect(deletedUsers).toEqual(['u2'])
    expect(result.failed).toEqual([{ userId: 'u1', error: 'storage unavailable' }])
  })

  it('stops when the time budget runs out', async () => {
    const { client, deletedUsers } = fakeClient({ users: ['u1', 'u2', 'u3'], files: [] })
    let calls = 0
    await cleanupAnonymousUsers(client, { ttlHours: 24, maxUsers: 25, shouldContinue: () => ++calls <= 2 })
    expect(deletedUsers).toEqual(['u1', 'u2'])
  })
})

describe('secretsMatch', () => {
  it('accepts only the exact secret', () => {
    expect(secretsMatch('s3cret', 's3cret')).toBe(true)
    expect(secretsMatch('s3creT', 's3cret')).toBe(false)
    expect(secretsMatch('s3cret!', 's3cret')).toBe(false)
    expect(secretsMatch(null, 's3cret')).toBe(false)
  })

  it('rejects everything when no secret is configured', () => {
    expect(secretsMatch('', '')).toBe(false)
  })
})
