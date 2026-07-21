import { useEffect, useRef, useState, type ReactNode } from 'react'

type ConfirmButtonProps = {
  onConfirm: () => void | Promise<void>
  label: string
  confirmLabel?: string
  icon?: ReactNode
  className?: string
  confirmClassName?: string
}

/** Two-step confirm: first click arms it for 3s, second click (while armed) actually fires `onConfirm`. Used for destructive actions that shouldn't be a single misclick away. */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = '¿Seguro? Confirmar',
  icon,
  className = '',
  confirmClassName = '',
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 3000)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    setConfirming(false)
    onConfirm()
  }

  return (
    <button type="button" onClick={handleClick} className={confirming ? confirmClassName : className}>
      {!confirming && icon}
      {confirming ? confirmLabel : label}
    </button>
  )
}
