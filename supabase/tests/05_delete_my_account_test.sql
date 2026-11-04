-- Launch gate — the member-invoked deletion path (Addendum A B13).
--
-- pgTAP 03 proves the CASCADE fires when auth.users loses a row. This proves
-- the FUNCTION a member calls to cause that is safe to expose: it takes no
-- argument (so there is no uid to forge), it is reachable by authenticated
-- members only, and anon cannot execute it at all.
--
-- SCOPE OF THIS FILE — read before trusting a green run. What follows checks
-- SHAPE and PRIVILEGE only. It does NOT prove the behavioural claim "deletes
-- the caller and nobody else", because that needs two real authenticated
-- sessions. That proof lives in tests/db/rights-delete-account.test.ts, which
-- runs against the live local stack and (a) deletes Alice while asserting Bob's
-- row counts are unchanged, and (b) tries five plausible uid argument names
-- aimed at Bob and asserts each one fails. A green `supabase test db` alone is
-- therefore NOT sufficient evidence that deletion is correctly scoped.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- ---------------------------------------------------------------------------
-- Shape: the function exists, returns void, and takes NO arguments.
-- The no-argument signature IS the security model — assert it explicitly, so
-- that adding a parameter later has to break a test rather than slip through.
-- ---------------------------------------------------------------------------
select has_function('public', 'delete_my_account', '{}'::text[],
  'delete_my_account() exists and takes no arguments');

select is(
  (select count(*)::int from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'delete_my_account'),
  1, 'exactly one delete_my_account — no overload accepts a target uid');

select is(
  (select p.pronargs::int from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'delete_my_account'),
  0, 'delete_my_account takes zero arguments');

-- ---------------------------------------------------------------------------
-- Privilege: SECURITY DEFINER with a pinned search_path, matching the two
-- existing definer functions.
-- ---------------------------------------------------------------------------
select is(
  (select p.prosecdef from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'delete_my_account'),
  true, 'delete_my_account is SECURITY DEFINER');

select ok(
  (select p.proconfig::text from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'delete_my_account')
  like '%search_path=%',
  'delete_my_account pins search_path');

-- ---------------------------------------------------------------------------
-- Grants: authenticated may execute; anon and public may NOT.
-- ---------------------------------------------------------------------------
select ok(
  has_function_privilege('authenticated', 'public.delete_my_account()', 'execute'),
  'authenticated may execute delete_my_account');

select ok(
  not has_function_privilege('anon', 'public.delete_my_account()', 'execute'),
  'anon may NOT execute delete_my_account');

-- ---------------------------------------------------------------------------
-- Behaviour: with no JWT there is no auth.uid(), and the function refuses
-- rather than deleting something arbitrary.
-- ---------------------------------------------------------------------------
select throws_ok(
  'select public.delete_my_account()',
  '28000',
  'not authenticated',
  'delete_my_account refuses an unauthenticated caller');

select * from finish();
rollback;
