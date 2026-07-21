import { useEffect, useState } from 'react'
import { Field, inputClass } from '@/components/ui/Field'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useCategorySuggestions, useSubcategorySuggestions } from '@/hooks/useCategorySuggestions'
import { clampWeight, formatWeightDisplay, MIN_WEIGHT_KG, parseWeightInput } from '@/lib/weightFormat'
import type { StepProps } from '@/routes/app/steps/types'

export default function BasicInfoStep({ product, onChange }: StepProps) {
  const categories = useCategorySuggestions()
  const subcategories = useSubcategorySuggestions(product.category)
  const [weightFocused, setWeightFocused] = useState(false)
  const [weightText, setWeightText] = useState(formatWeightDisplay(product.weight))

  useEffect(() => {
    if (!weightFocused) setWeightText(formatWeightDisplay(product.weight))
  }, [product.weight, weightFocused])

  function setDimension(key: 'length' | 'width' | 'height', value: string) {
    const num = value === '' ? null : Number(value)
    onChange({
      dimensions: {
        length: product.dimensions?.length ?? null,
        width: product.dimensions?.width ?? null,
        height: product.dimensions?.height ?? null,
        [key]: num,
      },
    })
  }

  return (
    <div className="space-y-5">
      <Field label="Nombre del producto" htmlFor="name">
        <input
          id="name"
          className={inputClass}
          value={product.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder='Ej: "Mesa de comedor de pino"'
        />
      </Field>

      <Field
        label="Descripción corta"
        htmlFor="short_description"
        hint="Resumen breve que aparece junto al precio en la tienda."
      >
        <textarea
          id="short_description"
          rows={2}
          className={inputClass}
          value={product.short_description}
          onChange={(e) => onChange({ short_description: e.target.value })}
          placeholder="Resumen breve del producto"
        />
      </Field>

      <Field label="Descripción larga" htmlFor="description">
        <RichTextEditor
          id="description"
          value={product.description}
          onChange={(html) => onChange({ description: html })}
          placeholder="Contá qué hace especial a este producto…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Categoría" htmlFor="category" hint="Ej: Comedor, Fitness, Marca">
          <input
            id="category"
            list="category-suggestions"
            className={inputClass}
            value={product.category}
            onChange={(e) => onChange({ category: e.target.value })}
          />
          <datalist id="category-suggestions">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Subcategoría" htmlFor="subcategory" hint="Ej: Marca1, Marca2">
          <input
            id="subcategory"
            list="subcategory-suggestions"
            className={inputClass}
            value={product.subcategory}
            onChange={(e) => onChange({ subcategory: e.target.value })}
          />
          <datalist id="subcategory-suggestions">
            {subcategories.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Field>
      </div>

      <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
        <input
          type="checkbox"
          checked={product.no_physical_dimensions}
          onChange={(e) => onChange({ no_physical_dimensions: e.target.checked })}
          className="h-4 w-4 accent-accent"
        />
        <span>Este producto no tiene peso ni dimensiones físicas (ej. servicio, producto digital)</span>
      </label>

      {!product.no_physical_dimensions && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Peso (kg)"
              htmlFor="weight"
              hint={`Mínimo ${formatWeightDisplay(MIN_WEIGHT_KG)}kg`}
            >
              <input
                id="weight"
                type="text"
                inputMode="decimal"
                className={inputClass}
                value={weightFocused ? weightText : formatWeightDisplay(product.weight)}
                onFocus={() => setWeightFocused(true)}
                onChange={(e) => {
                  setWeightText(e.target.value)
                  onChange({ weight: parseWeightInput(e.target.value) })
                }}
                onBlur={() => {
                  setWeightFocused(false)
                  onChange({ weight: clampWeight(parseWeightInput(weightText)) })
                }}
                placeholder={formatWeightDisplay(MIN_WEIGHT_KG)}
              />
            </Field>
          </div>

          <Field label="Dimensiones (cm)" htmlFor="dim-length">
            <div className="grid grid-cols-3 gap-3">
              <input
                id="dim-length"
                type="number"
                min="0"
                step="0.1"
                placeholder="Largo"
                className={inputClass}
                value={product.dimensions?.length ?? ''}
                onChange={(e) => setDimension('length', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Ancho"
                className={inputClass}
                value={product.dimensions?.width ?? ''}
                onChange={(e) => setDimension('width', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Alto"
                className={inputClass}
                value={product.dimensions?.height ?? ''}
                onChange={(e) => setDimension('height', e.target.value)}
              />
            </div>
          </Field>
        </>
      )}
    </div>
  )
}
