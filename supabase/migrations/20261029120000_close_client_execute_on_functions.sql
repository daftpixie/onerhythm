-- OneRhythm — close client EXECUTE on two SECURITY DEFINER functions, and make
-- EXECUTE on future functions default-deny for client roles.
--
-- Found 2026-10-29, the first time pgTAP and the db jest project ran since
-- 2026-08-09 (the new CI db job, G11).
--
-- 1. purge_unconfirmed_updates_subscribers(interval) — an ops-only bulk
--    delete. 20260808120000 revoked EXECUTE from PUBLIC and granted it to
--    service_role, intending "service_role only". But the postgres role's
--    default privileges grant EXECUTE on every new function in public to anon
--    and authenticated DIRECTLY, so revoking from PUBLIC removed nothing. Any
--    visitor could trigger the purge. Pinned by 04_marketing_member_separation
--    test 19 and tests/db/updates-throttle.test.ts, which were red.
--
-- 2. has_current_health_consent(p_member uuid) — SECURITY DEFINER, so it reads
--    consent_records past RLS. Callable by anon and by any member with ANY
--    member id, it told the caller whether that member holds current health
--    self-ID consent. Consent state is health data (.claude/rules/privacy.md).
--    Only the health_self_ids policies use it, always with auth.uid(). Fixed
--    two ways, so neither alone is load-bearing:
--      - anon (and PUBLIC) lose EXECUTE. The policies are `to authenticated`,
--        so anon never needs it.
--      - the function answers only for the caller: p_member must equal
--        auth.uid(), otherwise false. The signature is unchanged (db.md: it
--        gains a purpose argument when the first new purpose is built).
--    Pinned by tests/db/consent-oracle.test.ts and 02_consent_gating tests 7-9.
--
-- 3. Default privileges: functions created by postgres in public no longer
--    grant EXECUTE to anon or authenticated. Each new function's migration
--    grants EXECUTE explicitly to the roles that need it, as tables already
--    must (20260708051747, ADR 0005). Existing functions keep their current
--    grants, apart from the two above; the four trigger functions are not
--    callable as RPCs.
--
-- Authorization matrix after this migration (EXECUTE):
--
--   function                               | anon | authenticated | service_role
--   ---------------------------------------+------+---------------+-------------
--   purge_unconfirmed_updates_subscribers  |  -   |       -       |      X
--   has_current_health_consent (self only) |  -   |       X       |      X
--   (all others unchanged)
--
-- Note for later callers: service_role has no auth.uid(), so for it this
-- function now always returns false. A server-side consent check (for example
-- the AI gateway) must not reuse it; it gets the purpose-aware variant db.md
-- plans, with its own caller check.
--
-- Pinned catalog-wide by supabase/tests/06_function_execute_allowlist_test.sql.
--
-- Forward-only: 20260808120000 and 20260601084807 are applied and are not
-- edited.

-- 1. The ops purge: service_role only, as intended.
revoke execute on function public.purge_unconfirmed_updates_subscribers(interval)
  from public, anon, authenticated;
grant execute on function public.purge_unconfirmed_updates_subscribers(interval)
  to service_role;

-- 2. The consent helper answers only about the caller.
create or replace function public.has_current_health_consent(p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p_member = (select auth.uid()), false)
     and exists (
       select 1 from public.consent_records c
       where c.member_id = p_member
         and c.purpose = 'health_self_id'
         and c.withdrawn_at is null
     );
$$;

comment on function public.has_current_health_consent(uuid) is
  'RLS helper for health_self_ids. Answers only for the caller (p_member must '
  'equal auth.uid()); anon holds no EXECUTE. Consent state is health data.';

revoke execute on function public.has_current_health_consent(uuid)
  from public, anon;
grant execute on function public.has_current_health_consent(uuid)
  to authenticated, service_role;

-- 3. Future functions: no client EXECUTE unless a migration grants it.
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
