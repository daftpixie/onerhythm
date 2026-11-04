-- T16: a moderator cannot act on their own content or an item they reported.
-- T17: an appeal cannot be decided by the acting moderator, the appellant,
-- or a panelist who wrote or reported the content. T18: the two-person rule
-- needs two distinct people. ADR 0019 §5.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);


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

select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G4'$$, 'fixture: G4 marked met for the test only');
select lives_ok($$update public.governance_config set value = interval '90 days' where key = 'max_interim_term'$$, 'fixture: max_interim_term set for the test');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 1');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One')$$, 'fixture: interim grant for Moderator 1');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('c0000000-0000-0000-0000-00000000000c', 'Moderator 1')$$, 'fixture: pseudonym Moderator 1');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('d0000000-0000-0000-0000-00000000000d', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 2');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('d0000000-0000-0000-0000-00000000000d', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator Two')$$, 'fixture: interim grant for Moderator 2');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('d0000000-0000-0000-0000-00000000000d', 'Moderator 2')$$, 'fixture: pseudonym Moderator 2');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('f0000000-0000-0000-0000-00000000000f', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 3');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('f0000000-0000-0000-0000-00000000000f', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator Three')$$, 'fixture: interim grant for Moderator 3');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('f0000000-0000-0000-0000-00000000000f', 'Moderator 3')$$, 'fixture: pseudonym Moderator 3');

select lives_ok($$insert into public.moderation_items (id, post_id, comment_id, source, category, tier, state) values
  ('50000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', null, 'report', 'dangerous_misinfo', 3, 'queued'),
  ('50000000-0000-0000-0000-0000000000c3', '10000000-0000-0000-0000-0000000000c3', null, 'report', 'dangerous_misinfo', 3, 'queued'),
  ('50000000-0000-0000-0000-0000000000d1', null, '20000000-0000-0000-0000-0000000000a1', 'report', 'tier1', 1, 'queued')$$, 'fixture: moderation items');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select throws_ok($$ select public.moderate('50000000-0000-0000-0000-0000000000c3', 'remove', '40000000-0000-0000-0000-000000000001', null, 'Own post.', null) $$,
  '42501', null, 'a moderator cannot act on their own content');
select lives_ok($$ select public.report_content('10000000-0000-0000-0000-0000000000a1', null, 'dangerous_misinfo', null) $$,
  'M reports A''s post');
select throws_ok($$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000001', null, 'I reported it.', null) $$,
  '42501', null, 'a moderator cannot act on an item they reported');
reset role;

select lives_ok($$insert into public.moderation_actions (id, item_id, action, floor_item_id, reason, actor_pseudonym) values ('60000000-0000-0000-0000-0000000000ff', '50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000001', 'Dangerous claim.', 'Moderator 2')$$, 'fixture: N proposes a removal');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'd0000000-0000-0000-0000-00000000000d', 'role', 'authenticated')::text, true);

select throws_ok($$ select public.confirm_action('60000000-0000-0000-0000-0000000000ff') $$, '42501', null,
  'the proposer cannot confirm their own action');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select throws_ok($$ select public.confirm_action('60000000-0000-0000-0000-0000000000ff') $$, '42501', null,
  'a confirmer who reported the item is refused too');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'f0000000-0000-0000-0000-00000000000f', 'role', 'authenticated')::text, true);

select lives_ok($$ select public.confirm_action('60000000-0000-0000-0000-0000000000ff') $$,
  'a distinct, unconflicted moderator can confirm');
reset role;

select lives_ok($$insert into public.moderation_actions (id, item_id, action, tier1_rule, reason, actor_pseudonym) values ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-0000000000d1', 'request_edit', 'off_topic', 'Please keep to the topic.', 'Moderator 2')$$, 'fixture: N asks A to edit a comment (Tier 1)');

select lives_ok($$insert into public.reports (reporter_id, comment_id, reason, item_id) values ('f0000000-0000-0000-0000-00000000000f', '20000000-0000-0000-0000-0000000000a1', 'off_topic', '50000000-0000-0000-0000-0000000000d1')$$, 'fixture: O reported that comment');

select lives_ok($$insert into public.appeals (id, action_id, appellant_id, statement, state, appellant_label) values ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'It was on topic.', 'submitted', 'Member 1')$$, 'fixture: A appeals');

-- Panelists need G2 (the appeals panel) as well as G4 (founder decision,
-- 2026-10-30; supabase/tests/23_panelist_grants_need_g2_test.sql).
select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G2'$$, 'fixture: G2 marked met for the test only');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name) select member_id, 'panelist', 'interim', granted_at, expires_at, public_name from public.moderator_grants where member_id in ('c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d', 'f0000000-0000-0000-0000-00000000000f') and role = 'moderator'$$, 'fixture: M, N and O also sit as panelists');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'd0000000-0000-0000-0000-00000000000d', 'role', 'authenticated')::text, true);

select throws_ok($$ select public.decide_appeal('70000000-0000-0000-0000-000000000001', 'uphold') $$, '42501', null,
  'the acting moderator cannot decide the appeal');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'f0000000-0000-0000-0000-00000000000f', 'role', 'authenticated')::text, true);

select throws_ok($$ select public.decide_appeal('70000000-0000-0000-0000-000000000001', 'uphold') $$, '42501', null,
  'a panelist who reported the content cannot decide the appeal');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select throws_ok($$ select public.decide_appeal('70000000-0000-0000-0000-000000000001', 'overturn') $$, '42501', null,
  'the appellant cannot decide their own appeal');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select lives_ok($$ select public.decide_appeal('70000000-0000-0000-0000-000000000001', 'overturn') $$,
  'an unconflicted panelist can decide');
select throws_ok($$ select public.decide_appeal('70000000-0000-0000-0000-000000000001', 'uphold') $$, '23505', null,
  'one decision per panelist: a second one is refused');

reset role;
select * from finish();
rollback;
