-- Crown-jewel invariant 2: RLS DEFAULT-DENY.
-- Every Phase 1B table has RLS enabled with explicit policies. No row is
-- readable/writable except by an allowed role/owner. No reliance on client-side
-- filtering or unguessable IDs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

-- Seed two members and a post by member A (as superuser; RLS bypassed for setup).
do $$
declare a uuid := '11111111-1111-1111-1111-111111111111';
        b uuid := '22222222-2222-2222-2222-222222222222';
        c uuid := '33333333-3333-3333-3333-333333333333';
        p uuid := '44444444-4444-4444-4444-444444444444';
begin
  insert into auth.users (id, email) values (a, 'a@test.local'), (b, 'b@test.local');
  -- profiles are auto-created by handle_new_user (Phase 1C); upsert the fixture
  -- display_name so this setup coexists with that trigger.
  insert into public.profiles (id, display_name) values (a, 'Member A'), (b, 'Member B')
    on conflict (id) do update set display_name = excluded.display_name;
  insert into public.communities (id, slug, name) values (c, 'rls-test', 'RLS Test');
  insert into public.posts (id, author_id, community_id, title, body)
    values (p, a, c, 'A post', 'by A');
  insert into public.consent_records (member_id, purpose, policy_version, source)
    values (a, 'health_self_id', 'v1', 'test');
end $$;

-- RLS is enabled on every one of the ten Phase 1B tables.
select is(
  (select count(*)::int from pg_class
    where relnamespace = 'public'::regnamespace and relrowsecurity
      and relname = any(array[
        'profiles','self_id_tags','health_self_ids','consent_records',
        'communities','memberships','posts','comments','upbeats','journey_entries'])),
  10,
  'RLS is enabled on all ten Phase 1B tables'
);

-- Anonymous (unauthenticated) callers see no posts and no profiles.
set local role anon;
select set_config('request.jwt.claims', null, true);
select is((select count(*) from public.posts),           0::bigint, 'anon cannot read posts');
select is((select count(*) from public.profiles),        0::bigint, 'anon cannot read profiles');
select is((select count(*) from public.consent_records), 0::bigint, 'anon cannot read consent records');
-- ...but community names are anon-readable for discovery.
select isnt((select count(*) from public.communities), 0::bigint,
  'anon CAN read community names (public discovery)');
reset role;

-- Member B cannot read Member A's private rows.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);
select is((select count(*) from public.consent_records
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'member B cannot read member A consent records');
reset role;

-- Member A can read their own consent records.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
select is((select count(*) from public.consent_records), 1::bigint,
  'member A can read their own consent records');

-- WITH CHECK: a member cannot create a post attributed to someone else.
select throws_ok(
  $$ insert into public.posts (author_id, community_id, title, body)
     values ('22222222-2222-2222-2222-222222222222',
             '33333333-3333-3333-3333-333333333333', 'spoof', 'as B') $$,
  '42501',
  null,
  'member A cannot insert a post authored by member B (RLS WITH CHECK)'
);
reset role;

select * from finish();
rollback;
