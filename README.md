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

To run the limited public showcase (`VITE_DEMO_MODE=true`): enable **Allow anonymous sign-ins**
in the Supabase dashboard (**Authentication → Providers**). Visitors then get a real anonymous
`auth.uid()`, so the same row-level security isolates them from each other. A per-catalog product
cap (`VITE_DEMO_MAX_PRODUCTS`) and ad slots apply only in demo mode. Server-side cap enforcement
and the 24h anonymous-data cleanup job land in a later phase.

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
