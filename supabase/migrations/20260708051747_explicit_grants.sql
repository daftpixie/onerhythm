-- OneRhythm — explicit table grants (image-drift repair)
--
-- WHY THIS EXISTS (2026-07-08): supabase/postgres 17.6.1.143 (via CLI 2.109.1)
-- no longer ships the historical default table privileges for the migration-
-- runner (postgres) role. Tables created by our migrations received a garbled
-- default ACL: anon / authenticated / service_role got MAINTAIN, REFERENCES,
-- TRIGGER, TRUNCATE — and NO select/insert/update/delete. Two consequences:
--   1. service_role had no DML at all (42501 in the backend/test paths),
--      and anon lost the deliberate 1B public read of communities-adjacent
--      surfaces, aborting pgTAP suite 01 at its first role switch.
--   2. Worse, anon held TRUNCATE (which RLS does NOT govern) on every table.
-- This migration REVOKES the accidental privileges and GRANTS an explicit,
-- minimal matrix derived from the RLS policies in 20260601084807 (the policies
-- are the source of truth for intent), then pins default privileges so tables
-- created by FUTURE migrations get the same baseline instead of whatever the
-- image happens to ship.
--
-- LAYERING: grants are the table-level gate; RLS filters rows WITHIN granted
-- access. anon holds SELECT on communities (public discovery, approved in 1B)
-- and on posts / profiles / consent_records — where default-deny RLS yields
-- zero rows (approved 2026-07-08: this keeps the table gate open so the
-- crown-jewel RLS assertions exercise RLS itself, matching production
-- PostgREST semantics). anon holds NOTHING on health_self_ids, memberships,
-- upbeats, comments, journey_entries — absence of a grant is deliberate
-- defense-in-depth on those.
--
-- AUTHORIZATION MATRIX (verbs mirror the RLS policies; no policy permits a
-- verb that is not granted here, and vice versa for authenticated):
--
--   table            | anon   | authenticated                | service_role
--   -----------------+--------+------------------------------+-------------
--   profiles         | SELECT | SELECT,INSERT,UPDATE,DELETE  | full DML
--   self_id_tags     | —      | SELECT                       | full DML
--   consent_records  | SELECT | SELECT,INSERT,UPDATE         | full DML
--   health_self_ids  | —      | SELECT,INSERT,UPDATE,DELETE  | full DML
--   communities      | SELECT | SELECT                       | full DML
--   memberships      | —      | SELECT,INSERT,DELETE         | full DML
--   posts            | SELECT | SELECT,INSERT,UPDATE,DELETE  | full DML
--   comments         | —      | SELECT,INSERT,UPDATE,DELETE  | full DML
--   upbeats          | —      | SELECT,INSERT,DELETE         | full DML
--   journey_entries  | —      | SELECT,INSERT,UPDATE,DELETE  | full DML
--
--   (full DML = SELECT,INSERT,UPDATE,DELETE. service_role is the backend-only
--   privileged role — RLS-bypassing by design, never client-side, per
--   .claude/rules/db.md — so it gets DML on every table, but NOT the
--   maintenance verbs TRUNCATE/TRIGGER/REFERENCES/MAINTAIN.)
--
-- RULE FOR FUTURE TABLES: default privileges below cover authenticated +
-- service_role only. anon access is opt-in PER TABLE — a future migration that
-- wants an anon-readable surface must say so with its own explicit GRANT next
-- to the policy that justifies it.

-- ===========================================================================
-- 1. Strip the accidental image-shipped privileges (incl. anon TRUNCATE).
--    RLS policies are untouched; this only closes the table-level gate.
-- ===========================================================================
revoke all on public.profiles,       public.self_id_tags,
              public.consent_records, public.health_self_ids,
              public.communities,     public.memberships,
              public.posts,           public.comments,
              public.upbeats,         public.journey_entries
  from anon, authenticated, service_role;

-- ===========================================================================
-- 2. Schema gate (idempotent; the image still grants these today, but the
--    whole point of this migration is to stop depending on that).
-- ===========================================================================
grant usage on schema public to anon, authenticated, service_role;

-- ===========================================================================
-- 3. anon — public surfaces + the three tables whose default-deny RLS the
--    crown-jewel suite exercises as anon (zero rows by policy).
-- ===========================================================================
grant select on public.communities     to anon;  -- public discovery (ADR 0003)
grant select on public.posts           to anon;  -- RLS yields 0 rows (no anon policy)
grant select on public.profiles        to anon;  -- RLS yields 0 rows (no anon policy)
grant select on public.consent_records to anon;  -- RLS yields 0 rows (no anon policy)
-- NO anon grants on: self_id_tags, health_self_ids, memberships, comments,
-- upbeats, journey_entries — deliberate absence, not an omission.

-- ===========================================================================
-- 4. authenticated — exactly the verbs the RLS policies use (restated from
--    20260601084807 so this migration alone reproduces the full matrix after
--    the revoke above).
-- ===========================================================================
grant select, insert, update, delete on public.profiles        to authenticated;
grant select                         on public.self_id_tags    to authenticated;
grant select, insert, update         on public.consent_records to authenticated; -- no DELETE policy: erasure via rights workflow only
grant select, insert, update, delete on public.health_self_ids to authenticated;
grant select                         on public.communities     to authenticated;
grant select, insert,         delete on public.memberships     to authenticated; -- no UPDATE policy
grant select, insert, update, delete on public.posts           to authenticated;
grant select, insert, update, delete on public.comments        to authenticated;
grant select, insert,         delete on public.upbeats         to authenticated; -- no UPDATE policy (un-upbeat = delete)
grant select, insert, update, delete on public.journey_entries to authenticated;

-- ===========================================================================
-- 5. service_role — backend-only DML on every table (this image no longer
--    auto-grants it; BYPASSRLS semantics assume the table gate is open).
-- ===========================================================================
grant select, insert, update, delete on public.profiles        to service_role;
grant select, insert, update, delete on public.self_id_tags    to service_role;
grant select, insert, update, delete on public.consent_records to service_role;
grant select, insert, update, delete on public.health_self_ids to service_role;
grant select, insert, update, delete on public.communities     to service_role;
grant select, insert, update, delete on public.memberships     to service_role;
grant select, insert, update, delete on public.posts           to service_role;
grant select, insert, update, delete on public.comments        to service_role;
grant select, insert, update, delete on public.upbeats         to service_role;
grant select, insert, update, delete on public.journey_entries to service_role;

-- ===========================================================================
-- 6. Sequences: all current PKs are uuid — no sequences exist in public
--    today, so there is nothing to grant on. The drifted default ACL would
--    hand future sequences UPDATE (setval!) to anon; the defaults below pin
--    the intended baseline instead.
-- ===========================================================================

-- ===========================================================================
-- 7. Default privileges for FUTURE tables/sequences created by the migration
--    runner (postgres): wipe the drifted defaults, then grant the conservative
--    baseline — authenticated + service_role only. anon stays opt-in per
--    table. New tables still start row-inaccessible until their migration
--    enables RLS and writes policies (supabase-rls rule: no table exists
--    without RLS).
-- ===========================================================================
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to authenticated, service_role;
