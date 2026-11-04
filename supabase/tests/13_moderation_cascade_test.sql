-- T4: deleting a member deletes every moderation row linked to them:
-- reports, blocks both ways, bans, appeals, second-look and re-examination
-- requests, removed content, items and actions on their content, grants and
-- the pseudonym mapping. ADR 0019 §9. (muted_terms does not exist: Q6.)
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);


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
  values ('a0000000-0000-0000-0000-00000000000a', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 4');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('a0000000-0000-0000-0000-00000000000a', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Member A')$$, 'fixture: interim grant for Moderator 4');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('a0000000-0000-0000-0000-00000000000a', 'Moderator 4')$$, 'fixture: pseudonym Moderator 4');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 1');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One')$$, 'fixture: interim grant for Moderator 1');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('c0000000-0000-0000-0000-00000000000c', 'Moderator 1')$$, 'fixture: pseudonym Moderator 1');

select lives_ok($$insert into public.moderation_items (id, post_id, comment_id, source, category, tier, state) values
  ('50000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', null, 'report', 'dangerous_misinfo', 3, 'queued'),
  ('50000000-0000-0000-0000-0000000000c3', '10000000-0000-0000-0000-0000000000c3', null, 'report', 'dangerous_misinfo', 3, 'queued'),
  ('50000000-0000-0000-0000-0000000000d1', null, '20000000-0000-0000-0000-0000000000a1', 'report', 'tier1', 1, 'queued')$$, 'fixture: moderation items');

select lives_ok($$insert into public.reports (reporter_id, post_id, reason, item_id) values ('a0000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-0000000000c3', 'dangerous_misinfo', '50000000-0000-0000-0000-0000000000c3')$$, 'fixture: A reports M post');

select lives_ok($$insert into public.member_blocks (blocker_id, blocked_id) values ('a0000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-00000000000b'), ('b0000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-00000000000a')$$, 'fixture: blocks both ways');

select lives_ok($$insert into public.moderation_actions (id, item_id, action, floor_item_id, reason, actor_pseudonym) values ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000001', 'Dangerous claim.', 'Moderator 1')$$, 'fixture: action on A post');

select lives_ok($$update public.governance_config set value = interval '30 days' where key = 'max_ban_term'$$, 'fixture: max_ban_term set for the test');

select lives_ok($$insert into public.member_bans (member_id, floor_item_id, reason, ends_at, proposed_by_pseudonym) values ('a0000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-000000000001', 'Repeated dangerous claims.', now() + interval '7 days', 'Moderator 1')$$, 'fixture: ban on A');

select lives_ok($$insert into public.appeals (id, action_id, appellant_id, statement, state, appellant_label) values ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-00000000000a', 'Please look again.', 'submitted', 'Member 1')$$, 'fixture: A appeal row');

select lives_ok($$insert into public.second_look_requests (requester_id, action_id, statement, state) values ('a0000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000003', 'Please look again.', 'submitted')$$, 'fixture: A second-look request');

select lives_ok($$insert into public.floor_reexamination_requests (requester_id, floor_item_id, request_text, state) values ('a0000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-000000000001', 'Why this rule?', 'submitted')$$, 'fixture: A re-examination request');

select lives_ok($$insert into public.removed_content (post_id, author_id, title, body, kind) values ('10000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000000a', 'A post', 'by A', 'removed')$$, 'fixture: A removed content');

select is(
  (select count(*)::int from pg_constraint c
    where c.contype = 'f' and c.confdeltype <> 'c'
      -- Compare regclass values, not text: with public on the search path,
      -- regclass prints bare names, so a text match against 'public.<t>'
      -- matched nothing and this check always passed (ADR 0013).
      and c.conrelid = any(array['public.governance_config','public.floor_versions','public.floor_items','public.floor_reexamination_requests','public.floor_reexamination_answers','public.triage_lists','public.reports','public.moderation_items','public.moderation_actions','public.removed_content','public.member_blocks','public.member_bans','public.moderator_grants','public.moderator_pseudonyms','public.appeals','public.appeal_decisions','public.second_look_requests','public.legal_holds','public.moderation_log_public','public.moderation_audit','public.launch_gates','public.launch_gate_history']::regclass[])
      and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)),
  0, 'every member foreign key in the moderation tables cascades (no set null)');
select isnt((select count(*)::int from public.reports where reporter_id = 'a0000000-0000-0000-0000-00000000000a'), 0,
  'sanity: A has moderation rows before deletion');

delete from auth.users where id = 'a0000000-0000-0000-0000-00000000000a';

select is((select count(*)::int from public.reports where reporter_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'reports.reporter_id rows deleted');
select is((select count(*)::int from public.member_blocks where blocker_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'member_blocks.blocker_id rows deleted');
select is((select count(*)::int from public.member_blocks where blocked_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'member_blocks.blocked_id rows deleted');
select is((select count(*)::int from public.member_bans where member_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'member_bans.member_id rows deleted');
select is((select count(*)::int from public.appeals where appellant_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'appeals.appellant_id rows deleted');
select is((select count(*)::int from public.second_look_requests where requester_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'second_look_requests.requester_id rows deleted');
select is((select count(*)::int from public.floor_reexamination_requests where requester_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'floor_reexamination_requests.requester_id rows deleted');
select is((select count(*)::int from public.removed_content where author_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'removed_content.author_id rows deleted');
select is((select count(*)::int from public.moderator_grants where member_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'moderator_grants.member_id rows deleted');
select is((select count(*)::int from public.moderator_pseudonyms where member_id = 'a0000000-0000-0000-0000-00000000000a'), 0, 'moderator_pseudonyms.member_id rows deleted');
select is((select count(*)::int from public.moderation_items where post_id = '10000000-0000-0000-0000-0000000000a1'), 0,
  'items on A''s deleted post are deleted');
select is((select count(*)::int from public.moderation_actions where id = '60000000-0000-0000-0000-000000000003'), 0,
  'actions on A''s deleted post are deleted');
select is((select count(*)::int from public.appeal_decisions where appeal_id = '70000000-0000-0000-0000-000000000001'), 0,
  'panel decisions on A''s appeal are deleted with it');

reset role;
select * from finish();
rollback;
