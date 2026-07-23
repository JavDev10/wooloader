import { useTranslation } from 'react-i18next'
import { ADS_ENABLED } from '@/lib/config'

/**
 * Side ad slot for the hosted instance. Renders nothing unless
 * VITE_ADS_ENABLED=true, so self-host installs never see it.
 *
 * Currently a placeholder sized for a 160x600 "skyscraper". When an ad network
 * is approved (AdSense / EthicalAds), replace the inner placeholder with the
 * network's snippet AND extend the Content-Security-Policy in netlify.toml with
 * the network's script/frame domains — the current CSP will block any ad script
 * until then. If the network uses tracking cookies (AdSense does), a consent
 * banner is also required first (see the privacy policy's future-ads clause).
 */
export function AdSlot({ position }: { position: 'left' | 'right' }) {
  const { t } = useTranslation()
  if (!ADS_ENABLED) return null

  return (
    <aside className="hidden w-40 shrink-0 xl:block" aria-label={t('common.ad')} data-position={position}>
      <div className="sticky top-6 flex h-[600px] w-40 items-center justify-center rounded-md border border-dashed border-line text-xs text-faint">
        {t('common.ad')}
      </div>
    </aside>
  )
}
