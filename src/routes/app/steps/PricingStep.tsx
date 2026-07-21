import { Plus, Trash2 } from 'lucide-react'
import { Field, inputClass } from '@/components/ui/Field'
import { PriceInput } from '@/components/ui/PriceInput'
import type { PriceTier } from '@/lib/types'
import type { StepProps } from '@/routes/app/steps/types'

export default function PricingStep({ product, onChange }: StepProps) {
  const isUnlimitedStock = product.stock === null

  function updateTier(index: number, patch: Partial<PriceTier>) {
    const tiers = product.price_tiers.map((t, i) => (i === index ? { ...t, ...patch } : t))
    onChange({ price_tiers: tiers })
  }

  function addTier() {
    onChange({ price_tiers: [...product.price_tiers, { min_qty: 1, price: 0 }] })
  }

  function removeTier(index: number) {
    onChange({ price_tiers: product.price_tiers.filter((_, i) => i !== index) })
  }

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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Precios por cantidad (opcional)</span>
              <button
                type="button"
                onClick={addTier}
                className="flex items-center gap-1 text-sm text-link hover:underline"
              >
                <Plus size={14} /> Agregar tramo
              </button>
            </div>
            {product.price_tiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-faint">Desde</span>
                <input
                  type="number"
                  min="1"
                  className={`${inputClass} w-24`}
                  value={tier.min_qty}
                  onChange={(e) => updateTier(i, { min_qty: Number(e.target.value) })}
                />
                <span className="text-sm text-faint">unidades, $</span>
                <PriceInput
                  className={`${inputClass} w-32`}
                  value={tier.price}
                  onChange={(v) => updateTier(i, { price: v ?? 0 })}
                />
                <span className="text-sm text-faint">c/u</span>
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="ml-auto text-faint hover:text-red-400"
                  aria-label="Eliminar tramo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
