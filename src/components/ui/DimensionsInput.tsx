import { inputClass } from '@/components/ui/Field'
import type { Dimensions } from '@/lib/types'

type DimensionsInputProps = {
  value: Dimensions | null
  onChange: (value: Dimensions | null) => void
  className?: string
}

/** Compact Length x Width x Height (cm) input for tight spaces like table cells — see BasicInfoStep for the larger, labeled version used for the product itself. */
export function DimensionsInput({ value, onChange, className }: DimensionsInputProps) {
  function setDimension(key: 'length' | 'width' | 'height', raw: string) {
    const next = {
      length: value?.length ?? null,
      width: value?.width ?? null,
      height: value?.height ?? null,
      [key]: raw === '' ? null : Number(raw),
    }
    const isEmpty = next.length === null && next.width === null && next.height === null
    onChange(isEmpty ? null : next)
  }

  const cellClass = className ?? `${inputClass} w-14`

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        step="0.1"
        placeholder="L"
        className={cellClass}
        value={value?.length ?? ''}
        onChange={(e) => setDimension('length', e.target.value)}
      />
      <span className="text-faint">×</span>
      <input
        type="number"
        min="0"
        step="0.1"
        placeholder="W"
        className={cellClass}
        value={value?.width ?? ''}
        onChange={(e) => setDimension('width', e.target.value)}
      />
      <span className="text-faint">×</span>
      <input
        type="number"
        min="0"
        step="0.1"
        placeholder="H"
        className={cellClass}
        value={value?.height ?? ''}
        onChange={(e) => setDimension('height', e.target.value)}
      />
    </div>
  )
}
