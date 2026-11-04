-- Crown-jewel invariant 3: CONSENT-GATING OF HEALTH SELF-ID.
-- diagnosis/symptom self-ID cannot exist or be read without a current
-- (non-withdrawn) consent record for that purpose. Self-ID is opt-in.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- Seed a member and a vocabulary tag (as superuser). No consent yet.
do $$
declare a uuid := '11111111-1111-1111-1111-111111111111';
begin
  insert into auth.users (id, email) values (a, 'a@test.local');
  -- profile auto-created by handle_new_user (Phase 1C); upsert the fixture.
  insert into public.profiles (id, display_name) values (a, 'Member A')
    on conflict (id) do update set display_name = excluded.display_name;
  -- synthetic test-only code so it does not collide with the seeded vocabulary.
  insert into public.self_id_tags (id, tag_type, code, label)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'diagnosis', 'pgtap_dx', 'Test diagnosis');
end $$;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);

-- Without a current consent record, self-ID cannot be created.
select throws_ok(
  $$ insert into public.health_self_ids (member_id, tag_id)
     values ('11111111-1111-1111-1111-111111111111',
             'aaaaaaaa-0000-0000-0000-000000000001') $$,
  '42501',
  null,
  'self-ID insert is denied without a current consent record'
);

-- Granting consent for the health_self_id purpose.
select lives_ok(
  $$ insert into public.consent_records (member_id, purpose, policy_version, source)
     values ('11111111-1111-1111-1111-111111111111', 'health_self_id', 'v1', 'test') $$,
  'member can grant health_self_id consent'
);

-- With current consent, self-ID can now be created and read.
select lives_ok(
  $$ insert into public.health_self_ids (member_id, tag_id)
     values ('11111111-1111-1111-1111-111111111111',
             'aaaaaaaa-0000-0000-0000-000000000001') $$,
  'self-ID insert succeeds with a current consent record'
);
select is((select count(*) from public.health_self_ids), 1::bigint,
  'member can read their own self-ID with current consent');

-- Withdrawing consent.
select lives_ok(
  $$ update public.consent_records set withdrawn_at = now()
     where member_id = '11111111-1111-1111-1111-111111111111'
       and purpose = 'health_self_id' and withdrawn_at is null $$,
  'member can withdraw health_self_id consent'
);

-- After withdrawal the self-ID no longer exists / is not readable.
select is((select count(*) from public.health_self_ids), 0::bigint,
  'self-ID is gone after consent withdrawal (cannot exist without current consent)');

reset role;

-- Consent state is health data. has_current_health_consent is SECURITY
-- DEFINER, so a client that could call it with another member's id would read
-- consent_records past RLS. Only the health_self_ids policies use it, always
-- with auth.uid().
select ok(
  not has_function_privilege('anon', 'public.has_current_health_consent(uuid)', 'execute'),
  'anon holds no EXECUTE on has_current_health_consent'
);

-- Give member A a current consent again (as superuser), then ask as member B.
insert into public.consent_records (member_id, purpose, policy_version, source)
  values ('11111111-1111-1111-1111-111111111111', 'health_self_id', 'pgtap', 'pgtap');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
select is(public.has_current_health_consent('11111111-1111-1111-1111-111111111111'), true,
  'member A''s own consent check still works (the gate the policies rely on)');

select set_config('request.jwt.claims',
  json_build_object('sub', '22222222-2222-2222-2222-222222222222')::text, true);
select is(public.has_current_health_consent('11111111-1111-1111-1111-111111111111'), false,
  'member B learns nothing about member A''s consent state');

reset role;
select * from finish();
rollback;
