-- T22: removed text is unreadable by other members, including through
-- Realtime (no REPLICA IDENTITY FULL); the author and moderators can read it.
-- ADR 0019 §2.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select is((select relreplident::text from pg_class where oid = 'public.posts'::regclass), 'd',
  'posts do not use REPLICA IDENTITY FULL');
select is((select relreplident::text from pg_class where oid = 'public.comments'::regclass), 'd',
  'comments do not use REPLICA IDENTITY FULL');
select has_column('public', 'posts', 'moderation_state', 'posts carry a moderation state');

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

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select lives_ok($$ select public.moderate('50000000-0000-0000-0000-0000000000a1', 'remove', '40000000-0000-0000-0000-000000000001', null, 'Dangerous claim.', null) $$,
  'a moderator removes A''s post under a safety-floor item');
reset role;

select is((select body from public.posts where id = '10000000-0000-0000-0000-0000000000a1'), '', 'the public row keeps an empty body');
select is((select moderation_state::text from public.posts where id = '10000000-0000-0000-0000-0000000000a1'), 'removed', 'the post is marked removed');
select is((select count(*)::int from public.removed_content where post_id = '10000000-0000-0000-0000-0000000000a1' and body = 'by A'), 1,
  'the text moved to removed_content');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b0000000-0000-0000-0000-00000000000b', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.removed_content), 0, 'another member cannot read removed text');
select is((select count(*)::int from public.posts where id = '10000000-0000-0000-0000-0000000000a1' and body <> ''), 0,
  'another member cannot read it through posts either');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.removed_content where post_id = '10000000-0000-0000-0000-0000000000a1'), 1, 'the author can read their removed text');
select is((select count(*)::int from public.moderation_actions), 0,
  'the author reads no action rows directly (they carry pseudonyms)');
select has_function('public', 'my_moderation_notices', 'the author''s notices come through a function');
select is(
  (select count(*)::int from pg_proc p, unnest(coalesce(p.proargnames, array[]::text[])) a(name)
    where p.proname = 'my_moderation_notices' and a.name like '%pseudonym%'),
  0, 'the author''s notices never include a pseudonym');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.removed_content where post_id = '10000000-0000-0000-0000-0000000000a1'), 1, 'a moderator can read it');

reset role;
select * from finish();
rollback;
