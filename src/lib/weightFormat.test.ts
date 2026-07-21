import { describe, expect, it } from 'vitest'
import { clampWeight, formatWeightDisplay, MIN_WEIGHT_KG, parseWeightInput } from '@/lib/weightFormat'

describe('parseWeightInput', () => {
  it('parses a comma decimal', () => {
    expect(parseWeightInput('14,4')).toBe(14.4)
    expect(parseWeightInput('1,5')).toBe(1.5)
  })

  it('still accepts a period decimal', () => {
    expect(parseWeightInput('14.4')).toBe(14.4)
  })

  it('returns null for an empty string', () => {
    expect(parseWeightInput('')).toBeNull()
  })

  it('returns null for just a separator', () => {
    expect(parseWeightInput(',')).toBeNull()
  })
})

describe('clampWeight', () => {
  it('leaves values at or above the minimum untouched', () => {
    expect(clampWeight(14.4)).toBe(14.4)
    expect(clampWeight(MIN_WEIGHT_KG)).toBe(MIN_WEIGHT_KG)
  })

  it('raises values below the minimum up to it', () => {
    expect(clampWeight(0.1)).toBe(MIN_WEIGHT_KG)
  })

  it('passes null through', () => {
    expect(clampWeight(null)).toBeNull()
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
