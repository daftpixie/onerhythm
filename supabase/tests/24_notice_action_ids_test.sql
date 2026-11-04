-- The author's moderation notices carry the action id, so a removal notice
-- can open "Ask us to look again" for that action (build step 4; ADR 0022).
-- They still carry no pseudonym (T22). Written failing first.
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

do $$
begin
  insert into auth.users (id, email) values
    ('a0000000-0000-0000-0000-00000000000a', 'a@mod.test');
  insert into public.communities (id, slug, name) values
    ('30000000-0000-0000-0000-000000000001', 'notice-test', 'Notice Test');
  insert into public.posts (id, author_id, community_id, title, body) values
    ('10000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-00000000000a',
     '30000000-0000-0000-0000-000000000001', 'A post', 'by A');
end $$;

select lives_ok($$
  insert into public.moderation_items (id, post_id, source, category, tier, state) values
    ('50000000-0000-0000-0000-0000000000d1', '10000000-0000-0000-0000-0000000000a1', 'report', 'tier1', 1, 'queued');
  insert into public.moderation_actions (id, item_id, action, tier1_rule, reason, actor_pseudonym) values
    ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-0000000000d1', 'lock', 'off_topic', 'Off topic.', 'Moderator 1')
$$, 'fixture: a Tier 1 lock on A''s post');

select ok(
  exists (select 1 from pg_proc p, unnest(coalesce(p.proargnames, array[]::text[])) a(name)
           where p.proname = 'my_moderation_notices' and a.name = 'action_id'),
  'my_moderation_notices returns action_id');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', 'a0000000-0000-0000-0000-00000000000a', 'role', 'authenticated')::text, true);

select results_eq(
  $$ select (n->>'action_id')::uuid from (select to_jsonb(t) n from public.my_moderation_notices() t) s $$,
  array['60000000-0000-0000-0000-000000000001'::uuid],
  'the author sees the action id of the lock on their post');

reset role;
select is(
  (select count(*)::int from pg_proc p, unnest(coalesce(p.proargnames, array[]::text[])) a(name)
    where p.proname = 'my_moderation_notices' and a.name like '%pseudonym%'),
  0, 'the notices still never include a pseudonym');

select * from finish();
rollback;
