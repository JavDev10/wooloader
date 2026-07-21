import { create } from 'zustand'

type ConfirmDialogState = {
  isOpen: boolean
  message: string
  confirmLabel: string
  cancelLabel: string | null
  resolve: ((value: boolean) => void) | null
}

type ConfirmDialogStore = ConfirmDialogState & {
  request: (message: string, options?: { confirmLabel?: string; cancelLabel?: string | null }) => Promise<boolean>
  respond: (value: boolean) => void
}

const useConfirmDialogStore = create<ConfirmDialogStore>((set, get) => ({
  isOpen: false,
  message: '',
  confirmLabel: 'Continuar',
  cancelLabel: 'Cancelar',
  resolve: null,

  request: (message, options) =>
    new Promise((resolve) => {
      set({
        isOpen: true,
        message,
        confirmLabel: options?.confirmLabel ?? 'Continuar',
        cancelLabel: options?.cancelLabel === undefined ? 'Cancelar' : options.cancelLabel,
        resolve,
      })
    }),

  respond: (value) => {
    get().resolve?.(value)
    set({ isOpen: false, message: '', resolve: null })
  },
}))

export { useConfirmDialogStore }

/** Imperative popup confirm (styled like the rest of the app) — an on-brand replacement for window.confirm(). Rendered by <ConfirmDialogHost/>, mounted once in App.tsx. */
export function confirmDialog(
  message: string,
  options?: { confirmLabel?: string; cancelLabel?: string },
): Promise<boolean> {
  return useConfirmDialogStore.getState().request(message, options)
}

/** Purely informational popup with a single dismiss button — for blocking messages that aren't a yes/no choice (e.g. "you can't export yet, here's what's missing"). */
export function alertDialog(message: string, confirmLabel = 'Entendido'): Promise<void> {
  return useConfirmDialogStore.getState().request(message, { confirmLabel, cancelLabel: null }).then(() => undefined)
}
