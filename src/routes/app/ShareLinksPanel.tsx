import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Link2, Lock, RotateCcw, Ban, Copy } from 'lucide-react'
import { createShareLink, listShareLinks, shareLinkUrl, updateShareLink } from '@/lib/api/shareLinks'
import { useLimits } from '@/context/LimitsContext'
import { inputClass } from '@/components/ui/Field'
import { CONTACT_EMAIL } from '@/routes/legal/legalMeta'
import { effectiveLinkStatus, type ShareLink } from '@/lib/types'

const EXPIRY_OPTIONS = [7, 14, 30, 0] as const // days; 0 = never
const DEFAULT_EXPIRY_DAYS = 14

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

async function copyLink(token: string, t: (key: string) => string) {
  const url = shareLinkUrl(token)
  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('shareLinks.copied'))
  } catch {
    // Clipboard can be blocked (permissions, insecure context): show it instead.
    toast(url)
  }
}

/**
 * Owner-side management of a catalog's client links. Needs the developer plan
 * on the hosted instance (the DB rejects link creation otherwise); on a
 * self-hosted install everyone has it.
 */
export function ShareLinksPanel({ catalogId }: { catalogId: string }) {
  const { t } = useTranslation()
  const { plan, loaded, maxProductsPerLink } = useLimits()
  const [links, setLinks] = useState<ShareLink[] | null>(null)
  const [label, setLabel] = useState('')
  const [maxProducts, setMaxProducts] = useState(Math.min(100, maxProductsPerLink))
  const [expiryDays, setExpiryDays] = useState<number>(DEFAULT_EXPIRY_DAYS)
  const [creating, setCreating] = useState(false)

  const isDeveloper = plan === 'developer'

  useEffect(() => {
    setMaxProducts((current) => Math.min(current, maxProductsPerLink))
  }, [maxProductsPerLink])

  useEffect(() => {
    if (!loaded || !isDeveloper) return
    listShareLinks(catalogId)
      .then(setLinks)
      .catch(() => setLinks([]))
  }, [catalogId, loaded, isDeveloper])

  if (!loaded) return null

  if (!isDeveloper) {
    return (
      <section className="mt-10 rounded-lg border border-dashed border-line p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Lock size={16} className="text-faint" /> {t('shareLinks.title')}
        </h2>
        <p className="mt-2 text-sm text-muted">{t('shareLinks.upsell')}</p>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('shareLinks.upsellSubject'))}`}
          className="mt-3 inline-block text-sm text-link hover:underline"
        >
          {t('shareLinks.upsellCta')}
        </a>
      </section>
    )
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const link = await createShareLink({
        catalogId,
        label: label.trim(),
        maxProducts,
        expiresAt: expiryDays > 0 ? daysFromNow(expiryDays) : null,
      })
      setLinks((prev) => [link, ...(prev ?? [])])
      setLabel('')
      await copyLink(link.token, t)
    } catch {
      toast.error(t('shareLinks.createError'))
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(link: ShareLink, patch: Parameters<typeof updateShareLink>[1]) {
    try {
      const updated = await updateShareLink(link.id, patch)
      setLinks((prev) => (prev ?? []).map((l) => (l.id === updated.id ? updated : l)))
    } catch {
      toast.error(t('shareLinks.updateError'))
    }
  }

  function reopen(link: ShareLink) {
    // An expired link gets a fresh expiry so reopening actually reopens it.
    const expired = effectiveLinkStatus(link) === 'expired'
    handleUpdate(link, {
      status: 'open',
      ...(expired ? { expires_at: daysFromNow(DEFAULT_EXPIRY_DAYS) } : {}),
    })
  }

  return (
    <section className="mt-10 rounded-lg border border-line p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Link2 size={16} className="text-accent-ink" /> {t('shareLinks.title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('shareLinks.intro')}</p>

      <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t('shareLinks.label')}</span>
          <input
            className={inputClass}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('shareLinks.labelPlaceholder')}
            maxLength={80}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t('shareLinks.maxProducts')}</span>
          <input
            type="number"
            min={1}
            max={maxProductsPerLink}
            className={`${inputClass} sm:w-24`}
            value={maxProducts}
            onChange={(e) =>
              setMaxProducts(Math.max(1, Math.min(maxProductsPerLink, Number(e.target.value) || 1)))
            }
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted">{t('shareLinks.expiry')}</span>
          <select
            className={`${inputClass} sm:w-36`}
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
          >
            {EXPIRY_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days > 0 ? t('shareLinks.expiryDays', { count: days }) : t('shareLinks.expiryNever')}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-accent px-4 py-2 font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
        >
          {creating ? '…' : t('shareLinks.create')}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        {links === null && <p className="text-sm text-faint">{t('common.loading')}</p>}
        {links?.length === 0 && <p className="text-sm text-faint">{t('shareLinks.empty')}</p>}
        {links?.map((link) => (
          <LinkRow
            key={link.id}
            link={link}
            onCopy={() => copyLink(link.token, t)}
            onRevoke={() => handleUpdate(link, { status: 'revoked' })}
            onReopen={() => reopen(link)}
          />
        ))}
      </div>
    </section>
  )
}

const STATUS_STYLE = {
  open: 'bg-emerald-500/15 text-emerald-500',
  submitted: 'bg-link/15 text-link',
  expired: 'bg-amber-400/15 text-amber-500',
  revoked: 'bg-elevated text-faint',
} as const

function LinkRow({
  link,
  onCopy,
  onRevoke,
  onReopen,
}: {
  link: ShareLink
  onCopy: () => void
  onRevoke: () => void
  onReopen: () => void
}) {
  const { t, i18n } = useTranslation()
  const status = effectiveLinkStatus(link)
  const date = (iso: string) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(iso))

  const details = [
    t('shareLinks.upTo', { count: link.max_products }),
    status === 'submitted' && link.submitted_at
      ? t('shareLinks.submittedOn', { date: date(link.submitted_at) })
      : link.expires_at
        ? t('shareLinks.expiresOn', { date: date(link.expires_at) })
        : t('shareLinks.noExpiry'),
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{link.label || t('shareLinks.noLabel')}</span>
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status]}`}>
            {t(`shareLinks.status.${status}`)}
          </span>
        </div>
        <p className="text-xs text-faint">{details.join(' · ')}</p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {status === 'open' ? (
          <>
            <button type="button" onClick={onCopy} className="flex items-center gap-1 text-link hover:underline">
              <Copy size={14} /> {t('shareLinks.copy')}
            </button>
            <button type="button" onClick={onRevoke} className="flex items-center gap-1 text-faint hover:text-red-400">
              <Ban size={14} /> {t('shareLinks.revoke')}
            </button>
          </>
        ) : (
          <button type="button" onClick={onReopen} className="flex items-center gap-1 text-link hover:underline">
            <RotateCcw size={14} /> {t('shareLinks.reopen')}
          </button>
        )}
      </div>
    </div>
  )
}
