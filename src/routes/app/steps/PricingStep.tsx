import { Field, inputClass } from '@/components/ui/Field'
import { PriceInput } from '@/components/ui/PriceInput'
import type { StepProps } from '@/routes/app/steps/types'

export default function PricingStep({ product, onChange }: StepProps) {
  const isUnlimitedStock = product.stock === null

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
        <input
          type="checkbox"
          checked={product.is_quote_only}
          onChange={(e) => onChange({ is_quote_only: e.target.checked })}
          className="h-4 w-4 accent-accent"
        />
        <span>Este producto es a cotizar (sin precio fijo)</span>
      </label>

      {product.is_quote_only ? (
        <p className="rounded-md bg-elevated px-3 py-2 text-sm text-muted">
          El precio queda oculto en la tienda. El producto se exporta con una nota de "precio a cotizar".
        </p>
      ) : (
        <>
          {product.attributes.length > 0 && (
            <p className="rounded-md bg-link/10 px-3 py-2 text-sm text-muted">
              Este producto tiene variantes — el precio de acá abajo es solo el valor inicial para las
              variantes nuevas. El precio real de venta se define por variante en el paso "Atributos y
              variantes".
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Precio regular" htmlFor="regular_price">
              <PriceInput id="regular_price" value={product.regular_price} onChange={(v) => onChange({ regular_price: v })} />
            </Field>
            <Field label="Precio oferta" htmlFor="sale_price">
              <PriceInput id="sale_price" value={product.sale_price} onChange={(v) => onChange({ sale_price: v })} />
            </Field>
          </div>
        </>
      )}

      <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
        <input
          type="checkbox"
          checked={isUnlimitedStock}
          onChange={(e) => onChange({ stock: e.target.checked ? null : 0 })}
          className="h-4 w-4 accent-accent"
        />
        <span>Stock ilimitado</span>
      </label>

      {!isUnlimitedStock && (
        <Field label="Stock" htmlFor="stock">
          <input
            id="stock"
            type="number"
            min="0"
            className={inputClass}
            value={product.stock ?? 0}
            onChange={(e) => onChange({ stock: Number(e.target.value) })}
          />
        </Field>
      )}

      {/* Only for simple products: variable products use per-variant SKUs (set
          in "Atributos y variantes"), and their parent SKU is auto-generated. */}
      {product.attributes.length === 0 && (
        <Field label="SKU" htmlFor="sku" hint="Código interno del producto. Si lo dejás vacío, se exporta sin SKU.">
          <input
            id="sku"
            className={inputClass}
            value={product.sku ?? ''}
            onChange={(e) => onChange({ sku: e.target.value || null })}
          />
        </Field>
      )}
    </div>
  )
}
