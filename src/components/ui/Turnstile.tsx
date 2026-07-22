import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '@/lib/config'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// Load the Turnstile script once, shared across mounts.
let scriptPromise: Promise<void> | null = null
function loadTurnstile(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar Turnstile.'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export type TurnstileHandle = { reset: () => void }

/**
 * Cloudflare Turnstile widget. Calls `onToken` with a verification token once
 * solved (and with null when it expires/errors). Expose `reset()` via ref to
 * get a fresh token after a failed sign-in attempt (tokens are single-use).
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string | null) => void }>(
  function Turnstile({ onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    // Keep the latest callback without re-rendering the widget on every parent render.
    const onTokenRef = useRef(onToken)
    onTokenRef.current = onToken

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
          onTokenRef.current(null)
        }
      },
    }))

    useEffect(() => {
      let cancelled = false
      loadTurnstile()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => onTokenRef.current(token),
            'expired-callback': () => onTokenRef.current(null),
            'error-callback': () => onTokenRef.current(null),
          })
        })
        .catch(() => onTokenRef.current(null))
      return () => {
        cancelled = true
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            /* widget already gone */
          }
        }
      }
    }, [])

    return <div ref={containerRef} className="min-h-[65px]" />
  },
)
