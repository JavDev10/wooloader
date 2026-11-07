/**
 * Turns a Supabase Auth error into the i18n key of a message that says what
 * actually went wrong, instead of one generic "couldn't sign in". Supabase
 * tags its errors with a stable `code` (see @supabase/auth-js ErrorCode).
 */
const MESSAGE_BY_CODE: Record<string, string> = {
  anonymous_provider_disabled: 'authErrors.guestDisabled',
  captcha_failed: 'authErrors.captcha',
  over_request_rate_limit: 'authErrors.rateLimit',
  over_email_send_rate_limit: 'authErrors.rateLimit',
  invalid_credentials: 'authErrors.invalidCredentials',
  email_not_confirmed: 'authErrors.emailNotConfirmed',
  user_already_exists: 'authErrors.userExists',
  email_exists: 'authErrors.userExists',
  weak_password: 'authErrors.weakPassword',
  signup_disabled: 'authErrors.signupDisabled',
  email_provider_disabled: 'authErrors.signupDisabled',
}

export function authErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code
  }
  return null
}

/**
 * The message to show for `error`: a specific one for known codes; otherwise
 * `fallback` plus the raw code in parentheses, so a user report still says
 * what Supabase answered.
 */
export function authErrorMessage(error: unknown, fallback: string, t: (key: string) => string): string {
  const code = authErrorCode(error)
  if (code && MESSAGE_BY_CODE[code]) return t(MESSAGE_BY_CODE[code])
  return code ? `${t(fallback)} (${code})` : t(fallback)
}
