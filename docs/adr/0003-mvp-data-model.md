# ADR 0003 — MVP data model, RLS default-deny, crown-jewel invariants (Phase 1B)

Status: Accepted
Date: 2026-06-01
Supersedes/relates: PRD §7, §8, §12.1; Amendment §8.x, §12.1, §13; ADR 0002.

## Context
Phase 1B builds the OneRhythm MVP schema in Supabase Postgres, locks every table
with row-level security (default-deny), and proves the crown-jewel invariants
that apply now (PRD §14.6) test-first in pgTAP. Out of scope this phase:
governance tables (Phase 3), moderation tables (Phase 2), auth client wiring /
onboarding (Phase 1C), feature screens (Phase 1D), payments, analytics, Storage.

The research spec (the base schema the PRD says to "extend") is NOT in-repo, so
the MVP schema was designed from the PRD's explicit functional requirements.
Every field-level decision inferred in its absence is recorded below for later
reconciliation.

## Decision
Ten tables in `public`, RLS enabled on each with explicit per-operation policies:

- `profiles` — 1:1 with `auth.users` (`id` FK, `ON DELETE CASCADE`); `role` enum
  (patient/caregiver/professional/moderator/admin), `display_name`.
- `self_id_tags` — controlled vocabulary of allowed diagnosis/symptom tags
  (NOT member data; not consent-gated). Authenticated-readable; member writes denied.
- `health_self_ids` — member's opt-in tags referencing `self_id_tags`.
  **Consent-gated** for read and write.
- `consent_records` — versioned consent ledger (purpose, policy_version,
  granted_at, withdrawn_at, source); append-only; deletable only via cascade.
- `communities` / `memberships` — public-readable spaces; self-managed join/leave.
- `posts` / `comments` (self-referential threading) — authenticated read,
  author-owned writes.
- `upbeats` — presence/absence positive feedback; no signed/weighted state.
- `journey_entries` — member blog pages; readable when published or owned.

### How the four invariants are enforced (and tested)
1. **No downvote (structural).** `upbeats` has exactly {id, member_id, post_id,
   comment_id, created_at} — no value/weight/sign/direction column. A
   `CHECK` enforces exactly one subject; two unique constraints enforce one
   upbeat per member per subject. Score = `count(*)`. — `tests/00_no_downvote_test.sql`
2. **RLS default-deny.** Every table has `ENABLE ROW LEVEL SECURITY` plus explicit
   policies; no permissive default. Anon is denied everywhere except public
   community names. — `tests/01_rls_default_deny_test.sql`
3. **Consent-gating.** `health_self_ids` SELECT/INSERT/UPDATE require a current
   (`withdrawn_at IS NULL`) `health_self_id` consent via the SECURITY DEFINER
   helper `has_current_health_consent`. A withdrawal trigger
   (`purge_self_id_on_consent_withdrawal`) deletes the member's self-ID rows so
   the data cannot exist at rest without current consent. — `tests/02_consent_gating_test.sql`
4. **Deletion cascade.** `ON DELETE CASCADE` from `auth.users → profiles →` every
   member-owned table (and `posts/comments → upbeats`). Deleting the account
   purges everything. — `tests/03_deletion_cascade_test.sql`

### Deliberate design choices worth recording
- **`consent_records` append-only guard** (`consent_records_append_only`
  BEFORE UPDATE): the only permitted mutation is a one-way withdrawal
  (`withdrawn_at` NULL → timestamp); a withdrawn record cannot be revived or
  edited; no member DELETE policy. Erasure happens solely via account-deletion
  cascade (the rights workflow).
- **`health_self_ids` DELETE policy intentionally omits the consent check**
  (`using (member_id = auth.uid())` only). A member must always be able to remove
  their own tags — including after withdrawing consent. This is deliberate, not a
  gap. (Per privacy-reviewer advisory C.)
- **SECURITY DEFINER functions pin `search_path = ''`** and fully qualify table
  names, eliminating search-path injection.
- **`FORCE ROW LEVEL SECURITY` is not set.** Only the Supabase `postgres`/
  `service_role` (backend-only) bypasses RLS today, which is standard Supabase
  practice. If a future migration grants an application role table ownership,
  add `FORCE ROW LEVEL SECURITY`. (Privacy-reviewer advisory B.)

## RESEARCH-SPEC RECONCILIATION (inferences to revisit when the spec lands)
1. `profiles.id` = `auth.users.id` (1:1); spec may use a separate surrogate key.
2. `profiles.role` defaults to `patient`; `display_name` required.
3. `profiles` SELECT is authenticated-wide (public display_name/role); spec may restrict.
4. `self_id_tag_type` = {diagnosis, physical_symptom, emotional_symptom},
   inferred from PRD §7.1's "physical and psychological."
5. **Controlled vocabulary** (`self_id_tags`) is used instead of free text
   (per approval note). The seeded allowed set — diagnosis: afib, svt, arvc,
   long_qt, vt, pvcs; physical: palpitations, dizziness, shortness_of_breath,
   fatigue, chest_discomfort, syncope; emotional: anxiety, depression,
   fear_of_recurrence, sleep_difficulty — is grounded in the diagnosis
   communities + PRD §1 (anxiety/depression) but **MUST reconcile with wireframe
   B3 (not in-repo)**. The vocabulary is governance-extensible later
   (admin add/deactivate → eventually Tier-1).
6. `consent_purpose` enum = {health_self_id} only; spec may define more purposes.
7. Withdrawal trigger deletes self-ID rows — design choice to enforce
   "cannot exist without current consent."
8. `upbeats` is polymorphic via two nullable FKs + a CHECK (vs. a
   subject_type/subject_id pair) — chosen so `ON DELETE CASCADE` works natively.
9. **No denormalized `posts.upbeat_count`** this phase. PRD §13 lists it as a
   perf optimization; deferred so the no-downvote invariant stays exactly
   "score = count(upbeats)." Revisit under load.
10. `journey_entries.is_published` boolean visibility; spec may have richer states.
11. `communities` are anon-readable (public discovery); spec may gate.
12. `memberships` unique(member_id, community_id), self-managed.

## Consequences
- The MVP schema is ready for Phase 1C (passwordless auth + onboarding with
  opt-in health self-ID consent), which will wire `auth.users` → `profiles`
  creation and the consent grant UI.
- Backup/replica/subprocessor purge for the deletion right is operational (not
  DB-enforceable) and remains a known gap to close before the donation/health
  features launch (privacy-reviewer advisory A; CLAUDE.md known gaps).
- Typed client generated at `src/lib/database.types.ts` (schema only; no client
  instance or auth wiring yet).
