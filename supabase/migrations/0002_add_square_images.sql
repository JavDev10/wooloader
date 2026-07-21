-- Per-product toggle: when true, every image uploaded for the product is
-- center-cropped to a fixed square (see SQUARE_IMAGE_SIZE in the frontend's
-- imageValidation.ts). Defaults to false so existing products keep aspect-ratio
-- images. Idempotent so it's safe to re-run.
alter table public.products
  add column if not exists square_images boolean not null default false;
