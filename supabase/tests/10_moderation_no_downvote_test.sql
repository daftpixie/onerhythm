-- T1 (plan §6): no downvote anywhere in the moderation model. Every rating
-- or decision is presence-only or a closed set of positive choices; no
-- negative column, enum value or weight exists. ADR 0019, ADR 0021.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select has_table('public', 'moderation_actions', 'moderation_actions exists');
select has_table('public', 'appeal_decisions', 'appeal_decisions exists');
select hasnt_column('public', 'appeal_decisions', 'weight',
  'appeal decisions carry no weight: one equal vote per panelist');
select col_is_unique('public', 'appeal_decisions', array['appeal_id', 'panelist_pseudonym'],
  'one decision per panelist per appeal');
select enum_has_labels('public', 'appeal_choice', array['uphold', 'overturn'],
  'appeal choices are a closed set');
select is(
  (select count(*)::int from information_schema.columns
    where table_schema = 'public' and table_name = any(array['governance_config','floor_versions','floor_items','floor_reexamination_requests','floor_reexamination_answers','triage_lists','reports','moderation_items','moderation_actions','removed_content','member_blocks','member_bans','moderator_grants','moderator_pseudonyms','appeals','appeal_decisions','second_look_requests','legal_holds','moderation_log_public','moderation_audit','launch_gates','launch_gate_history'])
      and column_name ~ '(rating|score|weight|vote|helpful)'),
  0, 'no rating, score, weight or vote column in any moderation table');
select is(
  (select count(*)::int from pg_enum e join pg_type t on t.oid = e.enumtypid
     join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and e.enumlabel ~ '(not_helpful|unhelpful|negative)'),
  0, 'no negative label in any public enum');

reset role;
select * from finish();
rollback;
