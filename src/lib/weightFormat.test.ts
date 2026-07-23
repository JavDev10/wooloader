import { describe, expect, it } from 'vitest'
import { formatWeightDisplay, parseWeightInput } from '@/lib/weightFormat'

describe('parseWeightInput', () => {
  it('parses a comma decimal', () => {
    expect(parseWeightInput('14,4')).toBe(14.4)
    expect(parseWeightInput('1,5')).toBe(1.5)
  })

  it('still accepts a period decimal', () => {
    expect(parseWeightInput('14.4')).toBe(14.4)
  })

  it('accepts small values — there is no minimum weight', () => {
    expect(parseWeightInput('0,1')).toBe(0.1)
    expect(parseWeightInput('0.05')).toBe(0.05)
  })

  it('returns null for an empty string', () => {
    expect(parseWeightInput('')).toBeNull()
  })

  it('returns null for just a separator', () => {
    expect(parseWeightInput(',')).toBeNull()
  })
})

describe('formatWeightDisplay', () => {
  it('formats with a comma decimal separator', () => {
    expect(formatWeightDisplay(14.4)).toBe('14,4')
    expect(formatWeightDisplay(0.5)).toBe('0,5')
  })

  it('returns an empty string for null', () => {
    expect(formatWeightDisplay(null)).toBe('')
  })
})
