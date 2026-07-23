import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
] as const

/** Compact language selector. The choice persists in localStorage (see src/i18n). */
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = (i18n.resolvedLanguage ?? 'es').slice(0, 2)

  return (
    <select
      value={current}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-muted outline-none focus:border-link"
      aria-label={t('common.language')}
      title={t('common.language')}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}
