import { useEffect, useState } from 'react'
import { inputClass } from '@/components/ui/Field'
import { formatWeightDisplay, parseWeightInput } from '@/lib/weightFormat'

type WeightInputProps = {
  id?: string
  value: number | null
  onChange: (value: number | null) => void
  className?: string
  placeholder?: string
}

/** A weight input using a comma decimal separator. No minimum — any positive value goes. See src/lib/weightFormat.ts. */
export function WeightInput({ id, value, onChange, className, placeholder }: WeightInputProps) {
  const [focused, setFocused] = useState(false)
  const [rawText, setRawText] = useState(formatWeightDisplay(value))

  useEffect(() => {
    if (!focused) setRawText(formatWeightDisplay(value))
  }, [value, focused])

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={className ?? inputClass}
      value={focused ? rawText : formatWeightDisplay(value)}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        setRawText(e.target.value)
        onChange(parseWeightInput(e.target.value))
      }}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
    />
  )
}
