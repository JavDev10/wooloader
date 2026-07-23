import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '@/i18n'

type Props = { children: ReactNode }
type State = { error: Error | null; componentStack: string | null; copied: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null, copied: false }

  static getDerivedStateFromError(error: Error): State {
    return { error, componentStack: null, copied: false }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in WooLoader:', error, info)
    this.setState({ componentStack: info.componentStack ?? null })
  }

  /**
   * A single copy-pasteable block with everything useful for diagnosing an
   * error we can't reproduce: the message, the URL, the browser, and both
   * stacks — copyable without opening DevTools.
   */
  private buildDetails(): string {
    const { error, componentStack } = this.state
    return [
      `Mensaje: ${error?.message ?? '(desconocido)'}`,
      `URL: ${window.location.href}`,
      `Navegador: ${navigator.userAgent}`,
      `Fecha: ${new Date().toISOString()}`,
      error?.stack ? `\nStack:\n${error.stack}` : '',
      componentStack ? `\nComponente:\n${componentStack}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  render() {
    if (this.state.error) {
      const details = this.buildDetails()
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-accent-ink">{i18n.t('errorBoundary.title')}</h1>
          <p className="max-w-md text-muted">{i18n.t('errorBoundary.body')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:opacity-90"
          >
            {i18n.t('errorBoundary.reload')}
          </button>

          <details className="mt-6 w-full max-w-lg text-left">
            <summary className="cursor-pointer text-xs text-faint hover:text-muted">
              {i18n.t('errorBoundary.details')}
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-elevated p-3 text-[11px] leading-relaxed text-muted">
              {details}
            </pre>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(details).then(
                  () => {
                    this.setState({ copied: true })
                    setTimeout(() => this.setState({ copied: false }), 2000)
                  },
                  () => {
                    /* clipboard blocked — the text above can still be selected manually */
                  },
                )
              }}
              className="mt-2 rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:bg-elevated"
            >
              {this.state.copied ? i18n.t('errorBoundary.copied') : i18n.t('errorBoundary.copy')}
            </button>
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
