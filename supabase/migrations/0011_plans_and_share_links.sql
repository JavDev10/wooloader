-- Plans (free / developer) and client share links.
--
-- A developer shares a catalog with a client through a link. Whoever opens the
-- link (usually as a guest, no account) becomes a MEMBER of that catalog and can
-- add/edit its products — but only while the link is open and not expired, and
-- only up to the link's product cap. "Done" (submit) closes the link; the owner
-- can revoke or reopen it. Members never own the products: they belong to the
-- catalog, so a guest member deleted by the 24 h cleanup loses nothing — the
-- client reopens the link and carries on.
--
-- Plans only matter on the hosted instance (app_config.limits_enabled = true).
-- With limits off — every self-hosted install by default — everyone gets every
-- feature, developer ones included.

-- =========================================================================
-- Plans
-- =========================================================================

-- One row per user who has a non-default plan. No row = 'free'. There's no
-- write policy: plans are assigned from the SQL editor (or, later, by a
-- payments webhook running as the service role):
--   insert into public.profiles (user_id, plan) values ('<uuid>', 'developer')
--   on conflict (user_id) do update set plan = excluded.plan;
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  plan       text not null default 'free' check (plan in ('free', 'developer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy profiles_read_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Developer-plan limits (the free ones are the existing max_* columns), plus
-- the cap a developer can put on a single share link.
alter table public.app_config add column if not exists dev_max_products_per_user int not null default 300;
alter table public.app_config add column if not exists dev_max_catalogs_per_user int not null default 10;
alter table public.app_config add column if not exists max_products_per_link int not null default 100;

-- The plan that actually applies to `uid`: 'developer' for everyone when limits
-- are off (self-host), otherwise their profile's plan.
create or replace function public.effective_plan(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not coalesce((select limits_enabled from public.app_config limit 1), false) then 'developer'
    else coalesce((select plan from public.profiles where user_id = uid), 'free')
  end;
$$;

-- The caller's own effective plan, for the UI.
create or replace function public.my_plan()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select public.effective_plan(auth.uid());
$$;

-- =========================================================================
-- Per-user limits now depend on the owner's plan (replaces 0006's functions;
-- the triggers keep pointing at them).
-- =========================================================================

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
  cnt int;
  v_owner uuid;
  v_cap int;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.limits_enabled then
    -- The catalog OWNER's quota, even when a client (member) adds the product.
    select user_id into v_owner from public.catalogs where id = new.catalog_id;
    v_cap := case when public.effective_plan(v_owner) = 'developer'
                  then cfg.dev_max_products_per_user else cfg.max_products_per_user end;
    select count(*) into cnt
    from public.products p
    join public.catalogs c on c.id = p.catalog_id
    where c.user_id = v_owner and p.id is distinct from new.id;
    if cnt >= v_cap then
      raise exception 'Limit reached: at most % products per account', v_cap
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_catalog_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
  cnt int;
  v_cap int;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.limits_enabled then
    v_cap := case when public.effective_plan(new.user_id) = 'developer'
                  then cfg.dev_max_catalogs_per_user else cfg.max_catalogs_per_user end;
    select count(*) into cnt
    from public.catalogs
    where user_id = new.user_id and id is distinct from new.id;
    if cnt >= v_cap then
      raise exception 'Limit reached: at most % catalogs per account', v_cap
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

-- =========================================================================
-- Share links and memberships
-- =========================================================================

create table if not exists public.share_links (
  id           uuid primary key default gen_random_uuid(),
  catalog_id   uuid not null references public.catalogs(id) on delete cascade,
  -- The secret in the URL (/c/<token>): 128 random bits, unguessable.
  token        text not null unique default replace(gen_random_uuid()::text, '-', ''),
  -- Who it's for, e.g. the client's name. Shown to the owner and the client.
  label        text not null default '',
  max_products int  not null default 100 check (max_products between 1 and 1000),
  expires_at   timestamptz,  -- null = never expires
  status       text not null default 'open' check (status in ('open', 'submitted', 'revoked')),
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists share_links_catalog_id_idx on public.share_links (catalog_id);

create trigger share_links_set_updated_at
  before update on public.share_links
  for each row execute function public.set_updated_at();

create table if not exists public.catalog_members (
  catalog_id uuid not null references public.catalogs(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  link_id    uuid not null references public.share_links(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (catalog_id, user_id)
);
create index if not exists catalog_members_user_id_idx on public.catalog_members (user_id);
create index if not exists catalog_members_link_id_idx on public.catalog_members (link_id);

-- =========================================================================
-- Access helpers. SECURITY DEFINER so policies can use them without RLS
-- recursion (catalogs → members → links → catalogs).
-- =========================================================================

create or replace function public.is_catalog_owner(p_catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.catalogs where id = p_catalog_id and user_id = auth.uid());
$$;

create or replace function public.is_catalog_member(p_catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.catalog_members where catalog_id = p_catalog_id and user_id = auth.uid()
  );
$$;

-- A member may write only while the link they joined through is open and not expired.
create or replace function public.member_can_edit(p_catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catalog_members m
    join public.share_links l on l.id = m.link_id
    where m.catalog_id = p_catalog_id
      and m.user_id = auth.uid()
      and l.status = 'open'
      and (l.expires_at is null or l.expires_at > now())
  );
$$;

create or replace function public.can_edit_catalog(p_catalog_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_catalog_owner(p_catalog_id) or public.member_can_edit(p_catalog_id);
$$;

-- =========================================================================
-- RLS
-- =========================================================================

-- Catalogs: the owner policy from 0001 stays (full access). Members can read.
drop policy if exists catalogs_member_read on public.catalogs;
create policy catalogs_member_read on public.catalogs
  for select to authenticated
  using (public.is_catalog_member(id));

-- Products: owner OR member. Members read while they're members (also after
-- "done", read-only), and write only while their link is open.
drop policy if exists products_owner on public.products;
create policy products_read on public.products
  for select to authenticated
  using (public.is_catalog_owner(catalog_id) or public.is_catalog_member(catalog_id));
create policy products_insert on public.products
  for insert to authenticated
  with check (public.can_edit_catalog(catalog_id));
create policy products_update on public.products
  for update to authenticated
  using (public.can_edit_catalog(catalog_id))
  with check (public.can_edit_catalog(catalog_id));
create policy products_delete on public.products
  for delete to authenticated
  using (public.can_edit_catalog(catalog_id));

-- Share links: the catalog owner manages them; creating one needs the
-- developer plan. Members can read the link they joined through.
alter table public.share_links enable row level security;
create policy share_links_owner_read on public.share_links
  for select to authenticated
  using (public.is_catalog_owner(catalog_id));
create policy share_links_member_read on public.share_links
  for select to authenticated
  using (exists (
    select 1 from public.catalog_members m where m.link_id = share_links.id and m.user_id = (select auth.uid())
  ));
create policy share_links_owner_insert on public.share_links
  for insert to authenticated
  with check (public.is_catalog_owner(catalog_id) and public.my_plan() = 'developer');
create policy share_links_owner_update on public.share_links
  for update to authenticated
  using (public.is_catalog_owner(catalog_id))
  with check (public.is_catalog_owner(catalog_id));
create policy share_links_owner_delete on public.share_links
  for delete to authenticated
  using (public.is_catalog_owner(catalog_id));

-- Memberships: created only through redeem_share_link (no insert policy).
-- Members see their own; owners see and can remove members of their catalogs.
alter table public.catalog_members enable row level security;
create policy catalog_members_read on public.catalog_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_catalog_owner(catalog_id));
create policy catalog_members_owner_delete on public.catalog_members
  for delete to authenticated
  using (public.is_catalog_owner(catalog_id));

-- =========================================================================
-- Per-link product cap: when a MEMBER adds a product, the catalog can't go
-- past their link's max_products. The owner isn't capped by links (only by
-- their account quota, above).
-- =========================================================================

create or replace function public.enforce_link_product_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cap int;
  cnt int;
begin
  if public.is_catalog_owner(new.catalog_id) then
    return new;
  end if;
  select l.max_products into v_cap
  from public.catalog_members m
  join public.share_links l on l.id = m.link_id
  where m.catalog_id = new.catalog_id and m.user_id = auth.uid();
  if v_cap is not null then
    select count(*) into cnt
    from public.products
    where catalog_id = new.catalog_id and id is distinct from new.id;
    if cnt >= v_cap then
      raise exception 'Limit reached: at most % products for this link', v_cap
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_link_cap on public.products;
create trigger products_link_cap
  before insert on public.products
  for each row execute function public.enforce_link_product_cap();

-- On the hosted instance a link can't promise more than max_products_per_link.
create or replace function public.enforce_link_max_products()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cfg public.app_config;
begin
  select * into cfg from public.app_config limit 1;
  if cfg.limits_enabled and new.max_products > cfg.max_products_per_link then
    raise exception 'Limit reached: a link can allow at most % products', cfg.max_products_per_link
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists share_links_max_products on public.share_links;
create trigger share_links_max_products
  before insert or update of max_products on public.share_links
  for each row execute function public.enforce_link_max_products();

-- =========================================================================
-- RPCs for the client flow
-- =========================================================================

-- What the /c/<token> page shows BEFORE anyone signs in (so a dead link
-- doesn't create a guest user). Only the token holder can call it usefully.
-- Status is 'expired' when an open link is past its date.
create or replace function public.get_share_link(p_token text)
returns table (catalog_name text, label text, status text, expires_at timestamptz, max_products int)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name,
         l.label,
         case when l.status = 'open' and l.expires_at is not null and l.expires_at <= now()
              then 'expired' else l.status end,
         l.expires_at,
         l.max_products
  from public.share_links l
  join public.catalogs c on c.id = l.catalog_id
  where l.token = p_token;
$$;

-- Joins the caller to the link's catalog and returns the catalog id. The owner
-- just gets the id back. A closed link still lets an existing member back in
-- (read-only, enforced by RLS) but turns away newcomers.
create or replace function public.redeem_share_link(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link public.share_links;
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;
  select * into v_link from public.share_links where token = p_token;
  if not found then
    raise exception 'link_not_found' using errcode = 'P0002';
  end if;
  select user_id into v_owner from public.catalogs where id = v_link.catalog_id;
  if v_owner = auth.uid() then
    return v_link.catalog_id;
  end if;
  if exists (select 1 from public.catalog_members
             where catalog_id = v_link.catalog_id and user_id = auth.uid() and link_id = v_link.id) then
    return v_link.catalog_id;
  end if;
  if v_link.status <> 'open' or (v_link.expires_at is not null and v_link.expires_at <= now()) then
    raise exception 'link_closed' using errcode = 'P0001';
  end if;
  insert into public.catalog_members (catalog_id, user_id, link_id)
  values (v_link.catalog_id, auth.uid(), v_link.id)
  on conflict (catalog_id, user_id) do update set link_id = excluded.link_id;
  return v_link.catalog_id;
end;
$$;

-- "Done": the client closes their own link, which makes the catalog read-only
-- for them. Only the link's members can do it; the owner uses a plain update.
create or replace function public.submit_shared_catalog(p_catalog_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link_id uuid;
begin
  select link_id into v_link_id
  from public.catalog_members
  where catalog_id = p_catalog_id and user_id = auth.uid();
  if v_link_id is null then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  update public.share_links
  set status = 'submitted', submitted_at = now()
  where id = v_link_id and status = 'open';
end;
$$;

revoke all on function public.get_share_link(text) from public;
grant execute on function public.get_share_link(text) to anon, authenticated;
revoke all on function public.redeem_share_link(text) from public, anon;
grant execute on function public.redeem_share_link(text) to authenticated;
revoke all on function public.submit_shared_catalog(uuid) from public, anon;
grant execute on function public.submit_shared_catalog(uuid) to authenticated;
revoke all on function public.my_plan() from public, anon;
grant execute on function public.my_plan() to authenticated;
-- effective_plan takes any user id: keep it internal (triggers and my_plan run
-- as the owner, so they don't need the grant).
revoke all on function public.effective_plan(uuid) from public, anon, authenticated;

-- =========================================================================
-- Storage: images live under {owner}/{catalog}/{product}/…, also when a client
-- uploads them — so the owner can delete them and the guest cleanup (which
-- removes {guest uid}/…) never touches them. Members may write under the owner's
-- folder of a catalog they can currently edit.
-- =========================================================================

-- True when `object_name` is {owner}/{catalog}/… for a catalog the caller can
-- edit as a member. Tolerates malformed paths (returns false, never errors).
create or replace function public.member_can_write_object(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  parts text[] := string_to_array(object_name, '/');
  v_catalog uuid;
begin
  if array_length(parts, 1) < 3 or parts[2] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  v_catalog := parts[2]::uuid;
  return public.member_can_edit(v_catalog)
     and exists (select 1 from public.catalogs where id = v_catalog and user_id::text = parts[1]);
end;
$$;

create policy product_images_insert_member on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.member_can_write_object(name));
create policy product_images_update_member on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.member_can_write_object(name));
create policy product_images_delete_member on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.member_can_write_object(name));
create policy product_images_select_member on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and public.member_can_write_object(name));
