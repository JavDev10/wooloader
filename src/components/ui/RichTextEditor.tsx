import { useEffect, useRef, type ClipboardEvent, type ReactNode } from 'react'
import { Bold, Italic, Heading2, Heading3, List, Pilcrow } from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitizeHtml'

/**
 * Shared styling for rendered rich-text HTML (headings, lists, paragraphs).
 * Used both inside the editor and in the product preview, so the description
 * looks the same while editing and in the mockup.
 */
export const richTextContentClass =
  '[&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 ' +
  '[&_a]:text-link [&_a]:underline [&_strong]:font-semibold'

type RichTextEditorProps = {
  id?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

/**
 * Minimal, dependency-free rich-text editor built on a contentEditable div and
 * the browser's formatting commands. Produces HTML (what WooCommerce's product
 * description accepts). Uncontrolled: the initial HTML is set once on mount, and
 * every edit is pushed out via onChange — React never re-writes the DOM, so the
 * caret is never reset mid-typing.
 */
export function RichTextEditor({ id, value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Init once from the loaded value, sanitizing in case an older/tampered row
    // holds unsafe HTML. Later changes come from the user, not props.
    if (ref.current) ref.current.innerHTML = sanitizeHtml(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Push the current editor HTML out, sanitized — the single boundary where the stored value is cleaned. */
  function emit() {
    if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML))
  }

  function exec(command: string, arg?: string) {
    document.execCommand(command, false, arg)
    ref.current?.focus()
    emit()
  }

  /** Paste as sanitized HTML (or plain text) so malicious/dirty markup never enters the DOM. */
  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html))
    } else {
      document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
    }
    emit()
  }

  return (
    <div className="rounded-md border border-line bg-surface focus-within:border-link">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-1.5 py-1">
        <ToolbarButton onClick={() => exec('bold')} label="Negrita">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} label="Cursiva">
          <Italic size={15} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton onClick={() => exec('formatBlock', 'h2')} label="Título">
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('formatBlock', 'h3')} label="Subtítulo">
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('formatBlock', 'p')} label="Párrafo">
          <Pilcrow size={15} />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton onClick={() => exec('insertUnorderedList')} label="Lista con viñetas">
          <List size={15} />
        </ToolbarButton>
      </div>
      <div
        id={id}
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={emit}
        onPaste={handlePaste}
        className={`min-h-[140px] px-3 py-2 text-sm outline-none empty:before:text-faint empty:before:content-[attr(data-placeholder)] ${richTextContentClass}`}
      />
    </div>
  )
}

function ToolbarButton({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      // onMouseDown (not onClick) + preventDefault so the button press doesn't
      // blur the editor and collapse the selection before the command runs.
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className="rounded p-1.5 text-muted hover:bg-elevated hover:text-fg"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
