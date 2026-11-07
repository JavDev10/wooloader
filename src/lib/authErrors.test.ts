import { describe, expect, it } from 'vitest'
import { AuthApiError } from '@supabase/supabase-js'
import { authErrorMessage } from '@/lib/authErrors'

const t = (key: string) => `<${key}>`

describe('authErrorMessage', () => {
  it('maps a known Supabase code to its own message', () => {
    const error = new AuthApiError('Anonymous sign-ins are disabled', 422, 'anonymous_provider_disabled')
    expect(authErrorMessage(error, 'login.demoError', t)).toBe('<authErrors.guestDisabled>')
  })

  it('maps CAPTCHA failures', () => {
    const error = new AuthApiError('captcha protection: request disallowed', 400, 'captcha_failed')
    expect(authErrorMessage(error, 'login.demoError', t)).toBe('<authErrors.captcha>')
  })

  it('falls back with the raw code for unknown codes', () => {
    const error = new AuthApiError('boom', 500, 'unexpected_failure')
    expect(authErrorMessage(error, 'login.demoError', t)).toBe('<login.demoError> (unexpected_failure)')
  })

  it('falls back without a code for non-Supabase errors', () => {
    expect(authErrorMessage(new TypeError('Failed to fetch'), 'login.demoError', t)).toBe('<login.demoError>')
  })
})
