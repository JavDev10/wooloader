import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { inputClass } from '@/components/ui/Field'
import { PriceInput } from '@/components/ui/PriceInput'
import { WeightInput } from '@/components/ui/WeightInput'
import { DimensionsInput } from '@/components/ui/DimensionsInput'
import { uploadProductImage } from '@/lib/api/storage'
import { processImage } from '@/lib/imageValidation'
import type { Variant } from '@/lib/types'
import type { StepProps } from '@/routes/app/steps/types'

export default function VariantGrid({ product, onChange, userId, catalogId }: StepProps) {
  function updateVariant(id: string, patch: Partial<Variant>) {
    onChange({
      variants: product.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    })
  }

  // Copies the product's own weight/dimensions (entered in "Datos básicos")
  // into every variant, so you don't have to retype them row by row when the
  // variants share the base product's measurements.
  function applyProductPhysicalToAll() {
    onChange({
      variants: product.variants.map((v) => ({
        ...v,
        weight: product.weight,
        dimensions: product.dimensions,
      })),
    })
  }

  const hasProductPhysical = product.weight != null || product.dimensions != null

  // "Deleting" a variant marks it excluded rather than dropping it from the
  // array, so re-editing attributes doesn't regenerate it (reconcileVariants
  // preserves existing entries) and it can be restored. The export/preview
  // skip excluded variants.
  function deleteVariant(id: string) {
    updateVariant(id, { excluded: true })
  }

  function restoreAll() {
    onChange({ variants: product.variants.map((v) => ({ ...v, excluded: false })) })
  }

  async function handleImageUpload(variantId: string, file: File) {
    const prepared = await processImage(file, { square: product.square_images })
    const image = await uploadProductImage(userId, catalogId, product.id, prepared)
    updateVariant(variantId, { image_url: image.url })
  }

  if (product.variants.length === 0) {
    return <p className="text-sm text-faint">Agregá al menos un valor a cada atributo para generar variantes.</p>
  }

  const visibleVariants = product.variants.filter((v) => !v.excluded)
  const hiddenCount = product.variants.length - visibleVariants.length

  return (
    // Breaks out wider than the rest of the form (capped at max-w-2xl) so the
    // variant grid's many columns fit without cramping. Centered and capped at
    // max-w-5xl; on narrow screens w-screen keeps it full width.
    <div className="relative left-1/2 w-screen max-w-5xl -translate-x-1/2 px-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-faint">
          Peso y dimensiones son opcionales — dejalos vacíos si la variante pesa/mide igual que el resto del producto.
        </p>
        {hasProductPhysical && (
          <button
            type="button"
            onClick={applyProductPhysicalToAll}
            className="whitespace-nowrap rounded-md border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-elevated hover:text-fg"
          >
            Usar el peso y dimensiones del producto en todas
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-faint">
            <th className="px-2 font-normal">Combinación</th>
            <th className="px-2 font-normal">Precio</th>
            <th className="px-2 font-normal">Oferta</th>
            <th className="px-2 font-normal">Stock</th>
            <th className="px-2 font-normal">SKU</th>
            <th className="px-2 font-normal">Peso (kg)</th>
            <th className="px-2 font-normal">Dimensiones (cm)</th>
            <th className="px-2 font-normal">Imagen</th>
            <th className="px-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {visibleVariants.map((variant) => (
            <VariantRow
              key={variant.id}
              variant={variant}
              onChange={(patch) => updateVariant(variant.id, patch)}
              onUploadImage={(file) => handleImageUpload(variant.id, file)}
              onDelete={() => deleteVariant(variant.id)}
            />
          ))}
        </tbody>
      </table>
      </div>

      {visibleVariants.length === 0 && (
        <p className="mt-2 text-sm text-faint">
          Eliminaste todas las variantes de este producto.
        </p>
      )}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={restoreAll}
          className="mt-2 text-xs text-faint underline hover:text-fg"
        >
          Restaurar {hiddenCount} variante{hiddenCount === 1 ? '' : 's'} eliminada{hiddenCount === 1 ? '' : 's'}
        </button>
      )}
    </div>
  )
}

function VariantRow({
  variant,
  onChange,
  onUploadImage,
  onDelete,
}: {
  variant: Variant
  onChange: (patch: Partial<Variant>) => void
  onUploadImage: (file: File) => void
  onDelete: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <tr className="bg-surface">
      <td className="rounded-l-md px-2 py-2 whitespace-nowrap">
        {Object.entries(variant.attribute_values)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')}
      </td>
      <td className="px-2">
        <PriceInput className={`${inputClass} w-24`} value={variant.price} onChange={(v) => onChange({ price: v })} />
      </td>
      <td className="px-2">
        <PriceInput className={`${inputClass} w-24`} value={variant.sale_price} onChange={(v) => onChange({ sale_price: v })} />
      </td>
      <td className="px-2">
        <input
          type="number"
          min="0"
          className={`${inputClass} w-20`}
          value={variant.stock ?? ''}
          onChange={(e) => onChange({ stock: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </td>
      <td className="px-2">
        <input
          className={`${inputClass} w-28`}
          value={variant.sku ?? ''}
          onChange={(e) => onChange({ sku: e.target.value || null })}
        />
      </td>
      <td className="px-2">
        <WeightInput className={`${inputClass} w-20`} value={variant.weight} onChange={(v) => onChange({ weight: v })} placeholder="—" />
      </td>
      <td className="px-2">
        <DimensionsInput value={variant.dimensions} onChange={(v) => onChange({ dimensions: v })} />
      </td>
      <td className="px-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUploadImage(file)
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-muted hover:text-link"
          aria-label="Subir imagen de la variante"
        >
          {variant.image_url ? (
            <img src={variant.image_url} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <ImagePlus size={18} />
          )}
        </button>
      </td>
      <td className="rounded-r-md px-2">
        <button
          type="button"
          onClick={onDelete}
          className="text-faint hover:text-red-400"
          aria-label="Eliminar variante"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  )
}
