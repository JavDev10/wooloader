import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getTheme, toggleTheme } from '@/lib/theme'

/** Light/dark toggle button. Reflects and flips the theme set on <html data-theme>. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState(getTheme())

  return (
    <button
      type="button"
      onClick={() => setThemeState(toggleTheme())}
      className={`text-faint hover:text-fg ${className}`}
      aria-label={theme === 'dark' ? t('theme.toLight') : t('theme.toDark')}
      title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
