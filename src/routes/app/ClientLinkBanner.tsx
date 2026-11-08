import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckCircle2, Info } from 'lucide-react'
import { submitSharedCatalog } from '@/lib/api/shareLinks'
import { confirmDialog } from '@/store/confirmDialogStore'
import { effectiveLinkStatus, type ShareLink } from '@/lib/types'

/**
 * What a client (catalog member) sees on top of the shared catalog: how many
 * products they may add, until when, and the "Done" button. Once the link is
 * closed it explains why the catalog is now read-only.
 */
export function ClientLinkBanner({
  catalogId,
  link,
  productCount,
  onSubmitted,
}: {
  catalogId: string
  link: ShareLink | null
  productCount: number
  onSubmitted: () => void
}) {
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)

  if (!link) {
    return <Notice>{t('clientLink.noLink')}</Notice>
  }

  const status = effectiveLinkStatus(link)
  const date = (iso: string) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(iso))

  if (status !== 'open') {
    const message =
      status === 'submitted'
        ? t('clientLink.submitted', { date: date(link.submitted_at ?? link.updated_at) })
        : status === 'expired'
          ? t('clientLink.expired')
          : t('clientLink.revoked')
    return <Notice>{message}</Notice>
  }

  async function handleSubmit() {
    const ok = await confirmDialog(t('clientLink.confirmSubmit'), {
      confirmLabel: t('clientLink.submit'),
      cancelLabel: t('clientLink.keepEditing'),
    })
    if (!ok) return
    setSubmitting(true)
    try {
      await submitSharedCatalog(catalogId)
      toast.success(t('clientLink.submittedToast'))
      onSubmitted()
    } catch {
      toast.error(t('clientLink.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-md border border-accent/40 bg-accent/5 p-4">
      <p className="flex gap-2 text-sm text-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-accent-ink" />
        <span>
          {link.label ? t('clientLink.introFor', { label: link.label }) : t('clientLink.intro')}{' '}
          {t('clientLink.capacity', { count: productCount, max: link.max_products })}
          {link.expires_at && <> {t('clientLink.until', { date: date(link.expires_at) })}</>}
        </span>
      </p>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || productCount === 0}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-on-accent hover:opacity-90 disabled:opacity-40"
      >
        <CheckCircle2 size={18} /> {submitting ? '…' : t('clientLink.submit')}
      </button>
      <p className="text-center text-xs text-faint">{t('clientLink.submitHint')}</p>
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-md border border-line bg-elevated px-4 py-3 text-sm text-muted">{children}</p>
}
