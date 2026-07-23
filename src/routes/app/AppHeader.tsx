import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { LogOut, Pencil, PackagePlus } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { signOut, updateDisplayName } from '@/lib/api/auth'
import { inputClass } from '@/components/ui/Field'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DEMO_MODE } from '@/lib/config'

export function AppHeader({ session }: { session: Session }) {
  const { t } = useTranslation()
  const isAnon = session.user.is_anonymous ?? false
  const currentName = (session.user.user_metadata?.full_name as string | undefined) ?? ''
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await updateDisplayName(trimmed)
      setEditing(false)
      toast.success(t('header.nameUpdated'))
    } catch {
      toast.error(t('header.nameUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setName(currentName)
      setEditing(false)
    }
  }

  return (
    <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-4 sm:px-6">
      <Link to="/app" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold">
        <PackagePlus size={20} className="text-accent-ink" />
        WooLoader
        {DEMO_MODE && <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-muted">DEMO</span>}
      </Link>

      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <ThemeToggle />
        {/* The name/email editor is desktop-only — on a phone it doesn't fit and
            it's a rarely-used affordance. */}
        {isAnon ? (
          <span className="hidden text-sm text-faint sm:inline">{t('header.demoSession')}</span>
        ) : editing ? (
          <input
            autoFocus
            className={`${inputClass} hidden w-40 py-1 text-sm sm:block`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={saving}
            placeholder={t('header.yourName')}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="hidden min-w-0 items-center gap-1 text-sm text-muted hover:text-fg sm:flex"
          >
            <span className="max-w-[14rem] truncate">{currentName || session.user.email}</span>
            <Pencil size={12} className="shrink-0 text-faint" />
          </button>
        )}

        <button
          type="button"
          onClick={() => signOut()}
          className="flex shrink-0 items-center gap-1 text-sm text-faint hover:text-red-400"
        >
          <LogOut size={14} /> <span className="hidden sm:inline">{t('header.signOut')}</span>
        </button>
      </div>
    </header>
  )
}
