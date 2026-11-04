-- T7: Tier 3 is never routed to a vote; tier is 1 or 3; a Tier 3 item can
-- never be moved to Tier 1. T9: removal and temporary bans need a
-- safety-floor item; a Tier 1 item can never be removed. ADR 0019, ADR 0021.
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);


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

select lives_ok($$insert into public.moderation_items (id, post_id, comment_id, source, category, tier, state) values
  ('50000000-0000-0000-0000-0000000000a1', '10000000-0000-0000-0000-0000000000a1', null, 'report', 'dangerous_misinfo', 3, 'queued'),
  ('50000000-0000-0000-0000-0000000000c3', '10000000-0000-0000-0000-0000000000c3', null, 'report', 'dangerous_misinfo', 3, 'queued'),
  ('50000000-0000-0000-0000-0000000000d1', null, '20000000-0000-0000-0000-0000000000a1', 'report', 'tier1', 1, 'queued')$$, 'fixture: moderation items');

select throws_ok(
  $$ insert into public.moderation_items (post_id, source, category, tier, state)
     values ('10000000-0000-0000-0000-0000000000b2', 'report', 'tier1', 2, 'queued') $$,
  '23514', null, 'tier must be 1 or 3');
select throws_ok(
  $$ update public.moderation_items set tier = 1 where id = '50000000-0000-0000-0000-0000000000a1' $$,
  '23514', null, 'a Tier 3 item cannot be moved to Tier 1');
select lives_ok($$insert into public.moderation_actions (id, item_id, action, floor_item_id, reason, actor_pseudonym) values ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000001', 'Dangerous claim.', 'Moderator 1')$$, 'fixture: a Tier 3 removal');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.submit_appeal('60000000-0000-0000-0000-000000000003', 'Please put this to the panel.') $$,
  '42501', null, 'a Tier 3 action can never be appealed to a vote');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'remove', null, null, 'No floor item.', null) $$,
  '23514', null, 'a removal needs a floor item');
select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000002', null, 'Wrong floor.', null) $$,
  '23514', null, 'a removal must cite the SAFETY floor');
select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000d1', 'remove', '40000000-0000-0000-0000-000000000001', 'off_topic', 'Off topic.', null) $$,
  '23514', null, 'a Tier 1 item can never be removed');
select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'temporary_ban', '40000000-0000-0000-0000-000000000001', null, 'No cap set.', now() + interval '7 days') $$,
  '23514', null, 'no ban at all while max_ban_term is NULL');
reset role;

select lives_ok($$update public.governance_config set value = interval '30 days' where key = 'max_ban_term'$$, 'fixture: max_ban_term set for the test');

select lives_ok($$insert into public.moderation_items (post_id, source, category, tier, state) values ('10000000-0000-0000-0000-0000000000b2', 'triage', 'crisis', 3, 'queued')$$, 'fixture: a crisis item on B post');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.moderate((select id from public.moderation_items where post_id = '10000000-0000-0000-0000-0000000000b2'), 'remove', '40000000-0000-0000-0000-000000000001', null, 'Crisis post.', null) $$,
  '23514', null, 'a crisis item is never removed');
select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'temporary_ban', '40000000-0000-0000-0000-000000000001', null, 'Too long.', now() + interval '90 days') $$,
  '23514', null, 'a ban cannot exceed max_ban_term');
select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'temporary_ban', '40000000-0000-0000-0000-000000000001', null, 'No end date.', null) $$,
  '23514', null, 'a temporary ban needs an end date');
select throws_ok(
  $$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'temporary_ban', '40000000-0000-0000-0000-000000000001', null, 'Past end date.', now() - interval '1 day') $$,
  '23514', null, 'a temporary ban needs an end date in the future');
reset role;

select throws_ok(
  $$ insert into public.moderation_actions (item_id, action, reason, actor_pseudonym)
     values ('50000000-0000-0000-0000-0000000000a1', 'remove', 'Direct insert, no floor item.', 'Moderator 1') $$,
  '23514', null, 'the table itself rejects a removal with no floor item');
select throws_ok(
  $$ insert into public.moderation_actions (item_id, action, floor_item_id, reason, actor_pseudonym)
     values ('50000000-0000-0000-0000-0000000000d1', 'request_edit', '40000000-0000-0000-0000-000000000001', 'A floor item on a Tier 1 item.', 'Moderator 1') $$,
  '23514', null, 'a floor item can only sit on a Tier 3 item, so no floor decision reaches a vote');

reset role;
select * from finish();
rollback;
