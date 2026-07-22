-- Redesign the limits: from a per-catalog demo cap to per-USER totals that apply
-- to every account on the instance (a free tier for the hosted version), not
-- just anonymous demo visitors. Still gated by a config flag, so a self-hosted
-- install (flag off, the default) stays unlimited.
--
-- Enforced in Postgres (can't be bypassed via the API). The limit *values* are
-- not secret, so they're made readable — the app reads them to show usage.

-- ---- Config: rename the gate, add the per-user product cap, drop the old one.
-- Defaults (25 products / 3 catalogs per user) are sized for Supabase's free
-- tier, where the 1 GB Storage quota (product images) is the binding limit.
alter table public.app_config rename column demo_mode to limits_enabled;
alter table public.app_config add column if not exists max_products_per_user int not null default 25;
alter table public.app_config alter column max_catalogs_per_user set default 3;
alter table public.app_config drop column if exists max_products_per_catalog;

-- Move the existing singleton row to the new catalog default (it was 10 from
-- migration 0004), unless an admin already changed it to something else.
update public.app_config set max_catalogs_per_user = 3 where max_catalogs_per_user = 10;

-- Let anyone read the single config row (limit values + flag) and their own
-- usage. There's still no insert/update/delete policy, so values can only be
-- changed from the SQL editor.
drop policy if exists app_config_read on public.app_config;
create policy app_config_read on public.app_config for select to anon, authenticated using (true);

-- ---- Replace the enforcement triggers.
drop trigger if exists products_demo_cap on public.products;
drop function if exists public.enforce_demo_product_cap();
drop trigger if exists catalogs_demo_cap on public.catalogs;
drop function if exists public.enforce_demo_catalog_cap();

-- Total products across ALL of the owner's catalogs. Count excludes the row's
-- own id, so re-saving (upsert) an existing product at the limit still works.
create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
  cnt int;
  v_user uuid;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.limits_enabled then
    select user_id into v_user from public.catalogs where id = new.catalog_id;
    select count(*) into cnt
    from public.products p
    join public.catalogs c on c.id = p.catalog_id
    where c.user_id = v_user and p.id is distinct from new.id;
    if cnt >= cfg.max_products_per_user then
      raise exception 'Limit reached: at most % products per account', cfg.max_products_per_user
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger products_limit
  before insert on public.products
  for each row execute function public.enforce_product_limit();

-- Total catalogs per user.
create or replace function public.enforce_catalog_limit()
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
  if cfg.limits_enabled then
    select count(*) into cnt
    from public.catalogs
    where user_id = new.user_id and id is distinct from new.id;
    if cnt >= cfg.max_catalogs_per_user then
      raise exception 'Limit reached: at most % catalogs per account', cfg.max_catalogs_per_user
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create trigger catalogs_limit
  before insert on public.catalogs
  for each row execute function public.enforce_catalog_limit();
