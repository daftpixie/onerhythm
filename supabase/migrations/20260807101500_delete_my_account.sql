-- Member-invoked account deletion — Addendum A B13, launch gate.
--
-- The cascade itself already exists and is proven (supabase/tests/
-- 03_deletion_cascade_test.sql): auth.users -> profiles -> every member-owned
-- table, all `on delete cascade`. What was missing was a way for the MEMBER to
-- invoke it. A client JWT cannot delete from auth.users, and handing a
-- service_role key to anything client-side is out of the question
-- (.claude/rules/db.md: privileged keys are backend-only).
--
-- So: one SECURITY DEFINER function that takes NO ARGUMENT. That is the whole
-- security model. There is no target parameter to forge, guess, or inject — the
-- function can only ever act on auth.uid(). supabase/tests/05 asserts the
-- zero-argument signature explicitly, so adding a parameter later has to break
-- a test rather than slip through review.
--
-- Deliberately NO audit row. CLAUDE.md asks that privileged actions be audited,
-- but an audit trail keyed to a deleted member re-creates the very identifier
-- the deletion existed to remove, and .claude/rules/db.md forbids ledger
-- immutability that conflicts with deletion rights. Safety > privacy only when
-- there is a safety interest; there is none here. Recorded in ADR 0012. If an
-- audit signal is ever wanted it must be non-identifying (a date-bucketed
-- count), never a member id.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := auth.uid();
begin
  if v_member is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Removing the auth user cascades to public.profiles and, from there, to
  -- consent_records, health_self_ids, memberships, posts, comments, upbeats
  -- and journey_entries. No deletion logic is restated here on purpose: the
  -- cascade is the single tested path, so nothing can be forgotten by drift.
  delete from auth.users where id = v_member;
end;
$$;

comment on function public.delete_my_account() is
  'Deletes the CALLING member''s account and, by cascade, every row they own. '
  'Takes no argument by design: auth.uid() is the only possible target.';

-- Least privilege: no ambient execute, and anon can never reach it.
revoke execute on function public.delete_my_account() from public;
revoke execute on function public.delete_my_account() from anon;
grant  execute on function public.delete_my_account() to authenticated;
