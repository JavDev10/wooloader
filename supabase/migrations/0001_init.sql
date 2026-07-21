-- WooLoader — initial schema (single-user, multi-catalog).
--
-- Model: every row belongs to one authenticated user (auth.uid()). There is no
-- team/client link flow and no anonymous-token access — each user reads/writes
-- their own catalogs and products directly through RLS. Anonymous sign-ins
-- (used by the hosted demo) also get a real auth.uid() with role `authenticated`,
-- so the exact same policies isolate demo visitors from each other with no extra
-- code path.

create extension if not exists pgcrypto;

-- =========================================================================
-- Tables
-- =========================================================================

-- A catalog is one import project. A user can have many.
create table public.catalogs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null default 'Untitled catalog',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index catalogs_user_id_idx on public.catalogs (user_id, created_at);

create table public.products (
  id                     uuid primary key default gen_random_uuid(),
  catalog_id             uuid not null references public.catalogs(id) on delete cascade,
  local_order            int not null default 0,
  name                   text not null default '',
  description            text not null default '',
  short_description      text not null default '',
  category               text not null default '',
  subcategory            text not null default '',
  weight                 numeric,
  dimensions             jsonb,                        -- {length, width, height} in cm
  no_physical_dimensions boolean not null default false,
  is_quote_only          boolean not null default false,
  regular_price          numeric,
  sale_price             numeric,
  price_tiers            jsonb not null default '[]',  -- [{min_qty, price}]
  attributes             jsonb not null default '[]',  -- [{name, values: string[]}]
  variants               jsonb not null default '[]',  -- [{id, attribute_values, price, sale_price, stock, sku, image_url, weight, dimensions, excluded}]
  images                 jsonb not null default '[]',  -- [{url, storage_path, is_primary, sort_order}]
  stock                  numeric,
  sku                    text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index products_catalog_id_idx on public.products (catalog_id, local_order);

-- =========================================================================
-- updated_at maintenance
-- =========================================================================

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger catalogs_set_updated_at
  before update on public.catalogs
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =========================================================================
-- RLS: deny-by-default; each authenticated user sees only their own rows.
-- Products are scoped through their catalog's owner, so there's no separate
-- user_id column to keep in sync on the products table.
-- =========================================================================

alter table public.catalogs enable row level security;
alter table public.products enable row level security;

create policy catalogs_owner on public.catalogs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy products_owner on public.products
  for all to authenticated
  using (
    exists (
      select 1 from public.catalogs c
      where c.id = products.catalog_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.catalogs c
      where c.id = products.catalog_id and c.user_id = auth.uid()
    )
  );

-- =========================================================================
-- Storage: public bucket for product images.
-- Path convention: {user_id}/{catalog_id}/{product_id}/{uuid}.{ext}
-- The first path segment (the owner's auth.uid()) is what isolates uploads.
-- auth.uid() is not a secret, so it's fine for it to appear in public URLs.
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy product_images_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy product_images_update_own on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy product_images_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No SELECT policy needed: the bucket is public, so image GETs are served
-- directly and don't go through RLS.
