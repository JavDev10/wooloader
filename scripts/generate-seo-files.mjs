/**
 * Post-build SEO step.
 *
 * Resolves the public site URL and then:
 *  - replaces the __SITE_URL__ token in dist/index.html (canonical, og:url,
 *    og:image, JSON-LD),
 *  - writes dist/robots.txt and dist/sitemap.xml with absolute URLs.
 *
 * The URL comes from VITE_SITE_URL, or Netlify's built-in URL variable (which
 * already points at the custom domain once one is attached — so switching to
 * wooloader.com needs no code change). If neither is set (e.g. a local build),
 * the token becomes empty so the tags degrade to relative URLs instead of
 * pointing at the wrong domain, and the sitemap is skipped.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const DIST = path.resolve('dist')
const INDEX = path.join(DIST, 'index.html')

// Public routes worth indexing. The signed-in area (/app/**) is intentionally
// excluded — it's private and has nothing crawlable.
const ROUTES = ['/', '/login', '/terminos', '/privacidad']

const rawSiteUrl = process.env.VITE_SITE_URL || process.env.URL || ''
const siteUrl = rawSiteUrl.replace(/\/+$/, '') // no trailing slash

if (!existsSync(INDEX)) {
  console.error('[seo] dist/index.html not found — run the build first.')
  process.exit(1)
}

const html = await readFile(INDEX, 'utf8')
await writeFile(INDEX, html.replaceAll('__SITE_URL__', siteUrl), 'utf8')

const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  '# The signed-in app area is private — nothing to index there.',
  'Disallow: /app',
  '',
  ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`, ''] : []),
].join('\n')
await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8')

if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = ROUTES.map(
    (route) =>
      `  <url>\n    <loc>${siteUrl}${route}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`,
  ).join('\n')
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8')
  console.log(`[seo] site URL ${siteUrl} — wrote robots.txt and sitemap.xml (${ROUTES.length} routes)`)
} else {
  console.warn(
    '[seo] No VITE_SITE_URL / URL set — using relative URLs and skipping sitemap.xml. ' +
      'Set VITE_SITE_URL for production builds outside Netlify.',
  )
}
