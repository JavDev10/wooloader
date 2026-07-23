import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

type LangCode = 'es' | 'en' | 'pt'

const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
]

/**
 * Inline SVG flags (not emoji — Windows renders flag emoji as plain letters).
 * Simplified drawings: Spain for es, USA for en, Brazil for pt (the translation
 * is pt-BR).
 */
function Flag({ code }: { code: LangCode }) {
  const common = { width: 20, height: 14, className: 'rounded-[2px] shrink-0', 'aria-hidden': true as const }
  if (code === 'es') {
    return (
      <svg viewBox="0 0 20 14" {...common}>
        <rect width="20" height="14" fill="#AA151B" />
        <rect y="3.5" width="20" height="7" fill="#F1BF00" />
      </svg>
    )
  }
  if (code === 'en') {
    return (
      <svg viewBox="0 0 20 14" {...common}>
        <rect width="20" height="14" fill="#B22234" />
        <g fill="#FFFFFF">
          <rect y="1.6" width="20" height="1.1" />
          <rect y="3.8" width="20" height="1.1" />
          <rect y="6" width="20" height="1.1" />
          <rect y="8.2" width="20" height="1.1" />
          <rect y="10.4" width="20" height="1.1" />
          <rect y="12.6" width="20" height="1.1" />
        </g>
        <rect width="8.5" height="7.1" fill="#3C3B6E" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 14" {...common}>
      <rect width="20" height="14" fill="#009C3B" />
      <path d="M10 1.8 18 7l-8 5.2L2 7z" fill="#FFDF00" />
      <circle cx="10" cy="7" r="2.6" fill="#002776" />
    </svg>
  )
}

/** Flag dropdown language selector. The choice persists in localStorage (see src/i18n). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const current = ((i18n.resolvedLanguage ?? 'es').slice(0, 2) as LangCode) || 'es'

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function choose(code: LangCode) {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1.5 text-xs text-muted hover:bg-elevated"
        aria-label={t('common.language')}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t('common.language')}
      >
        <Flag code={current} />
        <span className="font-medium uppercase">{current}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('common.language')}
          className="absolute right-0 top-full z-50 mt-1 w-36 origin-top-right overflow-hidden rounded-md border border-line bg-app shadow-lg motion-safe:animate-pop"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={lang.code === current}
              onClick={() => choose(lang.code)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-elevated ${
                lang.code === current ? 'bg-surface font-medium text-fg' : 'text-muted'
              }`}
            >
              <Flag code={lang.code} />
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
