import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Field, inputClass } from '@/components/ui/Field'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useCategorySuggestions, useSubcategorySuggestions } from '@/hooks/useCategorySuggestions'
import { formatWeightDisplay, parseWeightInput } from '@/lib/weightFormat'
import type { WeightUnit } from '@/lib/types'
import type { StepProps } from '@/routes/app/steps/types'

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lb']

export default function BasicInfoStep({ product, onChange, weightUnit, onWeightUnitChange }: StepProps) {
  const { t } = useTranslation()
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
      <Field label={t('basic.name')} htmlFor="name">
        <input
          id="name"
          className={inputClass}
          value={product.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t('basic.namePlaceholder')}
        />
      </Field>

      <Field label={t('basic.shortDescription')} htmlFor="short_description" hint={t('basic.shortDescriptionHint')}>
        <textarea
          id="short_description"
          rows={2}
          className={inputClass}
          value={product.short_description}
          onChange={(e) => onChange({ short_description: e.target.value })}
          placeholder={t('basic.shortDescriptionPlaceholder')}
        />
      </Field>

      <Field label={t('basic.description')} htmlFor="description">
        <RichTextEditor
          id="description"
          value={product.description}
          onChange={(html) => onChange({ description: html })}
          placeholder={t('basic.descriptionPlaceholder')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('basic.category')} htmlFor="category" hint={t('basic.categoryHint')}>
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

        <Field label={t('basic.subcategory')} htmlFor="subcategory" hint={t('basic.subcategoryHint')}>
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
        <span>{t('basic.noPhysical')}</span>
      </label>

      {!product.no_physical_dimensions && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('basic.weight', { unit: weightUnit })} htmlFor="weight">
              <div className="flex gap-2">
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
                  onBlur={() => setWeightFocused(false)}
                  placeholder="0"
                />
                <div
                  className="flex shrink-0 overflow-hidden rounded-md border border-line"
                  role="group"
                  aria-label={t('basic.weightUnitAria')}
                >
                  {WEIGHT_UNITS.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => onWeightUnitChange(unit)}
                      className={
                        unit === weightUnit
                          ? 'bg-accent px-3 text-sm font-semibold text-on-accent'
                          : 'bg-surface px-3 text-sm text-muted hover:bg-elevated'
                      }
                      aria-pressed={unit === weightUnit}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </Field>
          </div>

          <Field label={t('basic.dimensions')} htmlFor="dim-length">
            <div className="grid grid-cols-3 gap-3">
              <input
                id="dim-length"
                type="number"
                min="0"
                step="0.1"
                placeholder={t('basic.length')}
                className={inputClass}
                value={product.dimensions?.length ?? ''}
                onChange={(e) => setDimension('length', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder={t('basic.width')}
                className={inputClass}
                value={product.dimensions?.width ?? ''}
                onChange={(e) => setDimension('width', e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder={t('basic.height')}
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
