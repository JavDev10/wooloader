import { describe, expect, it } from 'vitest'
import es from '@/i18n/es'
import en from '@/i18n/en'
import pt from '@/i18n/pt'

function flatKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null ? flatKeys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  )
}

describe('translations', () => {
  it('es, en and pt define exactly the same keys', () => {
    const keys = flatKeys(es).sort()
    expect(flatKeys(en).sort()).toEqual(keys)
    expect(flatKeys(pt).sort()).toEqual(keys)
  })

  it('never leave a string empty', () => {
    // legal.spanishOnly is empty on purpose in Spanish: the "binding version is
    // the Spanish one" note only makes sense in the other languages.
    const intentionallyEmpty = new Set(['legal.spanishOnly'])
    for (const dict of [es, en, pt]) {
      const empty = flatKeys(dict).filter((k) => {
        if (intentionallyEmpty.has(k)) return false
        const value = k.split('.').reduce<unknown>((o, part) => (o as Record<string, unknown>)[part], dict)
        return typeof value === 'string' && value.trim() === ''
      })
      expect(empty).toEqual([])
    }
  })
})
