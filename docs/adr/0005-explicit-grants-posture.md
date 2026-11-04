# ADR 0005 — Explicit table grants; never depend on image default privileges

Status: Accepted
Date: 2026-07-08
Relates: ADR 0003 (RLS policies = the authorization intent); .claude/rules/db.md;
migration 20260708051747_explicit_grants.sql.

## Context — the drift incident

The 2026-07-08 audit found pgTAP suite 01 (RLS default-deny) aborting at its
first role switch with 42501, and the jest db tests failing the same way. No
code had changed since the suites were green. The cause was the local stack
image: supabase/postgres 17.6.1.143 (via CLI 2.109.1) no longer ships the
historical default table privileges for tables created by the migration runner
(`postgres` role). Its default ACL was garbled: `anon`, `authenticated`, and
`service_role` received `MAINTAIN, REFERENCES, TRIGGER, TRUNCATE` — and **no**
SELECT/INSERT/UPDATE/DELETE.

Three consequences:

1. `service_role` had no DML anywhere → the backend/test paths 42501'd
   (`GRANT SELECT ON public.profiles TO service_role` hints in the jest output).
2. `anon` lost SELECT on `posts`/`profiles`/`consent_records`, so suite 01's
   anon assertions (`count(*) = 0`, i.e. "grant open, RLS returns zero rows")
   errored instead of returning 0 — the suite ran 1 of its 8 assertions. Anon
   community discovery (a deliberate 1B product decision) kept working only
   because 1B had written its own explicit grant.
3. Silently worse: `anon` held **TRUNCATE** on every table. TRUNCATE is not
   governed by RLS. Nothing exposed it (PostgREST doesn't speak TRUNCATE), but
   it was a live over-grant sitting under our default-deny posture.

`authenticated` kept working throughout only because migration 20260601084807
had written explicit per-table grants — accidental proof of this ADR's point.

## Decision

**Grants are code.** Every table grant is written explicitly in a migration,
per table, per role, per verb — never inherited from whatever default ACL the
current image ships. Migration `20260708051747_explicit_grants.sql`:

- revokes everything the image handed to `anon`/`authenticated`/`service_role`
  on the ten MVP tables (killing the accidental TRUNCATE et al.);
- grants the matrix below;
- pins `ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public` so tables
  and sequences created by future migrations get the conservative baseline
  (`authenticated` + `service_role` DML / sequence usage; **never anon**).

### The layering (why grants AND RLS)

The grant is the table-level gate; RLS filters rows *within* granted access.
A missing grant fails with 42501 before RLS is even consulted. Default-deny
RLS remains the real row-level protection; grants decide whether a role may
ask at all.

### The authorization matrix (derived from the ADR 0003 RLS policies)

| table            | anon   | authenticated               | service_role |
|------------------|--------|-----------------------------|--------------|
| profiles         | SELECT | SELECT,INSERT,UPDATE,DELETE | full DML     |
| self_id_tags     | —      | SELECT                      | full DML     |
| consent_records  | SELECT | SELECT,INSERT,UPDATE        | full DML     |
| health_self_ids  | —      | SELECT,INSERT,UPDATE,DELETE | full DML     |
| communities      | SELECT | SELECT                      | full DML     |
| memberships      | —      | SELECT,INSERT,DELETE        | full DML     |
| posts            | SELECT | SELECT,INSERT,UPDATE,DELETE | full DML     |
| comments         | —      | SELECT,INSERT,UPDATE,DELETE | full DML     |
| upbeats          | —      | SELECT,INSERT,DELETE        | full DML     |
| journey_entries  | —      | SELECT,INSERT,UPDATE,DELETE | full DML     |

- `authenticated` gets exactly the verbs its RLS policies use — no UPDATE
  grant where no UPDATE policy exists (memberships, upbeats), no DELETE on
  consent_records (erasure happens only through the rights workflow / cascade).
- `service_role` (backend-only, RLS-bypassing by design) gets DML on every
  table but none of the maintenance verbs (TRUNCATE/TRIGGER/REFERENCES/
  MAINTAIN).
- `anon` SELECT on `communities` is the approved 1B public-discovery surface.

### The anon exception (founder-approved 2026-07-08)

`anon` also holds SELECT on `posts`, `profiles`, and `consent_records`, where
no anon RLS policy exists — so anon gets **zero rows**, not an error. This is
deliberate and was decided when the strict "no anon grants on member tables"
posture collided with suite 01's assertion style (`count(*) = 0` requires the
gate open): keeping the gate open means the crown-jewel test exercises *RLS
itself*, and it matches how production PostgREST behaved on the historical
image (empty result, not 42501). The other six tables — `self_id_tags`,
`health_self_ids`, `memberships`, `comments`, `upbeats`, `journey_entries` —
have **no anon grant at all**; that absence is deliberate defense-in-depth,
not an omission.

## Standing rule for future tables

1. Default privileges give a new table `authenticated` + `service_role` DML
   automatically. `anon` gets nothing by default.
2. Any anon-readable surface must be granted explicitly, per table, in the
   migration that creates it, next to the RLS policy that justifies it.
3. Every new table enables RLS with explicit policies before any data touches
   it (supabase-rls skill; unchanged by this ADR).
4. Do not assume the Supabase image's defaults for anything grant-shaped.
   When the image changes, `supabase test db` is the tripwire — suite 01
   checks both directions (communities readable; member tables empty).

## Privacy review

privacy-reviewer PASS on all 8 charge items (no over-grant vs. policy verbs;
anon confined to the four approved tables; defaults exclude anon; service_role
DML-only; no policy or test modified; no new health-data exposure — the anon
grants expose zero rows under default-deny RLS, and consent_records carries no
diagnosis/symptom content). Non-blocking advisories recorded:

- **A.** Add a guard (pre-commit or CI) that fails if a future migration adds
  a `create policy ... to anon` on `profiles`, `consent_records`,
  `health_self_ids`, or `self_id_tags` without an ADR reference — the anon
  grant would make such a policy live immediately.
- **B.** If suite 01's anon assertions ever move to `throws_ok('42501')`
  style, revisit and remove the three test-motivated anon grants — don't let
  them outlive their justification.
- **C.** Pre-existing gap (not introduced here): the append-only audit trail
  for privileged actions required by .claude/rules/db.md does not exist yet.

## Consequences

- All four pgTAP suites (34 assertions) and all jest tests (23 rn + 5 db) are
  green on the current image; Phase 1D is unblocked.
- The repo no longer depends on image default ACLs for any role's table
  access, so the next image drift breaks loudly in tests, not silently in
  posture.
