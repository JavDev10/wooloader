-- Lists guest (anonymous) users older than a TTL, oldest first. Used by the
-- cleanup-anonymous-users Edge Function, which deletes each one's Storage files
-- (only possible through the Storage API, not SQL) and then the user itself —
-- their catalogs and products go with it through the ON DELETE CASCADE FKs.
--
-- Reads auth.users, so it's SECURITY DEFINER and executable ONLY by the service
-- role: anon/authenticated clients must not be able to enumerate users.
-- Harmless on a self-hosted install that never creates anonymous users.
create or replace function public.list_expired_anonymous_users(ttl_hours int default 24, max_users int default 25)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from auth.users
  where is_anonymous
    and created_at < now() - make_interval(hours => ttl_hours)
  order by created_at
  limit max_users;
$$;

revoke all on function public.list_expired_anonymous_users(int, int) from public, anon, authenticated;
grant execute on function public.list_expired_anonymous_users(int, int) to service_role;
