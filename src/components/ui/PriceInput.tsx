import { useState } from 'react'
import { inputClass } from '@/components/ui/Field'
import { currencyDecimals } from '@/lib/currency'
import { formatPriceDisplay, formatPriceEditable, parsePriceInput } from '@/lib/priceFormat'

type PriceInputProps = {
  id?: string
  value: number | null
  onChange: (value: number | null) => void
  /** The catalog's currency — decides the allowed decimals and the display format. */
  currency: string
  className?: string
  placeholder?: string
}

/**
 * A price input. While focused it keeps exactly what the user types (so a
 * half-typed "19," isn't wiped out and the cursor doesn't jump); once blurred
 * it shows the formatted value ("3.990", "1,234.50"). Whatever the user types —
 * either decimal convention, with or without thousands separators — `onChange`
 * receives a plain number limited to the currency's decimals.
 */
export function PriceInput({ id, value, onChange, currency, className, placeholder = '0' }: PriceInputProps) {
  const decimals = currencyDecimals(currency)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState('')

  return (
    <input
      id={id}
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      className={className ?? inputClass}
      value={focused ? text : formatPriceDisplay(value, currency)}
      onFocus={() => {
        setText(formatPriceEditable(value, currency))
        setFocused(true)
      }}
      onChange={(e) => {
        const typed = e.target.value.replace(/[^\d.,]/g, '')
        setText(typed)
        onChange(parsePriceInput(typed, decimals))
      }}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
    />
  )
}
