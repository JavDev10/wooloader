-- HOSTED INSTANCE ONLY — not a migration. Self-hosted installs that don't offer
-- "Try without an account" (VITE_DEMO_MODE=false) never create guest users and
-- don't need this.
--
-- Schedules the cleanup-anonymous-users Edge Function every hour, so guest
-- users (and their catalogs, products and images) are deleted ~24 h after they
-- were created. Run this once in the SQL editor, after:
--   1. applying migration 0010_list_expired_anonymous_users.sql,
--   2. deploying the function with JWT verification off:
--        supabase functions deploy cleanup-anonymous-users --no-verify-jwt
--   3. setting its secret (a long random string):
--        supabase secrets set CLEANUP_SECRET=<secret>
--
-- Replace the two placeholders below. They're kept in Supabase Vault rather
-- than in the job's SQL, so they don't show up in cron.job.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
select vault.create_secret('<same value as CLEANUP_SECRET>', 'cleanup_secret');

select cron.schedule(
  'cleanup-anonymous-users',
  '15 * * * *', -- minute 15 of every hour
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/cleanup-anonymous-users',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cleanup-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);

-- Check recent runs (responses are kept ~6 h):
--   select status_code, content, created from net._http_response order by created desc limit 5;
-- Run it right now instead of waiting for the hour: copy the
-- `select net.http_post(...)` statement above and run it on its own.
-- Remove the schedule:
--   select cron.unschedule('cleanup-anonymous-users');
