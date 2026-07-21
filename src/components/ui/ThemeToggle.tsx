import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getTheme, toggleTheme } from '@/lib/theme'

/** Light/dark toggle button. Reflects and flips the theme set on <html data-theme>. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setThemeState] = useState(getTheme())

  return (
    <button
      type="button"
      onClick={() => setThemeState(toggleTheme())}
      className={`text-faint hover:text-fg ${className}`}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
