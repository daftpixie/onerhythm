-- T2: RLS default-deny on every new table; client roles hold only the
-- matrix verbs (ADR 0019 §3). T23: moderators cannot read health_self_ids,
-- memberships, member_blocks, legal_holds or moderator_pseudonyms.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any(array['governance_config','floor_versions','floor_items','floor_reexamination_requests','floor_reexamination_answers','triage_lists','reports','moderation_items','moderation_actions','removed_content','member_blocks','member_bans','moderator_grants','moderator_pseudonyms','appeals','appeal_decisions','second_look_requests','legal_holds','moderation_log_public','moderation_audit','launch_gates','launch_gate_history']) and c.relrowsecurity),
  22, 'all 22 moderation tables exist with RLS enabled');
select set_eq(
  $$ select distinct table_name::text from information_schema.role_table_grants
      where table_schema = 'public' and grantee = 'anon'
        and table_name = any(array['governance_config','floor_versions','floor_items','floor_reexamination_requests','floor_reexamination_answers','triage_lists','reports','moderation_items','moderation_actions','removed_content','member_blocks','member_bans','moderator_grants','moderator_pseudonyms','appeals','appeal_decisions','second_look_requests','legal_holds','moderation_log_public','moderation_audit','launch_gates','launch_gate_history']) $$,
  array['governance_config','floor_versions','floor_items','floor_reexamination_answers','triage_lists','moderation_log_public','launch_gates','launch_gate_history'],
  'anon can read only the public moderation tables');
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'anon'
      and table_name = any(array['governance_config','floor_versions','floor_items','floor_reexamination_requests','floor_reexamination_answers','triage_lists','reports','moderation_items','moderation_actions','removed_content','member_blocks','member_bans','moderator_grants','moderator_pseudonyms','appeals','appeal_decisions','second_look_requests','legal_holds','moderation_log_public','moderation_audit','launch_gates','launch_gate_history']) and privilege_type <> 'SELECT'),
  0, 'anon holds no write privilege on any moderation table');
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated'
      and table_name in ('moderator_pseudonyms', 'legal_holds', 'moderation_audit')),
  0, 'authenticated holds nothing on pseudonyms, legal holds or the audit log');
select is(
  (select count(*)::int from information_schema.role_table_grants
    where table_schema = 'public' and grantee = 'authenticated'
      and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
      and table_name = any(array['governance_config','floor_versions','floor_items',
        'floor_reexamination_answers','triage_lists','reports','moderation_items',
        'moderation_actions','removed_content','member_bans','moderator_grants',
        'appeals','appeal_decisions','moderation_log_public','launch_gates',
        'launch_gate_history'])),
  0, 'authenticated writes those tables only through definer functions');
select has_function('public', 'is_moderator', 'is_moderator() exists');
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public'
      and tablename in ('health_self_ids', 'memberships', 'consent_records',
                        'member_blocks', 'legal_holds', 'moderator_pseudonyms')
      and (coalesce(qual, '') || coalesce(with_check, '')) ilike '%is_moderator%'),
  0, 'no policy lets a moderator into health tags, memberships, blocks, holds or pseudonyms');

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

insert into public.memberships (member_id, community_id) values ('a0000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001');
select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G4'$$, 'fixture: G4 marked met for the test only');
select lives_ok($$update public.governance_config set value = interval '90 days' where key = 'max_interim_term'$$, 'fixture: max_interim_term set for the test');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 1');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One')$$, 'fixture: interim grant for Moderator 1');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('c0000000-0000-0000-0000-00000000000c', 'Moderator 1')$$, 'fixture: pseudonym Moderator 1');

select lives_ok($$insert into public.member_blocks (blocker_id, blocked_id) values ('a0000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-00000000000b')$$, 'fixture: A blocks B');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.memberships where member_id = 'a0000000-0000-0000-0000-00000000000a'), 0,
  'a moderator cannot read another member''s memberships');
select is((select count(*)::int from public.member_blocks), 0,
  'a moderator cannot read blocks');
select throws_ok('select * from public.legal_holds', '42501', null,
  'a moderator cannot read legal holds');
select throws_ok('select * from public.moderator_pseudonyms', '42501', null,
  'a moderator cannot read the pseudonym mapping');

reset role;
select * from finish();
rollback;
