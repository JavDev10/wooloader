-- Per-catalog currency, so prices can have decimals (USD 19.99) where the
-- currency has them. A catalog targets one WooCommerce store, and the store has
-- a single currency — like weight_unit (0007), it lives on the catalog.
--
-- The app derives the allowed decimals from the ISO code (CLP: 0, USD: 2…), so
-- the column only stores the code. Any 3-letter code is accepted so the app's
-- list can grow without a migration. Defaults to CLP: existing catalogs were
-- created when prices were whole CLP amounts.
--
-- No change is needed for the prices themselves: regular_price/sale_price are
-- already `numeric`, and variant prices live in the variants jsonb.
alter table public.catalogs
  add column if not exists currency text not null default 'CLP'
  check (currency ~ '^[A-Z]{3}$');
