import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LogOut, Pencil, PackagePlus } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import { signOut, updateDisplayName } from '@/lib/api/auth'
import { inputClass } from '@/components/ui/Field'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { DEMO_MODE } from '@/lib/config'

export function AppHeader({ session }: { session: Session }) {
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
      toast.success('Nombre actualizado.')
    } catch {
      toast.error('No se pudo actualizar el nombre.')
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
    <header className="flex items-center justify-between border-b border-line px-6 py-4">
      <Link to="/app" className="flex items-center gap-2 font-display text-lg font-bold">
        <PackagePlus size={20} className="text-accent-ink" />
        WooLoader
        {DEMO_MODE && <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-muted">DEMO</span>}
      </Link>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isAnon ? (
          <span className="text-sm text-faint">Sesión de prueba</span>
        ) : editing ? (
          <input
            autoFocus
            className={`${inputClass} w-40 py-1 text-sm`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={saving}
            placeholder="Tu nombre"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-sm text-muted hover:text-fg"
          >
            {currentName || session.user.email}
            <Pencil size={12} className="text-faint" />
          </button>
        )}

        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-1 text-sm text-faint hover:text-red-400"
        >
          <LogOut size={14} /> Salir
        </button>
      </div>
    </header>
  )
}
