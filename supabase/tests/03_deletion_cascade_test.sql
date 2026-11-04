-- Crown-jewel invariant 4: DELETION CASCADE.
-- Deleting a member (their auth.users row) removes their account and every
-- member-owned row: consent records, self-ID tags, upbeats, journey entries,
-- posts, comments, memberships, profile — and, since the moderation core
-- (20261029130100, ADR 0019 §9), every member-linked moderation row: reports,
-- blocks on either side, bans, appeals, second-look and re-examination
-- requests, removed content, grants and the pseudonym mapping. Proves "delete
-- my data" deletes. (supabase/tests/13 covers the moderation cascade in more
-- depth; this file is the one the export cross-check reads.)
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

-- Build a full graph for one member (as superuser; RLS bypassed for setup).
do $$
declare a uuid := '11111111-1111-1111-1111-111111111111';
        c uuid := '33333333-3333-3333-3333-333333333333';
        p uuid := '44444444-4444-4444-4444-444444444444';
        cm uuid := '55555555-5555-5555-5555-555555555555';
        tg uuid := 'aaaaaaaa-0000-0000-0000-000000000001';
        b uuid := '22222222-2222-2222-2222-222222222222';
        pb uuid := '66666666-6666-6666-6666-666666666666';
        fi uuid := '77777777-7777-7777-7777-777777777777';
        ia uuid := '88888888-0000-0000-0000-00000000000a';
        ib uuid := '88888888-0000-0000-0000-00000000000b';
        ic uuid := '88888888-0000-0000-0000-00000000000c';
        ac1 uuid := '99999999-0000-0000-0000-000000000001';
        ac3 uuid := '99999999-0000-0000-0000-000000000003';
begin
  insert into auth.users (id, email) values (a, 'a@test.local');
  -- profile auto-created by handle_new_user (Phase 1C); upsert the fixture.
  insert into public.profiles (id, display_name) values (a, 'Member A')
    on conflict (id) do update set display_name = excluded.display_name;
  insert into public.communities (id, slug, name) values (c, 'casc-test', 'Cascade Test');
  insert into public.memberships (member_id, community_id) values (a, c);
  insert into public.posts (id, author_id, community_id, title, body)
    values (p, a, c, 'A post', 'by A');
  insert into public.comments (id, post_id, author_id, body) values (cm, p, a, 'a comment');
  insert into public.upbeats (member_id, post_id) values (a, p);
  insert into public.upbeats (member_id, comment_id) values (a, cm);
  insert into public.journey_entries (author_id, title, body)
    values (a, 'My journey', 'long form');
  -- synthetic test-only code so it does not collide with the seeded vocabulary.
  insert into public.self_id_tags (id, tag_type, code, label)
    values (tg, 'diagnosis', 'pgtap_dx', 'Test diagnosis');
  insert into public.consent_records (member_id, purpose, policy_version, source)
    values (a, 'health_self_id', 'v1', 'test');
  insert into public.health_self_ids (member_id, tag_id) values (a, tg);

  -- Moderation rows. A second member B, so blocks and reports have a target.
  -- The config values and G4 are set for this test only (all NULL/unmet in
  -- the migration); the transaction rolls back.
  insert into auth.users (id, email) values (b, 'b@test.local');
  insert into public.posts (id, author_id, community_id, title, body)
    values (pb, b, c, 'B post', 'by B');
  insert into public.floor_versions (floor, version, content_sha256, change_kind, reason, announced_at, effective_at)
    values ('safety', 1, repeat('0', 64), 'initial', 'Test.', now() - interval '1 day', now() - interval '1 day');
  insert into public.floor_items (id, floor, version, item_number, text)
    values (fi, 'safety', 1, 1, 'Dangerous medical misinformation');
  update public.launch_gates set definition = 'Test.', status = 'met', met_at = now() where key = 'G4';
  update public.governance_config set value = interval '90 days' where key = 'max_interim_term';
  update public.governance_config set value = interval '30 days' where key = 'max_ban_term';
  insert into public.consent_records (member_id, purpose, policy_version, source)
    values (a, 'moderator_public_name', 'v1', 'test');
  insert into public.moderator_grants (member_id, role, basis, granted_at, expires_at, public_name)
    values (a, 'moderator', 'interim', now() - interval '1 hour', now() + interval '30 days', 'Member A');
  insert into public.moderator_pseudonyms (member_id, pseudonym) values (a, 'Cascade Moderator');
  insert into public.moderation_items (id, post_id, source, category, tier)
    values (ib, pb, 'report', 'dangerous_misinfo', 3), (ia, p, 'report', 'dangerous_misinfo', 3);
  insert into public.moderation_items (id, comment_id, source, category, tier)
    values (ic, cm, 'report', 'tier1', 1);
  insert into public.reports (reporter_id, post_id, reason, note, item_id)
    values (a, pb, 'dangerous_misinfo', 'A note.', ib);
  insert into public.member_blocks (blocker_id, blocked_id) values (a, b), (b, a);
  insert into public.moderation_actions (id, item_id, action, floor_item_id, reason, actor_pseudonym)
    values (ac3, ia, 'remove', fi, 'Test.', 'Another Moderator');
  insert into public.moderation_actions (id, item_id, action, tier1_rule, reason, actor_pseudonym)
    values (ac1, ic, 'request_edit', 'off_topic', 'Test.', 'Another Moderator');
  insert into public.member_bans (member_id, floor_item_id, reason, ends_at, proposed_by_pseudonym)
    values (a, fi, 'Test.', now() + interval '7 days', 'Another Moderator');
  insert into public.appeals (action_id, appellant_id, appellant_label, statement)
    values (ac1, a, 'Member 1', 'Please look again.');
  insert into public.second_look_requests (requester_id, action_id, statement)
    values (a, ac3, 'Please look again.');
  insert into public.floor_reexamination_requests (requester_id, floor_item_id, request_text)
    values (a, fi, 'Why this rule?');
  insert into public.removed_content (post_id, author_id, title, body, kind)
    values (p, a, 'A post', 'by A', 'removed');
end $$;

-- Sanity: the member's data exists before deletion.
select isnt((select count(*) from public.health_self_ids), 0::bigint,
  'member has self-ID data before deletion');

-- Delete the account.
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

-- Every member-owned table now holds zero rows for that member.
select is((select count(*) from public.profiles
            where id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'profile deleted');
select is((select count(*) from public.consent_records
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'consent records deleted');
select is((select count(*) from public.health_self_ids
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'self-ID tags deleted');
select is((select count(*) from public.memberships
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'memberships deleted');
select is((select count(*) from public.posts
            where author_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'posts deleted');
select is((select count(*) from public.comments
            where author_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'comments deleted');
select is((select count(*) from public.upbeats
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'upbeats deleted');
select is((select count(*) from public.journey_entries
            where author_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'journey entries deleted');

-- Moderation rows (ADR 0019 §9).
select is((select count(*) from public.reports
            where reporter_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'reports deleted');
select is((select count(*) from public.member_blocks
            where '11111111-1111-1111-1111-111111111111' in (blocker_id, blocked_id)),
  0::bigint, 'blocks on either side deleted');
select is((select count(*) from public.member_bans
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'bans deleted');
select is((select count(*) from public.appeals
            where appellant_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'appeals deleted');
select is((select count(*) from public.second_look_requests
            where requester_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'second-look requests deleted');
select is((select count(*) from public.floor_reexamination_requests
            where requester_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 're-examination requests deleted');
select is((select count(*) from public.removed_content
            where author_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'removed content deleted');
select is((select count(*) from public.moderator_grants
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'moderator grants deleted');
select is((select count(*) from public.moderation_items
            where id in ('88888888-0000-0000-0000-00000000000a', '88888888-0000-0000-0000-00000000000c')),
  0::bigint, 'moderation items on the member''s content deleted');
select is((select count(*) from public.moderation_actions
            where id in ('99999999-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000003')),
  0::bigint, 'moderation actions on the member''s content deleted');
select is((select count(*) from public.moderator_pseudonyms
            where member_id = '11111111-1111-1111-1111-111111111111'),
  0::bigint, 'pseudonym mapping deleted');

select * from finish();
rollback;
