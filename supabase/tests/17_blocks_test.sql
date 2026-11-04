-- T13: a block hides posts both ways; the blocked member cannot see the
-- block; moderators cannot read blocks; no self-block. ADR 0019 §3, §4.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);


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

select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G4'$$, 'fixture: G4 marked met for the test only');
select lives_ok($$update public.governance_config set value = interval '90 days' where key = 'max_interim_term'$$, 'fixture: max_interim_term set for the test');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator_public_name', 'test', 'test')$$, 'fixture: naming consent for Moderator 1');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One')$$, 'fixture: interim grant for Moderator 1');
select lives_ok($$insert into public.moderator_pseudonyms (member_id, pseudonym) values ('c0000000-0000-0000-0000-00000000000c', 'Moderator 1')$$, 'fixture: pseudonym Moderator 1');

select has_table('public', 'member_blocks', 'member_blocks exists');
select throws_ok($$ insert into public.member_blocks (blocker_id, blocked_id) values ('a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000a') $$,
  '23514', null, 'no self-block');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'b0000000-0000-0000-0000-00000000000b', 'role', 'authenticated')::text, true);

select lives_ok($$ insert into public.member_blocks (blocker_id, blocked_id) values ('b0000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-00000000000a') $$,
  'B blocks A');
select is((select count(*)::int from public.posts where author_id = 'a0000000-0000-0000-0000-00000000000a'), 0,
  'the blocker no longer sees the blocked member''s posts');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.posts where author_id = 'b0000000-0000-0000-0000-00000000000b'), 0,
  'the blocked member no longer sees the blocker''s posts');
select is((select count(*)::int from public.member_blocks), 0,
  'the blocked member cannot read the block');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.member_blocks), 0,
  'a moderator cannot read the block');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'e0000000-0000-0000-0000-00000000000e', 'role', 'authenticated')::text, true);

select is((select count(*)::int from public.posts where author_id in ('a0000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-00000000000b')), 2,
  'a bystander still sees both members'' posts');

reset role;
select * from finish();
rollback;
