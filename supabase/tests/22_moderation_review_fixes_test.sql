-- Review round 1 (2026-10-29) on the moderation migrations: one test per
-- finding that changes the database. privacy-reviewer: crisis minimization (1),
-- the block oracle (2), early note purge (3), orphan items (4), held-post edits
-- (5), service_role EXECUTE (9). governance-reviewer: back-dated announcements
-- (B1), two-person rule as a table constraint (N2), no Tier 3 decision row
-- (N3), ban evasion and extension (N5), safety-floor citation only (N6).
-- Plus the vacuity audit: the elected-grant and G4 rules, each on its own.
-- Committed failing before the fix (CLAUDE.md, ADR 0013).
begin;
create extension if not exists pgtap with schema extensions;
select plan(40);

-- Base fixture: existing tables only (as superuser).
do $$
begin
  insert into auth.users (id, email) values
    ('a0000000-0000-0000-0000-00000000000a', 'a@mod.test'), ('b0000000-0000-0000-0000-00000000000b', 'b@mod.test'), ('c0000000-0000-0000-0000-00000000000c', 'm@mod.test'),
    ('d0000000-0000-0000-0000-00000000000d', 'n@mod.test'), ('e0000000-0000-0000-0000-00000000000e', 'r@mod.test'), ('f0000000-0000-0000-0000-00000000000f', 'o@mod.test');
  insert into public.communities (id, slug, name) values ('30000000-0000-0000-0000-000000000001', 'mod-test', 'Mod Test');
  insert into public.posts (id, author_id, community_id, title, body) values
    ('10000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', 'A post', 'by A'),
    ('10000000-0000-0000-0000-0000000000b2', 'b0000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', 'B post', 'by B'),
    ('10000000-0000-0000-0000-0000000000c3', 'c0000000-0000-0000-0000-00000000000c', '30000000-0000-0000-0000-000000000001', 'M post', 'by M');
  insert into public.comments (id, post_id, author_id, body) values ('20000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000000a', 'a comment');
end $$;

select lives_ok($$insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
  values ('safety', 1, repeat('0', 64), 'initial', 'First publication.', now() - interval '1 day', now() - interval '1 day'),
         ('privacy', 1, repeat('1', 64), 'initial', 'First publication.', now() - interval '1 day', now() - interval '1 day')$$, 'fixture: safety and privacy floors v1');
select lives_ok($$insert into public.floor_items (id, floor, version, item_number, text) values
  ('40000000-0000-0000-0000-000000000001', 'safety', 1, 1, 'Dangerous medical misinformation'),
  ('40000000-0000-0000-0000-000000000002', 'privacy', 1, 1, 'Consent comes before any health data is used.')$$, 'fixture: floor items');

-- B1: a change is announced when it is published, never back-dated.
update public.governance_config set value = interval '30 days' where key = 'minimum_notice';
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, adr_ref, legal_review_ref)
     values ('safety', 2, repeat('2', 64), 'loosen', 'A reason.', now() - interval '365 days', now(), now() - interval '300 days', 'ADR 0099', 'LR-1') $$,
  '23514', null, 'a loosening cannot be back-dated to skip its notice');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('privacy', 2, repeat('2', 64), 'tighten', 'A reason.', now() - interval '2 days', now() - interval '1 day') $$,
  '23514', null, 'a tighten cannot be back-dated to skip its announcement');

-- Vacuity audit: the G4 rule and the elected rule each stand alone.
select lives_ok($$update public.governance_config set value = interval '90 days' where key = 'max_interim_term'$$, 'fixture: max_interim_term set');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  select id, 'moderator_public_name', 'test', 'test' from auth.users
   where id in ('c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d')$$, 'fixture: naming consent for M and N');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One') $$,
  '23514', null, 'G4 unmet refuses a grant even when every G9 value is set');
select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G4'$$, 'fixture: G4 marked met for the test only');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, election_ref)
  values ('d0000000-0000-0000-0000-00000000000d', 'moderator', 'elected', now() - interval '1 hour', now() + interval '30 days', 'Election 1') $$,
  '23514', null, 'an elected grant is refused before elections, even with an election reference and a short term');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name) values
  ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One'),
  ('d0000000-0000-0000-0000-00000000000d', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator Two')$$, 'fixture: interim grants for M and N');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values
  ('c0000000-0000-0000-0000-00000000000c', 'Moderator 1'), ('d0000000-0000-0000-0000-00000000000d', 'Moderator 2')$$, 'fixture: pseudonyms');

-- Vacuity audit: 13_moderation_cascade_test's foreign-key check compares
-- `conrelid::regclass::text` with 'public.<table>', but regclass prints bare
-- names while `public` is on the search path, so it matches nothing and a
-- `set null` slips past it. The same check, comparing regclass values:
select is(
  (select count(*)::int from pg_constraint c
    where c.contype = 'f' and c.confdeltype <> 'c'
      and c.conrelid = any (array['public.floor_reexamination_requests','public.reports',
        'public.removed_content','public.member_blocks','public.member_bans',
        'public.moderator_grants','public.moderator_pseudonyms','public.appeals',
        'public.second_look_requests']::regclass[])
      and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)),
  0, 'every member foreign key in the moderation tables cascades (regclass comparison)');

-- Vacuity audit: the founder's G9 rule for the public log (2026-10-29), and
-- the crisis-per-room rule, each on its own.
select throws_ok($$ insert into public.moderation_log_public (week_start, kind, scope, category, action, count, fewer_than_five)
     values (date '2026-10-26', 'action', 'community:mod-test', 'dangerous_misinfo', 'remove', null, true) $$,
  '23514', null, 'no per-community row while the small-community threshold is NULL (G9)');
select lives_ok($$update public.governance_config set int_value = 10 where key = 'small_community_threshold'$$,
  'fixture: threshold set for the test only');
select throws_ok($$ insert into public.moderation_log_public (week_start, kind, scope, category, action, count, fewer_than_five)
     values (date '2026-10-26', 'action', 'community:mod-test', 'crisis', 'sent_crisis_resources', null, true) $$,
  '23514', null, 'crisis is never shown per room, even with the threshold set');

-- Privacy 2: the block check is not an RPC anyone can call.
select hasnt_function('public', 'is_blocked_between', array['uuid', 'uuid'],
  'the block check is not exposed in the public schema');

-- Privacy round 2, blocker 1: the block check is not reachable through
-- GraphQL either, and anon cannot reach its schema at all.
select ok(not has_schema_privilege('anon', 'moderation_private', 'usage'),
  'anon has no usage on moderation_private');
-- pg_graphql is off by default on new Supabase stacks (CI showed the
-- graphql_public schema without the extension). So, where it is available,
-- the test turns it on inside this transaction (rolled back at the end) and
-- asks it directly. On a Supabase stack it must be available, so the check
-- cannot pass by skipping.
select ok(
  not exists (select 1 from pg_namespace where nspname = 'graphql_public')
  or exists (select 1 from pg_available_extensions where name = 'pg_graphql'),
  'on a Supabase stack, pg_graphql is available, so the GraphQL check below runs');
-- pg_graphql on this stack refuses introspection (__schema, __type), so
-- the test asks directly: a real collection query proves GraphQL runs, and
-- asking for the block check under either naming style must be refused.
do $$
declare
  probe text := '"d0000000-0000-0000-0000-00000000000d", p_b: "e0000000-0000-0000-0000-00000000000e")';
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_graphql') then
    create extension if not exists pg_graphql;
    execute 'set local role authenticated';
    perform set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-00000000000e', 'role', 'authenticated')::text, true);
    perform set_config('moderation_test.graphql_works',
      (select graphql.resolve('{ communitiesCollection(first: 1) { edges { node { slug } } } }'))::text, true);
    perform set_config('moderation_test.graphql_snake',
      (select graphql.resolve('{ is_blocked_between(p_a: ' || probe || ' }'))::text, true);
    perform set_config('moderation_test.graphql_camel',
      (select graphql.resolve('{ isBlockedBetween(pA: ' || replace(probe, 'p_b:', 'pB:') || ' }'))::text, true);
    execute 'reset role';
  else
    perform set_config('moderation_test.graphql_works', 'pg_graphql not installed', true);
    perform set_config('moderation_test.graphql_snake', 'pg_graphql not installed', true);
    perform set_config('moderation_test.graphql_camel', 'pg_graphql not installed', true);
  end if;
end $$;
-- matches prints what GraphQL returned if it fails.
select matches(current_setting('moderation_test.graphql_works'), 'pg_graphql not installed|"slug"',
  'GraphQL really runs here (it lists a community)');
select matches(current_setting('moderation_test.graphql_snake') || ' ' || current_setting('moderation_test.graphql_camel'),
  '^(pg_graphql not installed pg_graphql not installed|.*Unknown field.* .*Unknown field.*)$',
  'GraphQL does not expose the block check under either name');

-- The check says nothing about a member who has never posted: R (who has
-- no posts) blocks N; N cannot learn it.
insert into public.member_blocks (blocker_id, blocked_id)
  values ('e0000000-0000-0000-0000-00000000000e', 'd0000000-0000-0000-0000-00000000000d');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'd0000000-0000-0000-0000-00000000000d', 'role', 'authenticated')::text, true);
select is(moderation_private.is_blocked_between('d0000000-0000-0000-0000-00000000000d', 'e0000000-0000-0000-0000-00000000000e'), false,
  'the block check reveals nothing about a member who has never posted');
reset role;
delete from public.member_blocks where blocker_id = 'e0000000-0000-0000-0000-00000000000e';

-- Privacy 9: service_role holds no EXECUTE on the member and moderator functions.
select ok(not has_function_privilege('service_role',
  'public.moderate(uuid,public.moderation_action_kind,uuid,public.tier1_rule,text,timestamptz)', 'execute'),
  'service_role cannot call moderate()');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-00000000000e', 'role', 'authenticated')::text, true);
select lives_ok($$ select public.report_content('10000000-0000-0000-0000-0000000000b2', null, 'dangerous_misinfo', 'A note.') $$, 'R reports B''s post');
select lives_ok($$ select public.report_content('10000000-0000-0000-0000-0000000000b2', null, 'self_harm', null) $$, 'R reports it again with another reason');
reset role;

-- Privacy round 2, item 2 (safety): a member who first reported a post as
-- unkind can still escalate it to self-harm.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'f0000000-0000-0000-0000-00000000000f', 'role', 'authenticated')::text, true);
select lives_ok($$ select public.report_content('10000000-0000-0000-0000-0000000000a1', null, 'unkind', null) $$, 'O reports A''s post as unkind');
select lives_ok($$ select public.report_content('10000000-0000-0000-0000-0000000000a1', null, 'self_harm', null) $$, 'O then reports it for self-harm');
reset role;
select is((select count(*)::int from public.moderation_items i join public.reports r on r.item_id = i.id
            where i.post_id = '10000000-0000-0000-0000-0000000000a1' and i.category = 'crisis'
              and r.reporter_id = 'f0000000-0000-0000-0000-00000000000f'), 1,
  'the self-harm report reaches a crisis item');

-- Privacy 4: the second report makes no orphan item.
select is((select count(*)::int from public.moderation_items
            where post_id = '10000000-0000-0000-0000-0000000000b2' and report_count = 0), 0,
  'a repeat report by the same member creates no item without a report');

-- Privacy 1 and 3.
select lives_ok($$insert into public.moderation_items (id, post_id, source, category, tier) values
  ('50000000-0000-0000-0000-0000000000c9', '10000000-0000-0000-0000-0000000000c3', 'triage', 'crisis', 3),
  ('50000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', 'report', 'dangerous_misinfo', 3)$$, 'fixture: a crisis item on M''s post, a misinformation item on A''s');
select lives_ok($$insert into public.reports (reporter_id, post_id, reason, note, item_id) values
  ('e0000000-0000-0000-0000-00000000000e', '10000000-0000-0000-0000-0000000000a1', 'dangerous_misinfo', 'A note.', '50000000-0000-0000-0000-0000000000a1')$$, 'fixture: R reported A''s post with a note');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'd0000000-0000-0000-0000-00000000000d', 'role', 'authenticated')::text, true);
select lives_ok($$ select public.moderate('50000000-0000-0000-0000-0000000000c9', 'no_action', '40000000-0000-0000-0000-000000000001', null, 'Spoke about feeling unsafe at home.', null) $$,
  'a moderator closes the crisis item');
select lives_ok($$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000001', null, 'Dangerous claim.', null) $$,
  'a moderator removes A''s post');
reset role;

select is((select count(*)::int from public.moderation_actions
            where item_id = '50000000-0000-0000-0000-0000000000c9' and reason ilike '%unsafe%'), 0,
  'a closed crisis item keeps no action reason');
select is((select count(*)::int from public.reports where item_id = '50000000-0000-0000-0000-0000000000a1' and note is not null), 0,
  'report notes are purged once a moderator has acted');

-- Governance N2, N3, N6.
select throws_ok($$ update public.moderation_actions set confirmed_by_pseudonym = actor_pseudonym
   where item_id = '50000000-0000-0000-0000-0000000000a1' $$,
  '23514', null, 'the table refuses a confirmation by the proposer');
select throws_ok($$ insert into public.moderation_actions (item_id, action, floor_item_id, reason, actor_pseudonym)
     values ('50000000-0000-0000-0000-0000000000a1', 'no_action', '40000000-0000-0000-0000-000000000002', 'Cites the privacy floor.', 'Moderator 2') $$,
  '23514', null, 'an action on content cites the safety floor, never the privacy floor');

-- Governance N5: a confirmed ban stops edits too, and is never lengthened.
select lives_ok($$update public.governance_config set value = interval '30 days' where key = 'max_ban_term'$$, 'fixture: max_ban_term set');
insert into public.member_bans (member_id, floor_item_id, reason, ends_at, proposed_by_pseudonym, confirmed_by_pseudonym, confirmed_at)
  values ('b0000000-0000-0000-0000-00000000000b', '40000000-0000-0000-0000-000000000001', 'Test ban.', now() + interval '7 days', 'Moderator 1', 'Moderator 2', now());
select throws_ok($$ update public.member_bans set ends_at = ends_at + interval '1 day' where member_id = 'b0000000-0000-0000-0000-00000000000b' $$,
  '23514', null, 'a ban is never lengthened');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b0000000-0000-0000-0000-00000000000b', 'role', 'authenticated')::text, true);
select throws_ok($$ update public.posts set body = 'edited while banned' where id = '10000000-0000-0000-0000-0000000000b2' $$,
  '42501', null, 'a banned member cannot edit their posts');

reset role;

-- Governance round 2 note: a held post cannot be edited by its author.
insert into public.removed_content (post_id, author_id, title, body, kind)
  values ('10000000-0000-0000-0000-0000000000c3', 'c0000000-0000-0000-0000-00000000000c', 'M post', 'by M', 'held');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);
update public.posts set body = 'edited while held' where id = '10000000-0000-0000-0000-0000000000c3';
reset role;
select is((select body from public.posts where id = '10000000-0000-0000-0000-0000000000c3'), 'by M',
  'a held post cannot be edited by its author');

select * from finish();
rollback;
