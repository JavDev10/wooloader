import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageTitle } from '@/hooks/usePageTitle'

export default function NotFound() {
  const { t } = useTranslation()
  usePageTitle(t('seo.notFound'))
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-accent-ink">404</h1>
      <p className="text-muted">{t('notFound.body')}</p>
      <Link to="/" className="mt-2 text-sm text-link hover:underline">
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}
