import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { inputClass } from '@/components/ui/Field'
import { reconcileVariants } from '@/lib/variantCombinations'
import type { Attribute } from '@/lib/types'
import type { StepProps } from '@/routes/app/steps/types'
import VariantGrid from '@/routes/app/steps/VariantGrid'

export default function AttributesStep(props: StepProps) {
  const { product, onChange } = props
  const [newAttrName, setNewAttrName] = useState('')
  const [valueDrafts, setValueDrafts] = useState<Record<number, string>>({})

  function commitAttributes(attributes: Attribute[]) {
    onChange({
      attributes,
      variants: reconcileVariants(attributes, product.variants, {
        price: product.regular_price,
        sale_price: product.sale_price,
      }),
    })
  }

  function addAttribute() {
    const name = newAttrName.trim()
    if (!name) return
    if (product.attributes.some((a) => a.name.toLowerCase() === name.toLowerCase())) return
    commitAttributes([...product.attributes, { name, values: [] }])
    setNewAttrName('')
  }

  function removeAttribute(index: number) {
    commitAttributes(product.attributes.filter((_, i) => i !== index))
  }

  function addValue(index: number) {
    const raw = valueDrafts[index]?.trim()
    if (!raw) return
    const attr = product.attributes[index]
    if (attr.values.includes(raw)) {
      setValueDrafts((d) => ({ ...d, [index]: '' }))
      return
    }
    const attributes = product.attributes.map((a, i) =>
      i === index ? { ...a, values: [...a.values, raw] } : a,
    )
    commitAttributes(attributes)
    setValueDrafts((d) => ({ ...d, [index]: '' }))
  }

  function removeValue(index: number, value: string) {
    const attributes = product.attributes.map((a, i) =>
      i === index ? { ...a, values: a.values.filter((v) => v !== value) } : a,
    )
    commitAttributes(attributes)
  }

  function handleAttrNameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addAttribute()
    }
  }

  function handleValueKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addValue(index)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Agregá un atributo (ej. "Color") y sus valores (ej. negro, azul, rojo). Si cargás 2 o más
        atributos, generamos automáticamente todas las combinaciones para que definas precio y stock
        de cada una.
      </p>

      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder='Nombre del atributo, ej. "Color"'
          value={newAttrName}
          onChange={(e) => setNewAttrName(e.target.value)}
          onKeyDown={handleAttrNameKeyDown}
        />
        <button
          type="button"
          onClick={addAttribute}
          className="flex items-center gap-1 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium hover:bg-elevated"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {product.attributes.map((attr, i) => (
        <div key={attr.name} className="space-y-2 rounded-md border border-line p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{attr.name}</span>
            <button
              type="button"
              onClick={() => removeAttribute(i)}
              className="text-faint hover:text-red-400"
              aria-label={`Eliminar atributo ${attr.name}`}
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {attr.values.map((v) => (
              <span key={v} className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-sm text-accent-ink">
                {v}
                <button type="button" onClick={() => removeValue(i, v)} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <input
            className={`${inputClass} text-sm`}
            placeholder="Agregar valor y Enter"
            value={valueDrafts[i] ?? ''}
            onChange={(e) => setValueDrafts((d) => ({ ...d, [i]: e.target.value }))}
            onKeyDown={(e) => handleValueKeyDown(i, e)}
          />
        </div>
      ))}

      {product.attributes.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted">Variantes</span>
          <VariantGrid {...props} />
        </div>
      )}
    </div>
  )
}
