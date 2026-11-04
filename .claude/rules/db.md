# Data model & DB rules

- RLS on EVERY table by default; new tables are locked down before use.
- **New tables repeat the `authenticated` REVOKE.** Default privileges hand every
  new table in `public` full DML to `authenticated` (see
  `docs/PRODUCTION_READINESS.md` §1.6). Each migration that creates a table
  revokes, then grants back only the verbs its policies need, and lists them in
  an authorization matrix in the migration header.
- **New functions grant EXECUTE explicitly.** Each migration that creates a
  function revokes EXECUTE from `public, anon, authenticated` (and
  `service_role` unless the matrix gives it) by name, then grants only what the
  function needs. The default privileges from `20261029120000` remove the
  direct `anon`/`authenticated` grants, but PostgreSQL's built-in PUBLIC grant
  survives them, so neither the defaults nor a `revoke ... from public` alone
  is enough (PRODUCTION_READINESS §1.6). A SECURITY DEFINER helper that takes a
  member id answers only for `auth.uid()`. A helper that only RLS policies
  call goes in a schema PostgREST does not expose (`moderation_private`).
- service_role / privileged keys are backend-only; every privileged action is
  logged to an append-only audit trail. **Audit and provenance logs carry no
  member identifiers.** They record actor role (or operator), time, function or
  table, and row count.
- **Break-glass access** to health-data tables (journals and later ones) by
  `service_role` logs operator, time, table and row count. Short-retention access
  logs (period set in the data inventory) let affected members be identified for
  a breach notice — and nothing else. They are a separate, member-linked table,
  not the audit trail: deleted on schedule, and either covered by the
  deletion-cascade test or given a documented rights-workflow exception in their
  ADR.
- Upbeats: presence/absence row. There is NO downvote column/state. Score =
  count of upbeats. (Hook-guarded.) No other rating anywhere may carry a negative
  value or state either.
- Ballots: unique(proposal_id, voter_id) enforces one-equal-vote; CHECK
  constraints enforce valid choices.
- consent_records: append-only ledger (purpose, policy_version, granted_at,
  withdrawn_at, source); deletable only via the rights workflow. New consent
  purposes (`visit_prep_journal`, `visit_prep_ai`, and each purpose named in its
  own ADR) are added to the `consent_purpose` enum, and
  `has_current_health_consent` takes the purpose as an argument when the first
  new purpose is built.
- **Journals live in separate, owner-only tables with no publish column** —
  never `journey_entries`. No moderator, admin, professional or coach policy on
  them. They enter the authorization matrix.
- **Every member-linked table joins the export and the deletion-cascade tests**
  (`MEMBER_OWNED_TABLES` in `src/lib/rights/export.ts` and
  `supabase/tests/03_deletion_cascade_test.sql`).
- treasury_ledger and all governance rows are deletable-where-required (no
  ledger immutability that conflicts with deletion rights). The privileged-action
  audit trail holds no member identifiers, so the rights workflow has no reason
  to remove it and does not.
- Safe DB evolution: expand -> backfill -> dual-read/dual-write -> contract,
  behind feature flags, with a written data-repair playbook.
- No payment/entitlement tables — member support is voluntary and ungated.
