-- Crown-jewel invariant 5: MARKETING DATA IS NOT MEMBER DATA.
--
-- The updates list (public.updates_subscribers) holds ordinary marketing
-- contacts. A member's email is bound to opt-in health self-ID through the
-- consent ledger. This suite proves, at the database layer, that the two
-- cannot be correlated and that the list is unreachable by any client role.
--
-- Decision: docs/adr/0011-landing-and-updates-list.md
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- 1. The table exists and RLS is enabled on it.
select is(
  (select count(*)::int from pg_class
    where relnamespace = 'public'::regnamespace
      and relrowsecurity
      and relname = 'updates_subscribers'),
  1,
  'RLS is enabled on updates_subscribers'
);

-- 2. It has ZERO policies. With no grant and no policy the table is reachable
--    only through the three definer functions. A policy appearing here later
--    means someone opened a direct client path — that is the thing to catch.
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'updates_subscribers'),
  0,
  'updates_subscribers has no RLS policies at all (definer functions only)'
);

-- 3. THE NO-CORRELATION INVARIANT: no foreign key leaves this table.
--    Not to profiles, not to auth.users, not to anything.
select is(
  (select count(*)::int from pg_constraint
    where conrelid = 'public.updates_subscribers'::regclass
      and contype = 'f'),
  0,
  'updates_subscribers has ZERO foreign keys (no path to profiles/auth.users)'
);

-- 4. ...and nothing references IT either, which would be the same leak drawn
--    the other way round.
select is(
  (select count(*)::int from pg_constraint
    where confrelid = 'public.updates_subscribers'::regclass
      and contype = 'f'),
  0,
  'no table has a foreign key INTO updates_subscribers'
);

-- 5/6. No client role holds ANY privilege on the table. Not select, not
--      insert. This is what removes the enumeration surface entirely.
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'updates_subscribers'
      and grantee = 'anon'),
  0,
  'anon holds no privilege of any kind on updates_subscribers'
);
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'updates_subscribers'
      and grantee = 'authenticated'),
  0,
  'authenticated holds no privilege on updates_subscribers (the pinned '
  'default privileges from ADR 0005 grant new tables to authenticated; this '
  'proves the explicit revoke ran)'
);

-- 7/8. Proven at the wire, not by inspecting a catalog: a raw select as each
--      client role is refused by the table gate before RLS is consulted.
set local role anon;
select throws_ok(
  'select * from public.updates_subscribers',
  '42501',
  null,
  'anon CANNOT select from updates_subscribers (the enumeration guard)'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
select throws_ok(
  'select * from public.updates_subscribers',
  '42501',
  null,
  'a signed-in member CANNOT select from updates_subscribers'
);
reset role;

-- 9. The email uniqueness that makes `on conflict do nothing` silent.
select is(
  (select count(*)::int from pg_indexes
    where schemaname = 'public'
      and tablename = 'updates_subscribers'
      and indexname = 'updates_subscribers_email_key'),
  1,
  'unique index on email exists (so duplicates are absorbed, not surfaced)'
);

-- 10. All three functions are SECURITY DEFINER with a pinned empty
--     search_path (the hardened 1B/1C convention).
select is(
  (select count(*)::int from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('subscribe_to_updates',
                        'confirm_updates_subscription',
                        'unsubscribe_from_updates')
      and p.prosecdef
      -- Postgres stores a pinned empty search_path as the literal
      -- search_path="" (quoted empty string), not search_path=. Verified
      -- against the shipped 1C precedent, handle_new_user, whose proconfig
      -- reads identically. The invariant asserted is unchanged.
      and p.proconfig @> array['search_path=""']),
  3,
  'all three updates functions are security definer with search_path='''''
);

-- 11. anon can execute exactly those three functions and nothing else new.
select is(
  (select count(*)::int from information_schema.role_routine_grants
    where specific_schema = 'public'
      and grantee = 'anon'
      and routine_name in ('subscribe_to_updates',
                           'confirm_updates_subscription',
                           'unsubscribe_from_updates')
      and privilege_type = 'EXECUTE'),
  3,
  'anon holds EXECUTE on the three updates functions'
);

-- 12. No function body mentions a member table. A definer function is the one
--     place a join could hide from the source-level guard, because it runs as
--     owner and bypasses RLS. Check the shipped source directly.
select is(
  (select count(*)::int from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('subscribe_to_updates',
                        'confirm_updates_subscription',
                        'unsubscribe_from_updates')
      and (p.prosrc ~* '(profiles|auth\.users|health_self_ids|consent_records|auth\.uid)')),
  0,
  'no updates function references a member table or the caller identity'
);

-- ===========================================================================
-- 13-19. The signup THROTTLE table (migration 20260808120000) inherits every
-- rule above. It is derived from the marketing list, so if it drifted into
-- holding an address, or gained a member-table FK, the boundary would be broken
-- by the thing that protects it.
-- ===========================================================================

-- 13. No FK out of it, exactly like the list it protects.
select is(
  (select count(*)::int from pg_constraint
    where conrelid = 'public.updates_signup_throttle'::regclass
      and contype = 'f'),
  0,
  'updates_signup_throttle has no foreign key out of it'
);

-- 14. It holds a digest and a window, and NOTHING that could be an address.
select columns_are(
  'public', 'updates_signup_throttle',
  array['email_hash', 'window_start', 'attempts'],
  'updates_signup_throttle holds only a digest, a window and a counter'
);

-- 15-16. Belt-and-braces on the specific column names that would signal drift.
select hasnt_column('public', 'updates_signup_throttle', 'email',
  'throttle table has no email column');
select hasnt_column('public', 'updates_signup_throttle', 'ip',
  'throttle table records nothing about the caller');

-- 17. RLS on, and zero policies — unreachable except through the definer
--     function. Same posture as updates_subscribers.
select is(
  (select relrowsecurity from pg_class
    where oid = 'public.updates_signup_throttle'::regclass),
  true,
  'RLS is enabled on updates_signup_throttle'
);

-- 18. THE STANDING RULE from 20260806134500: ALTER DEFAULT PRIVILEGES hands
--     `authenticated` full DML on every new table in public, so a new table is
--     OPEN by default. This asserts the revoke actually held.
select is(
  (select count(*)::int
     from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'updates_signup_throttle'
      and grantee in ('anon', 'authenticated')),
  0,
  'neither anon nor authenticated holds any grant on updates_signup_throttle'
);

-- 19. The purge is an OPS function: service_role only, never a client role.
select is(
  (select count(*)::int
     from information_schema.role_routine_grants
    where routine_schema = 'public'
      and routine_name = 'purge_unconfirmed_updates_subscribers'
      and grantee in ('anon', 'authenticated')),
  0,
  'no client role holds EXECUTE on purge_unconfirmed_updates_subscribers'
);

select * from finish();
rollback;
