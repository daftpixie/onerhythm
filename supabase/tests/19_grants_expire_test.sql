-- T19: grants expire and are capped; interim limits cannot be skipped by
-- labelling a grant "elected"; an expired or revoked grant gives no
-- is_moderator(). ADR 0019 §6.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);


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

select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source) select id, 'moderator_public_name', 'test', 'test' from auth.users where id in ('c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d', 'f0000000-0000-0000-0000-00000000000f')$$, 'fixture: naming consent for M, N and O');

select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), now() + interval '10 days', 'Moderator One') $$, '23514', null,
  'no grant at all while G4 is unmet');
select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G4'$$, 'fixture: G4 marked met for the test only');

select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), 'Moderator One') $$, '23502', null,
  'a grant must have an end date');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), now() - interval '1 day', 'Moderator One') $$, '23514', null,
  'a grant cannot end before it starts');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), now() + interval '10 days', 'Moderator One') $$, '23514', null,
  'no interim grant while max_interim_term is NULL');
select lives_ok($$update public.governance_config set value = interval '90 days' where key = 'max_interim_term'$$, 'fixture: max_interim_term set to 90 days for the test');

select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), now() + interval '120 days', 'Moderator One') $$, '23514', null,
  'an interim grant cannot exceed max_interim_term');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), now() + interval '30 days') $$, '23514', null,
  'an interim grant must carry a public name');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('b0000000-0000-0000-0000-00000000000b', 'moderator', 'interim', now(), now() + interval '30 days', 'Member B') $$, '23514', null,
  'an interim grant needs current naming consent in the ledger');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at)
  values ('d0000000-0000-0000-0000-00000000000d', 'moderator', 'elected', now(), now() + interval '365 days') $$, '23514', null,
  'no elected grant exists before elections do');
select lives_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now() - interval '1 hour', now() + interval '60 days', 'Moderator One') $$,
  'a capped, named interim grant is accepted');
select throws_ok($$ update public.moderator_grants set expires_at = expires_at + interval '10 days'
  where member_id = 'c0000000-0000-0000-0000-00000000000c' $$, '23514', null, 'an interim end date can never be extended');
select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'moderator', 'interim', now(), now() + interval '30 days', 'Moderator One') $$, '23514', null,
  'no second interim grant to the same person while interim_gap is NULL');
select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name) values ('d0000000-0000-0000-0000-00000000000d', 'moderator', 'interim', now() - interval '10 days', now() - interval '1 day', 'Moderator Two')$$, 'fixture: an expired grant for N');

select lives_ok($$insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, revoked_at, public_name) values ('f0000000-0000-0000-0000-00000000000f', 'moderator', 'interim', now() - interval '1 day', now() + interval '30 days', now(), 'Moderator Three')$$, 'fixture: a revoked grant for O');

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select is(public.is_moderator(), true, 'a current grant makes a moderator');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'd0000000-0000-0000-0000-00000000000d', 'role', 'authenticated')::text, true);

select is(public.is_moderator(), false, 'an expired grant does not');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'f0000000-0000-0000-0000-00000000000f', 'role', 'authenticated')::text, true);

select is(public.is_moderator(), false, 'a revoked grant does not');
reset role;

update public.consent_records set withdrawn_at = now() where member_id = 'c0000000-0000-0000-0000-00000000000c' and withdrawn_at is null;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'c0000000-0000-0000-0000-00000000000c', 'role', 'authenticated')::text, true);

select is(public.is_moderator(), false, 'withdrawing naming consent ends an interim grant');

reset role;
select * from finish();
rollback;
