# WooLoader

Open-source, self-hostable tool to **bulk-import products into WooCommerce** through a simple
visual interface. Load your catalog (simple and variable products, images, attributes, price
tiers) and export a CSV compatible with WooCommerce's native product importer.

Generalized fork of a tool originally built for a single agency — see [PLAN.md](PLAN.md) for the
architecture and roadmap.

> **Status:** early development. Phase 1 (CSV export core) is done and tested. The UI, backend
> and hosted demo are in progress.

## Stack

Vite + React 19 + TypeScript · Tailwind CSS v4 · Supabase (Postgres + Storage + Auth) · Zustand ·
Zod · PapaParse. 100% static SPA — no custom Node server.

## Setup

```bash
npm install
cp .env.example .env   # fill in your Supabase credentials
npm run dev
```

### Supabase backend

1. Create a Supabase project (choose the region closest to your users — it can't be changed later).
2. In **Database → SQL Editor**, paste and run each file in `supabase/migrations/` in order.
   `0001_init.sql` creates the `catalogs` and `products` tables, row-level security (each user
   only ever sees their own rows), and the public `product-images` Storage bucket.
3. Put your project URL and anon key (**Project Settings → API**) into `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). These are inlined at build time, so re-run
   the build if they change.
4. Create your owner account: either from the dashboard (**Authentication → Users → Add user**),
   or via the app's sign-up (self-host only). If you host a **public** instance, disable email
   sign-ups afterwards (**Authentication → Providers → Email**) so only you can log in.

### Hosted demo mode

`VITE_DEMO_MODE=true` adds a **"Try without an account"** button to the login page, next to the
normal sign-in — enable **Allow anonymous sign-ins** in the Supabase dashboard
(**Authentication → Sign In / Providers**). Guests get a real anonymous `auth.uid()`, so the same
row-level security isolates them from each other, and the app tells them their data is deleted
after 24 h.

That deletion is done by the `cleanup-anonymous-users` Edge Function, run every hour by `pg_cron`.
It removes each expired guest's images through the Storage API (Storage files can't be deleted with
SQL), then the user — their catalogs and products cascade. To set it up:

1. Apply migration `0010_list_expired_anonymous_users.sql` (part of the normal migrations).
2. Deploy the function and give it a secret (a long random string):

   ```bash
   supabase functions deploy cleanup-anonymous-users --no-verify-jwt
   supabase secrets set CLEANUP_SECRET=<long random string>
   ```

3. Run [`supabase/hosted/schedule_anonymous_cleanup.sql`](supabase/hosted/schedule_anonymous_cleanup.sql)
   in the SQL editor, with your project URL and the same secret filled in.

Optional: `supabase secrets set CLEANUP_TTL_HOURS=48` changes how long guest data lives (also update
`GUEST_TTL_HOURS` in `src/lib/config.ts`, which is what the UI shows).

Every user, guest or registered, can also load a **sample catalog** from the catalogs page: three
products (simple, variable, quote-only) in their language and currency, so there's something to
explore and export right away. It counts toward the per-user limits.

### Per-user limits (free tier)

Limits are **per user, across all their catalogs** (a free tier for the hosted version) and apply
to every account — anonymous and registered alike. They're enforced in Postgres (can't be bypassed
via the API — migration `0006`) and their values live in the single-row `app_config` table, which
the app reads to show usage. Turn them on and set the caps from the SQL editor:

```sql
update public.app_config
set limits_enabled = true, max_products_per_user = 25, max_catalogs_per_user = 3;
```

The `25 / 3` defaults are sized for Supabase's free tier (its 1 GB Storage quota for product images
is the first thing you'll exhaust). Raise them if you disable image uploads or move to a paid plan.

### CAPTCHA (protect anonymous sign-ins from bots)

Optional but recommended for a public demo. Uses **Cloudflare Turnstile** (free):

1. Create a Turnstile widget at the Cloudflare dashboard → you get a **site key** (public) and a
   **secret key**.
2. Put the site key in `VITE_TURNSTILE_SITE_KEY` (build-time env). The login page then renders the
   widget and sends its token with every sign-in / sign-up / anonymous sign-in.
3. In Supabase → **Authentication → Attack Protection**, enable CAPTCHA, choose Turnstile, and paste
   the **secret key**. Supabase then verifies the token server-side.

Leave `VITE_TURNSTILE_SITE_KEY` empty to disable CAPTCHA (self-host). Supabase also applies a
per-IP rate limit to anonymous sign-ins by default (**Authentication → Rate Limits**).

On a normal self-hosted install leave `limits_enabled = false` (the default) — no limits apply, and
the app fails open if `app_config` isn't reachable. Migration `0004` also restricts the
`product-images` bucket to image types under 3 MB.

### SEO

`index.html` carries the title/description, Open Graph and Twitter cards, canonical link and
`SoftwareApplication` structured data. After `vite build`, `scripts/generate-seo-files.mjs` fills in
the absolute site URL and writes `robots.txt` (the private `/app` area is disallowed) and
`sitemap.xml` for the public routes.

The site URL comes from `VITE_SITE_URL`, falling back to Netlify's own `URL` variable — which
already points at the custom domain once one is attached, so **switching to a custom domain needs no
code change**. Without either (e.g. a local build) the tags degrade to relative URLs and the sitemap
is skipped, rather than pointing at the wrong domain.

The link-preview image is `public/og-image.png` (1200×630). Submit the sitemap in Google Search
Console once the domain is live.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build to `dist/` (also generates robots.txt/sitemap.xml)
- `npm run test` — run the test suite (Vitest)
- `npm run lint` — lint (oxlint)

## What works today (phase 1)

The pure export core is ported and covered by tests (`npm test`):

- `src/lib/csv/*` — maps a product to WooCommerce CSV rows (simple + variable/variation),
  builds the full CSV, generates parent SKUs.
- `src/lib/variantCombinations.ts` — cartesian product of attributes + variant reconciliation.
- `src/lib/productValidation.ts` — required-fields check (enforced at export time only).
- `src/lib/priceFormat.ts`, `src/lib/weightFormat.ts` — input parsing/formatting.

## Known follow-ups (see PLAN.md)

- Multi-currency / decimal prices (currently integer-only, zero-decimal currencies).
- i18n (validation messages are currently Spanish).
- Configurable image size constraints (image handling lands with the UI in a later phase).
