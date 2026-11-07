import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Sparkles, Trash2 } from 'lucide-react'
import { createCatalog, deleteCatalogCompletely, listCatalogs } from '@/lib/api/catalogs'
import { upsertProduct } from '@/lib/api/products'
import { guessCurrency } from '@/lib/currency'
import { buildSampleProducts, sampleCatalogName, SAMPLE_PRODUCT_COUNT } from '@/lib/sampleCatalog'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { inputClass } from '@/components/ui/Field'
import { useLimits } from '@/context/LimitsContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Catalog } from '@/lib/types'
import type { AppContext } from '@/routes/app/RequireAuth'

export default function CatalogList() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('seo.catalogs'))
  const { userId } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const { enabled, maxCatalogs, catalogCount, atCatalogLimit, bumpCatalogs, maxProducts, productCount, bumpProducts } =
    useLimits()
  const [catalogs, setCatalogs] = useState<Catalog[] | null>(null)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)

  useEffect(() => {
    listCatalogs().then(setCatalogs).catch(() => setCatalogs([]))
  }, [])

  async function handleCreate() {
    if (atCatalogLimit) return
    const name = newName.trim() || t('catalogs.unnamed')
    setCreating(true)
    try {
      const catalog = await createCatalog(name, guessCurrency())
      bumpCatalogs(1)
      navigate(`/app/catalog/${catalog.id}`)
    } catch {
      toast.error(t('catalogs.createError'))
      setCreating(false)
    }
  }

  // The sample adds one catalog and SAMPLE_PRODUCT_COUNT products, so it needs
  // room under both per-user limits (the DB triggers would reject it anyway).
  const canLoadSample = !atCatalogLimit && (!enabled || maxProducts - productCount >= SAMPLE_PRODUCT_COUNT)

  async function handleLoadSample() {
    if (!canLoadSample) return
    setLoadingSample(true)
    try {
      const currency = guessCurrency()
      const catalog = await createCatalog(sampleCatalogName(i18n.language), currency)
      bumpCatalogs(1)
      // Sequential so a limit hit stops cleanly instead of racing.
      for (const product of buildSampleProducts(catalog.id, i18n.language, currency)) {
        await upsertProduct(product)
        bumpProducts(1)
      }
      navigate(`/app/catalog/${catalog.id}`)
    } catch {
      toast.error(t('catalogs.sampleError'))
      setLoadingSample(false)
      listCatalogs().then(setCatalogs).catch(() => {})
    }
  }

  async function handleDelete(catalog: Catalog) {
    try {
      await deleteCatalogCompletely(userId, catalog.id)
      setCatalogs((prev) => (prev ?? []).filter((c) => c.id !== catalog.id))
      bumpCatalogs(-1)
      toast.success(t('catalogs.deleted', { name: catalog.name }))
    } catch {
      toast.error(t('catalogs.deleteError'))
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 motion-safe:animate-fade-up">
      <h1 className="font-display text-3xl font-bold">{t('catalogs.title')}</h1>
      <p className="mt-2 text-muted">{t('catalogs.subtitle')}</p>
      {enabled && (
        <p className="mt-1 text-sm text-faint">
          {t('catalogs.usage', { count: catalogCount, max: maxCatalogs })}
        </p>
      )}

      <div className="mt-8 flex gap-2">
        <input
          className={inputClass}
          placeholder={t('catalogs.newPlaceholder')}
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
          <FolderPlus size={18} /> {t('catalogs.create')}
        </button>
      </div>
      {atCatalogLimit && (
        <p className="mt-2 text-xs text-amber-400">{t('catalogs.atLimit', { max: maxCatalogs })}</p>
      )}

      <button
        type="button"
        onClick={handleLoadSample}
        disabled={loadingSample || !canLoadSample}
        className="mt-3 flex items-center gap-1.5 text-sm text-link hover:underline disabled:cursor-not-allowed disabled:text-faint disabled:no-underline"
      >
        <Sparkles size={14} /> {loadingSample ? t('catalogs.sampleLoading') : t('catalogs.loadSample')}
      </button>
      {!canLoadSample && !atCatalogLimit && (
        <p className="mt-1 text-xs text-faint">{t('catalogs.sampleNoRoom', { count: SAMPLE_PRODUCT_COUNT })}</p>
      )}

      <div className="mt-8 space-y-2">
        {catalogs === null && <p className="text-faint">{t('common.loading')}</p>}
        {catalogs?.length === 0 && <p className="text-faint">{t('catalogs.empty')}</p>}
        {catalogs?.map((catalog) => (
          <div
            key={catalog.id}
            className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 transition-colors hover:bg-elevated"
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
              confirmLabel={t('catalogs.confirmDelete')}
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
