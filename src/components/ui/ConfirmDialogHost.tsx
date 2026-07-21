import { createPortal } from 'react-dom'
import { useConfirmDialogStore } from '@/store/confirmDialogStore'

/** Mount once (see App.tsx) — renders whatever confirmDialog()/alertDialog() from confirmDialogStore currently has open. */
export function ConfirmDialogHost() {
  const { isOpen, message, confirmLabel, cancelLabel, respond } = useConfirmDialogStore()

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-lg border border-line bg-app p-6 shadow-xl">
        <p className="whitespace-pre-line text-sm text-fg">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          {cancelLabel !== null && (
            <button
              type="button"
              onClick={() => respond(false)}
              className="rounded-md border border-line px-4 py-2 text-sm hover:bg-elevated"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => respond(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
