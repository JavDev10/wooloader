import { useTranslation } from 'react-i18next'
import { WooProductPreview } from '@/components/ui/WooProductPreview'
import type { StepProps } from '@/routes/app/steps/types'

function formatPrice(value: number | null): string {
  if (value === null) return '—'
  return `$${value.toLocaleString('es-CL')}`
}

export default function ReviewStep({ product }: StepProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">{t('review.intro')}</p>

      <div className="space-y-2">
        <p className="text-xs text-faint">{t('review.previewNote')}</p>
        <WooProductPreview product={product} />
      </div>

      <dl className="grid grid-cols-[140px_1fr] gap-y-2 rounded-md border border-line p-4">
        <dt className="text-faint">{t('review.name')}</dt>
        <dd>{product.name || '—'}</dd>

        <dt className="text-faint">{t('review.category')}</dt>
        <dd>{product.category || '—'}</dd>

        <dt className="text-faint">{t('review.price')}</dt>
        <dd>
          {product.is_quote_only
            ? t('review.quoteOnly')
            : `${formatPrice(product.regular_price)}${
                product.sale_price ? ` (${t('review.saleTag', { price: formatPrice(product.sale_price) })})` : ''
              }`}
        </dd>

        <dt className="text-faint">{t('review.stock')}</dt>
        <dd>{product.stock === null ? t('review.unlimited') : product.stock}</dd>

        <dt className="text-faint">{t('review.attributes')}</dt>
        <dd>
          {product.attributes.length === 0
            ? t('review.noVariants')
            : product.attributes.map((a) => `${a.name} (${a.values.length})`).join(', ')}
        </dd>

        <dt className="text-faint">{t('review.images')}</dt>
        <dd>{t('review.imagesCount', { count: product.images.length })}</dd>
      </dl>
    </div>
  )
}
