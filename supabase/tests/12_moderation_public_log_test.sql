-- T3: no member identifiers in the public log or the audit log, no free-text
-- reason, no cell under 5, and crisis never per room. ADR 0019 §7.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public', 'moderation_log_public', 'public log exists');
select has_table('public', 'moderation_audit', 'audit log exists');
select columns_are('public', 'moderation_audit',
  array['id', 'at', 'actor_role', 'function_name', 'table_name', 'row_count'],
  'audit log holds role, time, function, table and row count only');
select columns_are('public', 'moderation_log_public',
  array['id', 'week_start', 'kind', 'scope', 'category', 'action', 'count', 'fewer_than_five'],
  'public log holds aggregates only, with no reason text');
select is(
  (select count(*)::int from pg_constraint
    where contype = 'f'
      and conrelid in ('public.moderation_log_public'::regclass, 'public.moderation_audit'::regclass)),
  0, 'neither log has a foreign key to anything, members included');
select throws_ok(
  $$ insert into public.moderation_log_public (week_start, kind, scope, category, action, count, fewer_than_five)
     values (date '2026-10-26', 'action', 'all', 'dangerous_misinfo', 'remove', 2, false) $$,
  '23514', null, 'a cell of 2 cannot be published');
select throws_ok(
  $$ insert into public.moderation_log_public (week_start, kind, scope, category, action, count, fewer_than_five)
     values (date '2026-10-26', 'action', 'community:mod-test', 'crisis', 'sent_crisis_resources', null, true) $$,
  '23514', null, 'crisis is never shown per room');
select lives_ok(
  $$ insert into public.moderation_log_public (week_start, kind, scope, category, action, count, fewer_than_five)
     values (date '2026-10-26', 'action', 'all', 'crisis', 'sent_crisis_resources', null, true) $$,
  'a site-wide crisis count shown as "fewer than 5" is allowed');

reset role;
select * from finish();
rollback;
