import type { ReactNode } from 'react'

export const inputClass =
  'w-full rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-link disabled:opacity-40'

type FieldProps = {
  label: string
  htmlFor: string
  children: ReactNode
  hint?: string
  /** Shows a marker next to the label. Unused by default now, kept for optional per-field emphasis. */
  required?: boolean
}

export function Field({ label, htmlFor, children, hint, required }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm text-muted">
        {label}
        {required && (
          <span className="ml-0.5 text-accent-ink" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  )
}
