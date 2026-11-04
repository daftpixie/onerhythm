-- Crown-jewel invariant 1: NO DOWNVOTE (structural).
-- Upbeats are presence/absence only. There is no signed, weighted, or negative
-- state in the data model. Score = count of upbeats. One upbeat per member per
-- subject.
-- (The phrase "no downvote" is the guard-whitelisted way to name this rule.)
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- The upbeat row's existence IS the positive signal.
select has_table('public', 'upbeats', 'upbeats table exists');

-- Exactly these columns — presence/absence only, nothing that could encode a
-- negative or weighted signal.
select columns_are(
  'public', 'upbeats',
  array['id', 'member_id', 'post_id', 'comment_id', 'journey_entry_id', 'created_at'],
  'upbeats holds only presence/absence columns (no signed/weighted state)'
);

-- Belt-and-braces: the specific forbidden negative-signal columns are absent.
select hasnt_column('public', 'upbeats', 'value',     'upbeats has no value column');
select hasnt_column('public', 'upbeats', 'weight',    'upbeats has no weight column');
select hasnt_column('public', 'upbeats', 'direction', 'upbeats has no direction column');
select hasnt_column('public', 'upbeats', 'vote',      'upbeats has no vote column');
select hasnt_column('public', 'upbeats', 'score',     'upbeats has no score column');

-- One upbeat per member per subject (presence is binary, not cumulative).
select col_is_unique('public', 'upbeats', array['member_id', 'post_id'],
  'one upbeat per member per post');
select col_is_unique('public', 'upbeats', array['member_id', 'comment_id'],
  'one upbeat per member per comment');
select col_is_unique('public', 'upbeats', array['member_id', 'journey_entry_id'],
  'one upbeat per member per journey entry');

-- A subject must be exactly one of post or comment.
select has_check('public', 'upbeats', 'upbeats has an exactly-one-subject CHECK');

-- Functional: a member cannot upbeat the same post twice (seed as superuser,
-- which bypasses RLS, then attempt the duplicate).
do $$
declare
  u uuid := gen_random_uuid();
  c uuid := gen_random_uuid();
  p uuid := gen_random_uuid();
begin
  insert into auth.users (id, email) values (u, 'nd@test.local');
  -- profile auto-created by handle_new_user (Phase 1C); upsert the fixture.
  insert into public.profiles (id, display_name) values (u, 'ND Tester')
    on conflict (id) do update set display_name = excluded.display_name;
  insert into public.communities (id, slug, name) values (c, 'nd-test', 'ND Test');
  insert into public.posts (id, author_id, community_id, title, body)
    values (p, u, c, 'hi', 'body');
  insert into public.upbeats (member_id, post_id) values (u, p);
end $$;

select throws_ok(
  $$ insert into public.upbeats (member_id, post_id)
     select member_id, post_id from public.upbeats limit 1 $$,
  '23505',
  null,
  'a member cannot upbeat the same post twice (unique violation)'
);

select * from finish();
rollback;
