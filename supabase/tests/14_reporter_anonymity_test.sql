-- T6: reporter anonymity. Moderators and the subject never get reporter_id,
-- the note, the count or a timestamp; the note is purged when the item
-- closes. ADR 0019 §4.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select has_function('public', 'moderation_queue', 'moderation_queue() exists');
select is(
  (select count(*)::int from pg_proc p, unnest(coalesce(p.proargnames, array[]::text[])) a(name)
    where p.proname = 'moderation_queue' and p.pronamespace = 'public'::regnamespace
      and a.name in ('reporter_id', 'note', 'report_count', 'created_at', 'reported_at')),
  0, 'the queue returns no reporter, note, count or timestamp');
select is(
  (select count(*)::int from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and (coalesce(qual, '') || coalesce(with_check, '')) ilike '%is_moderator%'),
  0, 'no moderator policy on reports');

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
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-00000000000e', 'role', 'authenticated')::text, true);

select lives_ok($$ select public.report_content('10000000-0000-0000-0000-0000000000a1', null, 'dangerous_misinfo', 'I think this is unsafe.') $$,
  'a member can report a post');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.reports), 0, 'a moderator reads no report rows');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.reports), 0, 'the reported author reads no report rows');
reset role;

update public.moderation_items set state = 'closed', closed_at = now() where post_id = '10000000-0000-0000-0000-0000000000a1';
select is((select count(*)::int from public.reports where post_id = '10000000-0000-0000-0000-0000000000a1' and note is not null), 0,
  'the report note is purged when the item closes');

reset role;
select * from finish();
rollback;
