import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useLoadedProducts } from '@/hooks/useLoadedProducts'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import { useEditorStore } from '@/store/editorStore'
import { renameCatalog, setCatalogCurrency } from '@/lib/api/catalogs'
import { CURRENCIES, currencyName, DEFAULT_CURRENCY } from '@/lib/currency'
import { deleteProduct } from '@/lib/api/products'
import { buildCsv, downloadCsv } from '@/lib/csv/buildCsv'
import { inputClass } from '@/components/ui/Field'
import { useLimits } from '@/context/LimitsContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { ClientLinkBanner } from '@/routes/app/ClientLinkBanner'
import { ShareLinksPanel } from '@/routes/app/ShareLinksPanel'
import type { AppContext } from '@/routes/app/RequireAuth'
import type { WeightUnit } from '@/lib/types'

export default function CatalogDetail() {
  const { t, i18n } = useTranslation()
  const { catalogId } = useParams<{ catalogId: string }>()
  const { userId } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const loading = useLoadedProducts(catalogId!)
  const { access, reload: reloadAccess } = useCatalogAccess(catalogId!, userId)
  const { enabled, maxProducts, productCount, atProductLimit, bumpProducts } = useLimits()

  const products = useEditorStore((s) => s.products)
  const addProduct = useEditorStore((s) => s.addProduct)
  const updateProduct = useEditorStore((s) => s.updateProduct)
  const removeProductLocal = useEditorStore((s) => s.removeProductLocal)

  const [catalogName, setCatalogName] = useState('')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)
  // The listed currencies, plus the catalog's own if it isn't one of them.
  const currencyOptions = CURRENCIES.some((c) => c.code === currency)
    ? CURRENCIES.map((c) => c.code)
    : [currency, ...CURRENCIES.map((c) => c.code)]
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const savedNameRef = useRef('')

  usePageTitle(catalogName ? `${catalogName} · WooLoader` : t('seo.catalogs'))

  const ready = access.status === 'ready' ? access : null
  const isOwner = ready?.role === 'owner'
  const link = ready?.link ?? null
  const editable = ready?.editable ?? false

  useEffect(() => {
    if (!ready) return
    setCatalogName(ready.catalog.name)
    setWeightUnit(ready.catalog.weight_unit)
    setCurrency(ready.catalog.currency)
    savedNameRef.current = ready.catalog.name
  }, [ready])

  // The owner is capped by their account quota; a client by their link.
  const atLimit = isOwner ? atProductLimit : link !== null && products.length >= link.max_products
  const canAdd = editable && !atLimit

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
    if (!canAdd) return
    const created = addProduct(catalogId!)
    if (isOwner) bumpProducts(1)
    navigate(`/app/catalog/${catalogId}/product/${created.id}`)
  }

  function handleDuplicate(productId: string) {
    if (!canAdd) return
    const source = products.find((p) => p.id === productId)
    if (!source) return
    const created = addProduct(catalogId!)
    if (isOwner) bumpProducts(1)
    updateProduct(created.id, {
      ...source,
      id: created.id,
      local_order: created.local_order,
      name: `${source.name} ${t('catalog.copySuffix')}`,
    })
    navigate(`/app/catalog/${catalogId}/product/${created.id}`)
  }

  async function handleDelete(productId: string) {
    if (!editable) return
    removeProductLocal(productId)
    if (isOwner) bumpProducts(-1)
    await deleteProduct(productId)
  }

  function handleCurrencyChange(code: string) {
    const previous = currency
    setCurrency(code)
    setCatalogCurrency(catalogId!, code).catch(() => {
      toast.error(t('catalog.currencyError'))
      setCurrency(previous)
    })
  }

  function handleExport() {
    const csv = buildCsv(products, { weightUnit, currency })
    const filename = `${(catalogName || 'catalogo').replace(/\s+/g, '-').toLowerCase()}-${t('catalog.exportFileSuffix')}.csv`
    downloadCsv(filename, csv)
  }

  if (loading || access.status === 'loading') {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">{t('common.loading')}</div>
  }

  if (access.status === 'error') {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-muted">{t('catalog.notFound')}</p>
      </div>
    )
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

      {isOwner && editingName ? (
        <input
          autoFocus
          className={`${inputClass} font-display text-2xl font-bold`}
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={handleNameKeyDown}
          placeholder={t('catalog.namePlaceholder')}
        />
      ) : isOwner ? (
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
      ) : (
        <h1 className="min-w-0 break-words font-display text-3xl font-bold">
          {catalogName || t('catalog.fallbackName')}
        </h1>
      )}

      <p className="mt-2 text-muted">
        {products.length === 0 ? t('catalog.empty') : t('catalog.productCount', { count: products.length })}
      </p>
      {isOwner && enabled && (
        <p className="mt-1 text-sm text-faint">
          {t('catalog.usage', { count: productCount, max: maxProducts })}
        </p>
      )}

      {!isOwner && (
        <ClientLinkBanner
          catalogId={catalogId!}
          link={link}
          productCount={products.length}
          onSubmitted={reloadAccess}
        />
      )}

      {isOwner ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="catalog-currency" className="text-muted">
              {t('catalog.currencyLabel')}
            </label>
            <select
              id="catalog-currency"
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="rounded-md border border-line bg-surface px-2 py-1 outline-none focus:border-link"
            >
              {currencyOptions.map((code) => (
                <option key={code} value={code}>
                  {code} — {currencyName(code, i18n.language)}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-faint">{t('catalog.currencyHint')}</p>
        </>
      ) : (
        <p className="mt-4 text-sm text-faint">
          {t('catalog.currencyFixed', { currency: `${currency} — ${currencyName(currency, i18n.language)}` })}
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
              disabled={!editable}
              className="min-w-0 flex-1 text-left disabled:cursor-default"
            >
              <span className="break-words font-medium">{product.name || t('catalog.unnamedProduct')}</span>
              {product.category && <span className="ml-2 text-sm text-faint">{product.category}</span>}
            </button>
            {editable && (
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
            )}
          </div>
        ))}
      </div>

      {editable && (
        <button
          type="button"
          onClick={handleAddProduct}
          disabled={atLimit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line px-4 py-3 text-muted hover:border-accent hover:text-accent-ink disabled:opacity-40 disabled:hover:border-line disabled:hover:text-muted"
        >
          <Plus size={18} /> {t('catalog.addProduct')}
        </button>
      )}

      {editable && atLimit && (
        <p className="mt-2 text-center text-xs text-amber-400">
          {isOwner
            ? t('catalog.atLimit', { max: maxProducts })
            : t('clientLink.atLimit', { max: link?.max_products ?? 0 })}
        </p>
      )}

      {isOwner && (
        <>
          <button
            type="button"
            onClick={handleExport}
            disabled={products.length === 0}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-semibold text-on-accent hover:opacity-90 disabled:opacity-40"
          >
            <Download size={18} /> {t('catalog.exportCsv')}
          </button>

          <ShareLinksPanel catalogId={catalogId!} />
        </>
      )}
    </div>
  )
}
