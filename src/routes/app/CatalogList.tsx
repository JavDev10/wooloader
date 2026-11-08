import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Sparkles, Trash2 } from 'lucide-react'
import { createCatalog, deleteCatalogCompletely, listCatalogs } from '@/lib/api/catalogs'
import { upsertProduct } from '@/lib/api/products'
import { isShareLinkGuest } from '@/lib/api/auth'
import { guessCurrency } from '@/lib/currency'
import { buildSampleProducts, sampleCatalogName, SAMPLE_PRODUCT_COUNT } from '@/lib/sampleCatalog'
import { ConfirmButton } from '@/components/ui/ConfirmButton'
import { inputClass } from '@/components/ui/Field'
import { useLimits } from '@/context/LimitsContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { Catalog } from '@/lib/types'
import type { AppContext } from '@/routes/app/RequireAuth'

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
const CARD =
  'flex min-h-28 flex-col rounded-lg border border-line bg-surface p-4 transition-colors hover:border-accent/60 hover:bg-elevated'

export default function CatalogList() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('seo.catalogs'))
  const { userId, session } = useOutletContext<AppContext>()
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

  // A client who arrived through a share link only works on catalogs shared
  // with them; creating their own (guest, deleted after 24 h) would confuse.
  const linkGuest = isShareLinkGuest(session)
  const owned = catalogs?.filter((c) => c.user_id === userId) ?? null
  const shared = catalogs?.filter((c) => c.user_id !== userId) ?? []

  const cardMeta = (catalog: Catalog) =>
    t('catalogs.cardMeta', {
      currency: catalog.currency,
      date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(catalog.updated_at)),
    })

  const sharedSection = shared.length > 0 && (
    <section className={linkGuest ? 'mt-8' : 'mt-12'}>
      <h2 className="font-semibold">{t('catalogs.sharedTitle')}</h2>
      <p className="mt-1 text-sm text-muted">{t('catalogs.sharedSubtitle')}</p>
      <div className={`mt-4 ${GRID}`}>
        {shared.map((catalog) => (
          <button
            key={catalog.id}
            type="button"
            onClick={() => navigate(`/app/catalog/${catalog.id}`)}
            className={`${CARD} text-left`}
          >
            <span className="break-words font-semibold">{catalog.name}</span>
            <span className="mt-auto pt-3 text-xs text-faint">{cardMeta(catalog)}</span>
          </button>
        ))}
      </div>
    </section>
  )

  if (linkGuest) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12 motion-safe:animate-fade-up">
        <h1 className="font-display text-3xl font-bold">{t('catalogs.sharedTitle')}</h1>
        {catalogs === null && <p className="mt-6 text-faint">{t('common.loading')}</p>}
        {catalogs !== null && shared.length === 0 && <p className="mt-6 text-faint">{t('catalogs.sharedEmpty')}</p>}
        {sharedSection}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 motion-safe:animate-fade-up">
      {/* Header: intro on the left, "new catalog" on the right (stacked on narrow screens). */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-bold">{t('catalogs.title')}</h1>
          <p className="mt-2 text-muted">{t('catalogs.subtitle')}</p>
          {enabled && (
            <p className="mt-1 text-sm text-faint">
              {t('catalogs.usage', { count: catalogCount, max: maxCatalogs })}
            </p>
          )}
        </div>

        <div className="w-full lg:max-w-md">
          <div className="flex gap-2">
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
        </div>
      </div>

      {owned === null && <p className="mt-10 text-faint">{t('common.loading')}</p>}
      {owned?.length === 0 && <p className="mt-10 text-faint">{t('catalogs.empty')}</p>}
      {owned && owned.length > 0 && (
        <div className={`mt-10 ${GRID}`}>
          {owned.map((catalog) => (
            <div key={catalog.id} className={`${CARD} relative`}>
              {/* The whole card opens the catalog; the delete button sits on top. */}
              <button
                type="button"
                onClick={() => navigate(`/app/catalog/${catalog.id}`)}
                className="absolute inset-0 rounded-lg"
                aria-label={catalog.name}
              />
              <span className="pointer-events-none break-words pr-8 font-semibold">{catalog.name}</span>
              <span className="pointer-events-none mt-auto pt-3 text-xs text-faint">{cardMeta(catalog)}</span>
              <div className="absolute right-3 top-3">
                <ConfirmButton
                  onConfirm={() => handleDelete(catalog)}
                  label=""
                  confirmLabel={t('catalogs.confirmDelete')}
                  icon={<Trash2 size={16} />}
                  className="text-faint hover:text-red-400"
                  confirmClassName="text-xs font-medium text-red-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {sharedSection}
    </div>
  )
}
