-- Client EXECUTE on public functions is an ALLOWLIST.
--
-- SECURITY DEFINER functions run past RLS, so a client that can call one it
-- should not is a data path. 20261029120000 found two: the ops purge and a
-- consent-state oracle. Revoking from PUBLIC alone never worked here (the
-- postgres default privileges granted anon and authenticated directly).
-- Default privileges now deny client EXECUTE, but a function created another
-- way (dashboard SQL editor, an extension) would not be covered. This catches
-- any drift, whatever its cause.
--
-- Trigger functions are excluded: PostgREST cannot call them as RPCs.
-- A new client-callable function joins a list below in its own migration's PR.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select set_eq(
  $$ select p.oid::regprocedure::text
       from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and pg_get_function_result(p.oid) <> 'trigger'
        and has_function_privilege('anon', p.oid, 'execute') $$,
  array[
    'subscribe_to_updates(text,text)',
    'confirm_updates_subscription(text)',
    'unsubscribe_from_updates(text)',
    -- 20261029130200: Q3 names interim moderators publicly (ADR 0019 §3).
    'interim_moderators_public()'
  ],
  'anon can execute only the three updates-list functions and the interim-moderator list'
);

select set_eq(
  $$ select p.oid::regprocedure::text
       from pg_proc p
      where p.pronamespace = 'public'::regnamespace
        and pg_get_function_result(p.oid) <> 'trigger'
        and has_function_privilege('authenticated', p.oid, 'execute') $$,
  array[
    'subscribe_to_updates(text,text)',
    'confirm_updates_subscription(text)',
    'unsubscribe_from_updates(text)',
    'has_current_health_consent(uuid)',
    'delete_my_account()',
    -- 20261029130200, the moderation EXECUTE matrix (ADR 0019 §4). Each one
    -- checks the caller itself: moderator, panelist, author or auth.uid().
    'is_moderator()',
    'is_banned_now()',
    'report_content(uuid,uuid,report_reason,text)',
    'moderation_queue()',
    'moderate(uuid,moderation_action_kind,uuid,tier1_rule,text,timestamp with time zone)',
    'confirm_action(uuid)',
    'submit_appeal(uuid,text)',
    'withdraw_appeal(uuid)',
    'request_second_look(uuid,text)',
    'decide_appeal(uuid,appeal_choice)',
    'my_moderation_notices()',
    'export_my_moderation_records()',
    'interim_moderators_public()'
  ],
  'authenticated can execute only the allowlisted functions'
);

select * from finish();
rollback;
