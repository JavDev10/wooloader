-- Security hardening: server-side demo caps + storage bucket restrictions.
--
-- (1) The frontend enforces the demo product cap only in the UI, which anyone
--     with the (public) anon key can bypass by calling PostgREST directly. This
--     adds a Postgres-level cap so the limit actually holds. It's gated on an
--     `app_config.demo_mode` flag, so a normal self-hosted install (demo_mode
--     = false, the default) is completely unaffected — the triggers are no-ops.
--
-- (2) The product-images bucket accepted any file type and size. We restrict it
--     to images under a fixed size so it can't be abused to host arbitrary
--     files (e.g. HTML/malware) on the public storage domain.

-- =========================================================================
-- (1) Instance config + demo caps
-- =========================================================================

-- Single-row config table. Invisible to the API (RLS on, no policies); read
-- only by the SECURITY DEFINER triggers below. Change values from the SQL
-- editor (runs as the table owner, which bypasses RLS):
--   update public.app_config set demo_mode = true;   -- on the hosted demo
create table if not exists public.app_config (
  id                       boolean primary key default true,
  demo_mode                boolean not null default false,
  max_products_per_catalog int not null default 15,
  max_catalogs_per_user    int not null default 10,
  constraint app_config_singleton check (id)
);

insert into public.app_config (id) values (true) on conflict (id) do nothing;

alter table public.app_config enable row level security;
-- Deliberately no policies: the anon/authenticated API roles can neither read
-- nor write this table. Only the definer-rights triggers see it.

-- Rejects a new product when its catalog is already at the demo cap. Counting
-- excludes the row's own id so re-saving an existing product (upsert → update)
-- at the cap is still allowed; only genuinely new rows past the cap are blocked.
create or replace function public.enforce_demo_product_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
  cnt int;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.demo_mode then
    select count(*) into cnt
    from public.products
    where catalog_id = new.catalog_id and id is distinct from new.id;
    if cnt >= cfg.max_products_per_catalog then
      raise exception 'Demo limit reached: at most % products per catalog', cfg.max_products_per_catalog
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_demo_cap on public.products;
create trigger products_demo_cap
  before insert on public.products
  for each row execute function public.enforce_demo_product_cap();

-- Same idea for catalogs per user.
create or replace function public.enforce_demo_catalog_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
  cnt int;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.demo_mode then
    select count(*) into cnt
    from public.catalogs
    where user_id = new.user_id and id is distinct from new.id;
    if cnt >= cfg.max_catalogs_per_user then
      raise exception 'Demo limit reached: at most % catalogs per user', cfg.max_catalogs_per_user
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists catalogs_demo_cap on public.catalogs;
create trigger catalogs_demo_cap
  before insert on public.catalogs
  for each row execute function public.enforce_demo_catalog_cap();

-- =========================================================================
-- (2) Storage bucket restrictions
-- =========================================================================

-- Cap uploads at 3 MB and allow only image types. The app already re-encodes
-- every image to WebP client-side (well under this), so this only constrains
-- abusive direct uploads. Because the bucket serves objects with their stored
-- content-type, restricting to image/* means a file uploaded here can never be
-- served as executable HTML even if its bytes are HTML.
update storage.buckets
set file_size_limit = 3145728,
    allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
where id = 'product-images';
