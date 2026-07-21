import { useEffect, useState } from 'react'
import { inputClass } from '@/components/ui/Field'
import { formatPriceDisplay, parsePriceInput } from '@/lib/priceFormat'

type PriceInputProps = {
  id?: string
  value: number | null
  onChange: (value: number | null) => void
  className?: string
  placeholder?: string
}

/**
 * A price input. Shows plain digits while focused (so typing doesn't fight a
 * live thousands separator / cursor jump), and a "3.990"-style formatted value
 * once blurred. Whatever the user types — with dots, commas, or nothing — the
 * value that reaches `onChange` is always a clean integer with no separators.
 */
export function PriceInput({ id, value, onChange, className, placeholder = '0' }: PriceInputProps) {
  const [focused, setFocused] = useState(false)
  const [rawText, setRawText] = useState(value === null ? '' : String(value))

  useEffect(() => {
    if (!focused) setRawText(value === null ? '' : String(value))
  }, [value, focused])

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className={className ?? inputClass}
      value={focused ? rawText : formatPriceDisplay(value)}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const parsed = parsePriceInput(e.target.value)
        setRawText(parsed === null ? '' : String(parsed))
        onChange(parsed)
      }}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
    />
  )
}
