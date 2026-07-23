-- Per-catalog weight unit (kg or lb). A catalog targets one WooCommerce store,
-- and the store has a single configured weight unit — so the unit lives on the
-- catalog and drives both the editor labels and the exported CSV header
-- (Weight (kg) / Weight (lbs)). Values are NOT converted when the unit changes;
-- it's a label for how the numbers are interpreted.
alter table public.catalogs
  add column if not exists weight_unit text not null default 'kg'
  check (weight_unit in ('kg', 'lb'));
