import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { FolderPlus, Trash2 } from 'lucide-react'
import { createCatalog, deleteCatalogCompletely, listCatalogs } from '@/lib/api/catalogs'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { inputClass } from '@/components/ui/Field'
import { useLimits } from '@/context/LimitsContext'
import type { Catalog } from '@/lib/types'
import type { AppContext } from '@/routes/app/RequireAuth'

export default function CatalogList() {
  const { userId } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const { enabled, maxCatalogs, catalogCount, atCatalogLimit, bumpCatalogs } = useLimits()
  const [catalogs, setCatalogs] = useState<Catalog[] | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listCatalogs().then(setCatalogs).catch(() => setCatalogs([]))
  }, [])

  async function handleCreate() {
    if (atCatalogLimit) return
    const name = newName.trim() || 'Catálogo sin nombre'
    setCreating(true)
    try {
      const catalog = await createCatalog(name)
      bumpCatalogs(1)
      navigate(`/app/catalog/${catalog.id}`)
    } catch {
      toast.error('No se pudo crear el catálogo.')
      setCreating(false)
    }
  }

  async function handleDelete(catalog: Catalog) {
    try {
      await deleteCatalogCompletely(userId, catalog.id)
      setCatalogs((prev) => (prev ?? []).filter((c) => c.id !== catalog.id))
      bumpCatalogs(-1)
      toast.success(`Se borró "${catalog.name}".`)
    } catch {
      toast.error('No se pudo borrar el catálogo.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold">Tus catálogos</h1>
      <p className="mt-2 text-muted">
        Cada catálogo es un grupo de productos que exportás como un CSV para importar en WooCommerce.
      </p>
      {enabled && (
        <p className="mt-1 text-sm text-faint">
          {catalogCount} de {maxCatalogs} catálogos usados en tu cuenta.
        </p>
      )}

      <div className="mt-8 flex gap-2">
        <input
          className={inputClass}
          placeholder="Nombre del nuevo catálogo"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          disabled={atCatalogLimit}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || atCatalogLimit}
          className="flex items-center gap-1 whitespace-nowrap rounded-md bg-accent px-4 py-2 font-semibold text-on-accent hover:opacity-90 disabled:opacity-40"
        >
          <FolderPlus size={18} /> Crear
        </button>
      </div>
      {atCatalogLimit && (
        <p className="mt-2 text-xs text-amber-400">
          Alcanzaste el máximo de {maxCatalogs} catálogos de tu cuenta. Borrá uno para crear otro.
        </p>
      )}

      <div className="mt-8 space-y-2">
        {catalogs === null && <p className="text-faint">Cargando…</p>}
        {catalogs?.length === 0 && <p className="text-faint">Todavía no tenés catálogos. Creá el primero arriba.</p>}
        {catalogs?.map((catalog) => (
          <div
            key={catalog.id}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3"
          >
            <button
              type="button"
              onClick={() => navigate(`/app/catalog/${catalog.id}`)}
              className="flex-1 text-left font-medium"
            >
              {catalog.name}
            </button>
            <ConfirmButton
              onConfirm={() => handleDelete(catalog)}
              label=""
              confirmLabel="¿Borrar?"
              icon={<Trash2 size={16} />}
              className="text-faint hover:text-red-400"
              confirmClassName="text-xs font-medium text-red-400"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
