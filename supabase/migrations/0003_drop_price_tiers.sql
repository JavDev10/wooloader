-- The per-quantity price tiers feature was removed. The column is no longer
-- read or written by the app (it was only ever a niche, snippet-dependent
-- extra), so drop it. Safe to run whenever — the app works with or without it.
alter table public.products
  drop column if exists price_tiers;
