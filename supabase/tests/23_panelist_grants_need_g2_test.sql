-- A panelist grant needs G2 (appeals panel) as well as G4 (who moderates).
-- Founder decision, 2026-10-30. G4 alone let test 18's fixture seat
-- panelists while the appeals panel gate was unmet. A moderator grant still
-- needs only G4. ADR 0019 §6; ADR 0021.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

do $$
begin
  insert into auth.users (id, email) values
    ('c0000000-0000-0000-0000-00000000000c', 'm@mod.test'),
    ('d0000000-0000-0000-0000-00000000000d', 'n@mod.test'),
    ('f0000000-0000-0000-0000-00000000000f', 'o@mod.test');
end $$;

select lives_ok($$update public.governance_config set value = interval '90 days' where key = 'max_interim_term'$$,
  'fixture: max_interim_term set for the test');
select lives_ok($$insert into public.consent_records (member_id, purpose, policy_version, source)
  select id, 'moderator_public_name', 'test', 'test' from auth.users
   where id in ('c0000000-0000-0000-0000-00000000000c', 'd0000000-0000-0000-0000-00000000000d',
                'f0000000-0000-0000-0000-00000000000f')$$,
  'fixture: naming consent for M, N and O');
select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G4'$$,
  'fixture: G4 marked met for the test only (G2 stays unmet)');

select throws_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('c0000000-0000-0000-0000-00000000000c', 'panelist', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator One') $$,
  '23514', null, 'G2 unmet refuses a panelist grant even when G4 is met');
select lives_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('d0000000-0000-0000-0000-00000000000d', 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator Two') $$,
  'a moderator grant still needs only G4');

select lives_ok($$update public.launch_gates set definition = 'Test definition.', defined_at = now(), status = 'met', met_at = now() where key = 'G2'$$,
  'fixture: G2 marked met for the test only');
select lives_ok($$ insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
  values ('f0000000-0000-0000-0000-00000000000f', 'panelist', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Moderator Three') $$,
  'with G2 and G4 met, a panelist grant is accepted');

select * from finish();
rollback;
