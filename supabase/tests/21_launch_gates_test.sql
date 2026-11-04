-- T8 (database half): launch gates G1-G9 exist, start unmet, cannot be
-- marked met without a definition, are written only by the service, and
-- every change leaves a history row. ADR 0021.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select has_table('public', 'launch_gates', 'launch_gates exists');
select set_eq($$ select key from public.launch_gates $$,
  array['G1','G2','G3','G4','G5','G6','G7','G8','G9'], 'gates G1-G9 are seeded');
select is((select count(*)::int from public.launch_gates where status <> 'unmet'), 0,
  'every gate starts unmet');
select throws_ok($$ update public.launch_gates set status = 'met', met_at = now() where key = 'G1' $$,
  '23514', null, 'a gate cannot be met with no definition');
select lives_ok($$ update public.launch_gates set definition = 'Test definition.', defined_at = now() where key = 'G5' $$,
  'the service can record a definition');
select is((select count(*)::int from public.launch_gate_history where gate_key = 'G5'), 1,
  'the change left a public history row');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select throws_ok($$ update public.launch_gates set status = 'met' where key = 'G1' $$, '42501', null,
  'a member cannot change a gate');

reset role;
select * from finish();
rollback;
