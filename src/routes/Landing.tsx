import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackagePlus, Upload, Table2, Layers } from 'lucide-react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { usePageTitle } from '@/hooks/usePageTitle'
import { DEMO_MODE } from '@/lib/config'

export default function Landing() {
  const { t } = useTranslation()
  usePageTitle(t('seo.home'))

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 motion-safe:animate-fade-up sm:py-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-bold">
          <PackagePlus size={22} className="text-accent-ink" /> WooLoader
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <h1 className="mt-10 font-display text-3xl font-bold leading-tight sm:text-5xl">
        {t('landing.headline')}
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">{t('landing.subtitle')}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/login"
          className="rounded-md bg-accent px-5 py-3 font-semibold text-on-accent hover:opacity-90"
        >
          {DEMO_MODE ? t('landing.tryDemo') : t('landing.signIn')}
        </Link>
        <a
          href="https://github.com/JavDev10/wooloader"
          className="rounded-md border border-line px-5 py-3 font-medium text-fg hover:bg-elevated"
        >
          {t('landing.viewOnGithub')}
        </a>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <Feature icon={<Layers size={20} />} title={t('landing.feature1Title')}>
          {t('landing.feature1Body')}
        </Feature>
        <Feature icon={<Upload size={20} />} title={t('landing.feature2Title')}>
          {t('landing.feature2Body')}
        </Feature>
        <Feature icon={<Table2 size={20} />} title={t('landing.feature3Title')}>
          {t('landing.feature3Body')}
        </Feature>
      </div>

      <footer className="mt-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-sm text-faint">
        <span>© {new Date().getFullYear()} WooLoader</span>
        <Link to="/terminos" className="hover:text-fg">
          {t('landing.terms')}
        </Link>
        <Link to="/privacidad" className="hover:text-fg">
          {t('landing.privacy')}
        </Link>
        <a href="https://github.com/JavDev10/wooloader" className="hover:text-fg">
          GitHub
        </a>
      </footer>
    </div>
  )
}

function Feature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line p-5">
      <div className="text-accent-ink">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-faint">{children}</p>
    </div>
  )
}
