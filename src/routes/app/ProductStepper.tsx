import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useLoadedProducts } from '@/hooks/useLoadedProducts'
import { useAutosave } from '@/hooks/useAutosave'
import { useEditorStore } from '@/store/editorStore'
import { useLimits } from '@/context/LimitsContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { setCatalogWeightUnit } from '@/lib/api/catalogs'
import { useCatalogAccess } from '@/hooks/useCatalogAccess'
import type { AppContext } from '@/routes/app/RequireAuth'
import type { Product, WeightUnit } from '@/lib/types'
import { DEFAULT_CURRENCY } from '@/lib/currency'
import BasicInfoStep from '@/routes/app/steps/BasicInfoStep'
import PricingStep from '@/routes/app/steps/PricingStep'
import AttributesStep from '@/routes/app/steps/AttributesStep'
import ImagesStep from '@/routes/app/steps/ImagesStep'
import ReviewStep from '@/routes/app/steps/ReviewStep'

const STEPS = [
  { key: 'basic', labelKey: 'stepper.stepBasic', Component: BasicInfoStep },
  { key: 'pricing', labelKey: 'stepper.stepPricing', Component: PricingStep },
  { key: 'attributes', labelKey: 'stepper.stepAttributes', Component: AttributesStep },
  { key: 'images', labelKey: 'stepper.stepImages', Component: ImagesStep },
  { key: 'review', labelKey: 'stepper.stepReview', Component: ReviewStep },
] as const

export default function ProductStepper() {
  const { t } = useTranslation()
  const { userId } = useOutletContext<AppContext>()
  const { catalogId, productId } = useParams<{ catalogId: string; productId: string }>()
  const navigate = useNavigate()
  const loading = useLoadedProducts(catalogId!)
  const { atProductLimit, bumpProducts } = useLimits()
  const { access } = useCatalogAccess(catalogId!, userId)
  const ready = access.status === 'ready' ? access : null
  const isOwner = ready?.role === 'owner'

  const products = useEditorStore((s) => s.products)
  const addProduct = useEditorStore((s) => s.addProduct)
  const updateProduct = useEditorStore((s) => s.updateProduct)
  const [stepIndex, setStepIndex] = useState(0)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY)

  const product = products.find((p) => p.id === productId)
  const status = useAutosave(product)

  usePageTitle(product?.name ? `${product.name} · WooLoader` : `${t('stepper.newProduct')} · WooLoader`)

  useEffect(() => {
    if (!ready) return
    setWeightUnit(ready.catalog.weight_unit)
    setCurrency(ready.catalog.currency)
  }, [ready])

  // A client whose link is closed/expired can't save anything: back to the
  // (read-only) catalog instead of an editor whose autosave would just fail.
  useEffect(() => {
    if (ready && !ready.editable) navigate(`/app/catalog/${catalogId}`, { replace: true })
  }, [ready, catalogId, navigate])

  function handleWeightUnitChange(unit: WeightUnit) {
    setWeightUnit(unit)
    setCatalogWeightUnit(catalogId!, unit).catch(() => {
      toast.error(t('stepper.weightUnitError'))
      setWeightUnit(weightUnit)
    })
  }

  useEffect(() => {
    if (productId !== 'new' || loading || !ready) return
    // Respect the limit even if someone lands on /product/new directly (e.g. a
    // bookmarked URL): the owner's account quota, or a client's link cap.
    const atLimit = isOwner ? atProductLimit : ready.link !== null && products.length >= ready.link.max_products
    if (atLimit || !ready.editable) {
      navigate(`/app/catalog/${catalogId}`, { replace: true })
      return
    }
    const created = addProduct(catalogId!)
    if (isOwner) bumpProducts(1)
    navigate(`/app/catalog/${catalogId}/product/${created.id}`, { replace: true })
  }, [productId, loading, ready, isOwner, products.length, addProduct, catalogId, navigate, atProductLimit, bumpProducts])

  if (loading || productId === 'new' || !ready) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted">{t('common.loading')}</div>
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-muted">{t('stepper.notFound')}</p>
      </div>
    )
  }

  const StepComponent = STEPS[stepIndex].Component

  function onChange(patch: Partial<Product>) {
    updateProduct(product!.id, patch)
  }

  function goNext() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      navigate(`/app/catalog/${catalogId}`)
    }
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex(stepIndex - 1)
    else navigate(`/app/catalog/${catalogId}`)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 motion-safe:animate-fade-up">
      <button
        type="button"
        onClick={() => navigate(`/app/catalog/${catalogId}`)}
        className="mb-4 flex items-center gap-1 text-sm text-faint transition-colors hover:text-fg"
      >
        <ArrowLeft size={16} /> {t('stepper.backToCatalog')}
      </button>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 truncate font-display text-2xl font-bold">
          {product.name || t('stepper.newProduct')}
        </h1>
        <span className="shrink-0 text-xs text-faint">
          {status === 'saving' && t('stepper.saving')}
          {status === 'saved' && t('stepper.saved')}
          {status === 'error' && t('stepper.saveError')}
        </span>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            type="button"
            onClick={() => setStepIndex(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              i === stepIndex ? 'bg-accent text-on-accent' : 'bg-elevated text-muted hover:opacity-80'
            }`}
          >
            {t(step.labelKey)}
          </button>
        ))}
      </div>

      {/* Keyed wrapper so each step change replays the entrance animation. */}
      <div key={STEPS[stepIndex].key} className="motion-safe:animate-fade-up">
        <StepComponent
          product={product}
          onChange={onChange}
          // Images go under the catalog OWNER's folder, also when a client
          // uploads them (storage policies in migration 0011).
          userId={ready.catalog.user_id}
          catalogId={catalogId!}
          weightUnit={weightUnit}
          // Only the owner can change catalog settings.
          onWeightUnitChange={isOwner ? handleWeightUnitChange : undefined}
          currency={currency}
        />
      </div>

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 rounded-md border border-line px-4 py-2 text-sm hover:bg-elevated"
        >
          <ArrowLeft size={16} /> {stepIndex === 0 ? t('stepper.backToCatalog') : t('stepper.back')}
        </button>
        <button
          type="button"
          onClick={goNext}
          className="flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:opacity-90"
        >
          {stepIndex === STEPS.length - 1 ? (
            <>
              {t('stepper.finish')} <Check size={16} />
            </>
          ) : (
            <>
              {t('stepper.next')} <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
