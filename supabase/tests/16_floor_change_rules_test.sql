-- T10: the rule for changing a floor (ADR 0017 Decision 4; ADR 0020), as
-- the database enforces it. Each case is a deliberate violation.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select lives_ok($$insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
  values ('safety', 1, repeat('0', 64), 'initial', 'First publication.', now() - interval '1 day', now() - interval '1 day'),
         ('privacy', 1, repeat('1', 64), 'initial', 'First publication.', now() - interval '1 day', now() - interval '1 day')$$, 'fixture: safety and privacy floors v1');
select lives_ok($$insert into public.floor_items (id, floor, version, item_number, text) values
  ('40000000-0000-0000-0000-000000000001', 'safety', 1, 1, 'Dangerous medical misinformation'),
  ('40000000-0000-0000-0000-000000000002', 'privacy', 1, 1, 'Consent comes before any health data is used.')$$, 'fixture: floor items');

select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('safety', 2, repeat('2', 64), 'tighten', '', now(), now() + interval '1 day') $$, '23514', null,
  'every change needs a reason');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('safety', 2, repeat('2', 64), 'initial', 'A reason.', now(), now() + interval '1 day') $$, '23514', null,
  'initial is allowed only for a floor with no earlier version');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, adr_ref, legal_review_ref)
     values ('safety', 2, repeat('2', 64), 'loosen', 'A reason.', now(), now() + interval '61 days', now() + interval '60 days', 'ADR 0099', 'LR-1') $$,
  '23514', null, 'no loosening at all while minimum_notice is NULL');
select throws_ok($$ update public.governance_config set value = interval '0' where key = 'minimum_notice' $$,
  '23514', null, 'minimum_notice must be greater than zero');
select lives_ok($$update public.governance_config set value = interval '30 days' where key = 'minimum_notice'$$, 'fixture: minimum_notice set to 30 days for the test');

select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, legal_review_ref)
     values ('safety', 2, repeat('2', 64), 'loosen', 'A reason.', now(), now() + interval '61 days', now() + interval '60 days', 'LR-1') $$,
  '23514', null, 'a loosening needs an ADR');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, adr_ref)
     values ('safety', 2, repeat('2', 64), 'loosen', 'A reason.', now(), now() + interval '61 days', now() + interval '60 days', 'ADR 0099') $$,
  '23514', null, 'a loosening needs legal review');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, adr_ref, legal_review_ref)
     values ('safety', 2, repeat('2', 64), 'loosen', 'A reason.', now(), now() + interval '11 days', now() + interval '10 days', 'ADR 0099', 'LR-1') $$,
  '23514', null, 'a loosening needs at least the minimum notice');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, adr_ref, legal_review_ref)
     values ('safety', 2, repeat('2', 64), 'loosen', 'A reason.', now(), now() + interval '59 days', now() + interval '60 days', 'ADR 0099', 'LR-1') $$,
  '23514', null, 'a loosening cannot take effect before its notice ends');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at, notice_ends_at, adr_ref, legal_review_ref)
     values ('privacy', 2, repeat('2', 64), 'loosen', 'A reason.', now(), now() + interval '61 days', now() + interval '60 days', 'ADR 0099', 'LR-1') $$,
  '23514', null, 'a privacy loosening needs applies_from, fresh opt-in and a policy version');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('safety', 2, repeat('2', 64), 'tighten', 'A reason.', now(), now()) $$,
  '23514', null, 'a plain tighten is announced before it takes effect');
select lives_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('safety', 2, repeat('2', 64), 'tighten_emergency', 'A reason.', now(), now());
  insert into public.floor_items (floor, version, item_number, text) values
    ('safety', 2, 1, 'Dangerous medical misinformation'),
    ('safety', 2, 2, 'A new item.');
  set constraints all immediate $$,
  'an emergency tightening that keeps every item and adds one takes effect at once');
select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('safety', 3, repeat('2', 64), 'tighten', 'A reason.', now(), now() + interval '1 day');
  insert into public.floor_items (floor, version, item_number, text) values
    ('safety', 3, 1, 'A weaker rewording.');
  set constraints all immediate $$,
  '23514', null, 'a "tighten" that rewrites or drops an item is rejected');
select throws_ok($$ update public.floor_items set text = 'Rewritten in place.' where id = '40000000-0000-0000-0000-000000000001' $$,
  '23514', null, 'a published floor item is never rewritten in place');
select throws_ok($$ delete from public.floor_versions where floor = 'privacy' and version = 1 $$,
  '23514', null, 'a published floor version is never deleted');
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select throws_ok($$ insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
     values ('safety', 9, repeat('2', 64), 'tighten', 'A reason.', now(), now() + interval '1 day') $$, '42501', null,
  'a member cannot write a floor');

reset role;
select * from finish();
rollback;
