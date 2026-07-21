import { WooProductPreview } from '@/components/ui/WooProductPreview'
import type { StepProps } from '@/routes/app/steps/types'

function formatPrice(value: number | null): string {
  if (value === null) return '—'
  return `$${value.toLocaleString('es-CL')}`
}

export default function ReviewStep({ product }: StepProps) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">Revisá los datos antes de continuar. Podés volver a cualquier paso para corregir algo.</p>

      <div className="space-y-2">
        <p className="text-xs text-faint">
          Vista previa (ilustrativa — no es el diseño real de tu tienda, solo para darte una idea)
        </p>
        <WooProductPreview product={product} />
      </div>

      <dl className="grid grid-cols-[140px_1fr] gap-y-2 rounded-md border border-line p-4">
        <dt className="text-faint">Nombre</dt>
        <dd>{product.name || '—'}</dd>

        <dt className="text-faint">Categoría</dt>
        <dd>{product.category || '—'}</dd>

        <dt className="text-faint">Precio</dt>
        <dd>
          {product.is_quote_only
            ? 'A cotizar'
            : `${formatPrice(product.regular_price)}${product.sale_price ? ` (oferta ${formatPrice(product.sale_price)})` : ''}`}
        </dd>

        {product.price_tiers.length > 0 && (
          <>
            <dt className="text-faint">Tramos</dt>
            <dd>
              {product.price_tiers.map((t) => `${t.min_qty}+ un.: $${t.price}`).join(' · ')}
            </dd>
          </>
        )}

        <dt className="text-faint">Stock</dt>
        <dd>{product.stock === null ? 'Ilimitado' : product.stock}</dd>

        <dt className="text-faint">Atributos</dt>
        <dd>
          {product.attributes.length === 0
            ? 'Sin variantes'
            : product.attributes.map((a) => `${a.name} (${a.values.length})`).join(', ')}
        </dd>

        <dt className="text-faint">Imágenes</dt>
        <dd>{product.images.length} cargada(s)</dd>
      </dl>
    </div>
  )
}
