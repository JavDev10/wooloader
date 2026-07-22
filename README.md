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

`VITE_DEMO_MODE=true` shows an anonymous "try it" entry on the login page — enable **Allow
anonymous sign-ins** in the Supabase dashboard (**Authentication → Providers**). Visitors get a
real anonymous `auth.uid()`, so the same row-level security isolates them from each other.

### Per-user limits (free tier)

Limits are **per user, across all their catalogs** (a free tier for the hosted version) and apply
to every account — anonymous and registered alike. They're enforced in Postgres (can't be bypassed
via the API — migration `0006`) and their values live in the single-row `app_config` table, which
the app reads to show usage. Turn them on and set the caps from the SQL editor:

```sql
update public.app_config
set limits_enabled = true, max_products_per_user = 50, max_catalogs_per_user = 10;
```

On a normal self-hosted install leave `limits_enabled = false` (the default) — no limits apply, and
the app fails open if `app_config` isn't reachable. Migration `0004` also restricts the
`product-images` bucket to image types under 3 MB.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
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
