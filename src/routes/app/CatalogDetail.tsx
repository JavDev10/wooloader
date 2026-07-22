import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useLoadedProducts } from '@/hooks/useLoadedProducts'
import { useEditorStore } from '@/store/editorStore'
import { getCatalog, renameCatalog } from '@/lib/api/catalogs'
import { deleteProduct } from '@/lib/api/products'
import { buildCsv, downloadCsv } from '@/lib/csv/buildCsv'
import { inputClass } from '@/components/ui/Field'
import { useLimits } from '@/context/LimitsContext'

export default function CatalogDetail() {
  const { catalogId } = useParams<{ catalogId: string }>()
  const navigate = useNavigate()
  const loading = useLoadedProducts(catalogId!)
  const { enabled, maxProducts, productCount, atProductLimit, bumpProducts } = useLimits()

  const products = useEditorStore((s) => s.products)
  const addProduct = useEditorStore((s) => s.addProduct)
  const updateProduct = useEditorStore((s) => s.updateProduct)
  const removeProductLocal = useEditorStore((s) => s.removeProductLocal)

  const [catalogName, setCatalogName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const savedNameRef = useRef('')

  useEffect(() => {
    if (catalogId)
      getCatalog(catalogId)
        .then((c) => {
          setCatalogName(c.name)
          savedNameRef.current = c.name
        })
        .catch(() => {})
  }, [catalogId])

  const atLimit = atProductLimit

  async function saveName() {
    const trimmed = nameDraft.trim()
    setEditingName(false)
    if (!trimmed || trimmed === savedNameRef.current) {
      setCatalogName(savedNameRef.current)
      return
    }
    setCatalogName(trimmed)
    try {
      await renameCatalog(catalogId!, trimmed)
      savedNameRef.current = trimmed
    } catch {
      toast.error('No se pudo renombrar el catálogo.')
      setCatalogName(savedNameRef.current)
    }
  }

  function handleNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') setEditingName(false)
  }

  function handleAddProduct() {
    if (atLimit) return
    const created = addProduct(catalogId!)
    bumpProducts(1)
    navigate(`/app/catalog/${catalogId}/product/${created.id}`)
  }

  function handleDuplicate(productId: string) {
    if (atLimit) return
    const source = products.find((p) => p.id === productId)
    if (!source) return
    const created = addProduct(catalogId!)
    bumpProducts(1)
    updateProduct(created.id, {
      ...source,
      id: created.id,
      local_order: created.local_order,
      name: `${source.name} (copia)`,
    })
    navigate(`/app/catalog/${catalogId}/product/${created.id}`)
  }

  async function handleDelete(productId: string) {
    removeProductLocal(productId)
    bumpProducts(-1)
    await deleteProduct(productId)
  }

  function handleExport() {
    const csv = buildCsv(products)
    const filename = `${(catalogName || 'catalogo').replace(/\s+/g, '-').toLowerCase()}-productos.csv`
    downloadCsv(filename, csv)
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">Cargando…</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="mb-4 flex items-center gap-1 text-sm text-faint hover:text-fg"
      >
        <ArrowLeft size={16} /> Todos los catálogos
      </button>

      {editingName ? (
        <input
          autoFocus
          className={`${inputClass} font-display text-2xl font-bold`}
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={handleNameKeyDown}
          placeholder="Nombre del catálogo"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setNameDraft(catalogName)
            setEditingName(true)
          }}
          className="group flex items-center gap-2 text-left"
        >
          <h1 className="font-display text-3xl font-bold">{catalogName || 'Catálogo'}</h1>
          <Pencil size={16} className="text-faint group-hover:text-muted" />
        </button>
      )}

      <p className="mt-2 text-muted">
        {products.length === 0
          ? 'Todavía no cargaste ningún producto.'
          : `${products.length} producto${products.length === 1 ? '' : 's'}.`}
      </p>
      {enabled && (
        <p className="mt-1 text-sm text-faint">
          {productCount} de {maxProducts} productos usados en tu cuenta (sumando todos tus catálogos).
        </p>
      )}

      <div className="mt-8 space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3"
          >
            <button
              type="button"
              onClick={() => navigate(`/app/catalog/${catalogId}/product/${product.id}`)}
              className="flex-1 text-left"
            >
              <span className="font-medium">{product.name || 'Producto sin nombre'}</span>
              {product.category && <span className="ml-2 text-sm text-faint">{product.category}</span>}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDuplicate(product.id)}
                disabled={atLimit}
                className="text-faint hover:text-link disabled:opacity-30 disabled:hover:text-faint"
                aria-label="Duplicar producto"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                className="text-faint hover:text-red-400"
                aria-label="Eliminar producto"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddProduct}
        disabled={atLimit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line px-4 py-3 text-muted hover:border-accent hover:text-accent-ink disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted"
      >
        <Plus size={18} /> Agregar producto
      </button>

      {atLimit && (
        <p className="mt-2 text-center text-xs text-amber-400">
          Alcanzaste el máximo de {maxProducts} productos de tu cuenta. Borrá alguno para agregar otro.
        </p>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={products.length === 0}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-semibold text-on-accent hover:opacity-90 disabled:opacity-40"
      >
        <Download size={18} /> Exportar CSV para WooCommerce
      </button>
    </div>
  )
}
