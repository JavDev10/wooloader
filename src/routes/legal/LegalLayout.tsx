import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

/** Shared shell for the legal pages: back link, title, prose styling. */
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  const { t, i18n } = useTranslation()
  // The legal documents themselves are Spanish-only (the binding version); when
  // the UI is in another language, say so instead of half-translating them.
  const notice = (i18n.resolvedLanguage ?? 'es').startsWith('es') ? '' : t('legal.spanishOnly')

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 text-sm text-faint hover:text-fg">
          <ArrowLeft size={16} /> {t('legal.backHome')}
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <h1 className="mt-8 font-display text-3xl font-bold">{title}</h1>
      {notice && <p className="mt-2 rounded-md bg-elevated px-3 py-2 text-sm text-muted">{notice}</p>}

      <div
        className={
          'mt-8 space-y-4 text-[15px] leading-relaxed text-muted ' +
          '[&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-fg ' +
          '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_strong]:font-semibold [&_strong]:text-fg ' +
          '[&_a]:text-link [&_a]:underline'
        }
      >
        {children}
      </div>
    </div>
  )
}
