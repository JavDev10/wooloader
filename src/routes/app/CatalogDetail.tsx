import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useLoadedProducts } from '@/hooks/useLoadedProducts'
import { useEditorStore } from '@/store/editorStore'
import { getCatalog, renameCatalog } from '@/lib/api/catalogs'
import { deleteProduct } from '@/lib/api/products'
import { buildCsv, downloadCsv } from '@/lib/csv/buildCsv'
import { inputClass } from '@/components/ui/Field'
import { useLimits } from '@/context/LimitsContext'
import type { WeightUnit } from '@/lib/types'

export default function CatalogDetail() {
  const { t } = useTranslation()
  const { catalogId } = useParams<{ catalogId: string }>()
  const navigate = useNavigate()
  const loading = useLoadedProducts(catalogId!)
  const { enabled, maxProducts, productCount, atProductLimit, bumpProducts } = useLimits()

  const products = useEditorStore((s) => s.products)
  const addProduct = useEditorStore((s) => s.addProduct)
  const updateProduct = useEditorStore((s) => s.updateProduct)
  const removeProductLocal = useEditorStore((s) => s.removeProductLocal)

  const [catalogName, setCatalogName] = useState('')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const savedNameRef = useRef('')

  useEffect(() => {
    if (catalogId)
      getCatalog(catalogId)
        .then((c) => {
          setCatalogName(c.name)
          setWeightUnit(c.weight_unit)
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
      toast.error(t('catalog.renameError'))
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
      name: `${source.name} ${t('catalog.copySuffix')}`,
    })
    navigate(`/app/catalog/${catalogId}/product/${created.id}`)
  }

  async function handleDelete(productId: string) {
    removeProductLocal(productId)
    bumpProducts(-1)
    await deleteProduct(productId)
  }

  function handleExport() {
    const csv = buildCsv(products, { weightUnit })
    const filename = `${(catalogName || 'catalogo').replace(/\s+/g, '-').toLowerCase()}-${t('catalog.exportFileSuffix')}.csv`
    downloadCsv(filename, csv)
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">{t('common.loading')}</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 motion-safe:animate-fade-up">
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="mb-4 flex items-center gap-1 text-sm text-faint hover:text-fg"
      >
        <ArrowLeft size={16} /> {t('catalog.backToList')}
      </button>

      {editingName ? (
        <input
          autoFocus
          className={`${inputClass} font-display text-2xl font-bold`}
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={handleNameKeyDown}
          placeholder={t('catalog.namePlaceholder')}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setNameDraft(catalogName)
            setEditingName(true)
          }}
          className="group flex w-full min-w-0 items-center gap-2 text-left"
        >
          <h1 className="min-w-0 break-words font-display text-3xl font-bold">
            {catalogName || t('catalog.fallbackName')}
          </h1>
          <Pencil size={16} className="shrink-0 text-faint group-hover:text-muted" />
        </button>
      )}

      <p className="mt-2 text-muted">
        {products.length === 0 ? t('catalog.empty') : t('catalog.productCount', { count: products.length })}
      </p>
      {enabled && (
        <p className="mt-1 text-sm text-faint">
          {t('catalog.usage', { count: productCount, max: maxProducts })}
        </p>
      )}

      <div className="mt-8 space-y-2">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 transition-colors hover:bg-elevated"
          >
            <button
              type="button"
              onClick={() => navigate(`/app/catalog/${catalogId}/product/${product.id}`)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="break-words font-medium">{product.name || t('catalog.unnamedProduct')}</span>
              {product.category && <span className="ml-2 text-sm text-faint">{product.category}</span>}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDuplicate(product.id)}
                disabled={atLimit}
                className="text-faint hover:text-link disabled:opacity-30 disabled:hover:text-faint"
                aria-label={t('catalog.duplicate')}
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                className="text-faint hover:text-red-400"
                aria-label={t('catalog.deleteProduct')}
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
        <Plus size={18} /> {t('catalog.addProduct')}
      </button>

      {atLimit && (
        <p className="mt-2 text-center text-xs text-amber-400">{t('catalog.atLimit', { max: maxProducts })}</p>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={products.length === 0}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-semibold text-on-accent hover:opacity-90 disabled:opacity-40"
      >
        <Download size={18} /> {t('catalog.exportCsv')}
      </button>
    </div>
  )
}
