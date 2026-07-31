-- Cap images per product on the hosted instance. Storage (product images) is the
-- binding resource on Supabase's free tier, so a per-product image cap protects
-- the quota alongside the per-user product/catalog caps from 0006.
--
-- Gated by the same limits_enabled flag, so a self-hosted install (flag off, the
-- default) stays unlimited. Enforced in Postgres so it can't be bypassed.

alter table public.app_config add column if not exists max_images_per_product int not null default 5;

-- Enforce on INSERT and UPDATE: images are appended to an existing product row
-- as they're uploaded, so the count grows via updates, not just inserts.
create or replace function public.enforce_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.limits_enabled
     and jsonb_array_length(coalesce(new.images, '[]'::jsonb)) > cfg.max_images_per_product then
    raise exception 'Limit reached: at most % images per product', cfg.max_images_per_product
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists products_image_limit on public.products;
create trigger products_image_limit
  before insert or update on public.products
  for each row execute function public.enforce_image_limit();
