# Phase 1B Plan — MVP data model · RLS default-deny · crown-jewel invariant tests (pgTAP)

Status: AWAITING APPROVAL ("APPROVED — build Phase 1B")
Author: Claude Code · Date: 2026-06-01
Scope basis: PRD §7 (functional), §8 (privacy/data), §12.1; Amendment §8.x, §12.1, §13.
Companion rules: .claude/rules/db.md, .claude/rules/privacy.md; skills supabase-rls, privacy-compliance.

> The research spec (the base schema) is NOT in-repo. Every field-level decision
> inferred in its absence is tagged **[INFER]** below and collected in the
> RESEARCH-SPEC RECONCILIATION section for later reconciliation (carried into ADR 0003).

## Scope guard
IN: Supabase local init; the MVP schema below; RLS default-deny on every table;
TDD pgTAP proof of the four invariants; typed client; community seed.
OUT (do NOT build): governance tables (proposals/ballots/voter_eligibility/
treasury_ledger/safety_floor_rules), moderation tables, auth client wiring/
onboarding UI, feature screens, Stripe/payments, analytics, Storage/uploads.

---

## 1. Entities

All ids are `uuid` (`gen_random_uuid()` default) unless noted. All tables get
`created_at timestamptz not null default now()`; mutable tables also `updated_at`.

### 1.1 `profiles`  — identity + role
| column | type | notes |
|---|---|---|
| id | uuid PK | **references auth.users(id) ON DELETE CASCADE** — 1:1 with auth user [INFER] |
| role | `user_role` enum | not null, default `'patient'` [INFER default] |
| display_name | text | not null; account/content, not legal name [INFER] |
| created_at / updated_at | timestamptz | |
- No clinical columns. No email/phone (lives in `auth.users`).
- enum `user_role` = `patient | caregiver | professional | moderator | admin`.

### 1.2a `self_id_tags` — controlled vocabulary (reference/lookup; NOT health data)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| tag_type | `self_id_tag_type` enum | `diagnosis | physical_symptom | emotional_symptom` |
| code | text unique | stable slug, e.g. `afib`, `palpitations`, `anxiety` |
| label | text | plain-language display |
| is_active | boolean | not null default true (deactivate, never hard-delete) |
| created_at | timestamptz | |
- Public vocabulary of allowed tags — contains NO member data, so it is NOT
  consent-gated. Authenticated-readable; writes are admin/service_role only this
  phase (governance-extensible later — APPROVAL NOTE 2 / ADR 0003).
- **Allowed set (seeded; reconcile with wireframe B3 — not in-repo) [INFER]:**
  - diagnosis: `afib` (Atrial fibrillation), `svt` (SVT), `arvc` (ARVC),
    `long_qt` (Long QT), `vt` (Ventricular tachycardia), `pvcs` (PVCs)
  - physical_symptom: `palpitations`, `dizziness`, `shortness_of_breath`,
    `fatigue`, `chest_discomfort`, `syncope` (fainting)
  - emotional_symptom: `anxiety`, `depression`, `fear_of_recurrence`,
    `sleep_difficulty`

### 1.2 `health_self_ids` — member's opt-in diagnosis/symptom tags (CONSENT-GATED)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| member_id | uuid | references profiles(id) ON DELETE CASCADE |
| tag_id | uuid | references self_id_tags(id) ON DELETE RESTRICT (controlled vocab — APPROVAL NOTE 2) |
| created_at | timestamptz | |
- This is regulated **consumer health data** (Amendment §8.x). Reads/writes gated
  on a current consent row (see §3). Never joined to anything payment-related.
- unique(member_id, tag_id) to avoid dup tags. tag_type/value come from the
  joined `self_id_tags` row (no free text).

### 1.3 `consent_records` — versioned consent ledger
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| member_id | uuid | references profiles(id) ON DELETE CASCADE (account deletion = rights workflow) |
| purpose | `consent_purpose` enum | `health_self_id` only this phase [INFER — extensible] |
| policy_version | text | not null |
| granted_at | timestamptz | not null default now() |
| withdrawn_at | timestamptz | null until withdrawn |
| source | text | e.g. `onboarding`, `settings` [INFER values] |
- Append-only ledger: members may INSERT (grant) and may set `withdrawn_at` once
  (withdraw); no other UPDATE, no member DELETE. Deletion only via rights workflow
  (account-delete cascade or service_role).
- "Current consent" for a purpose = a row with `withdrawn_at IS NULL`.

### 1.4 `communities`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | not null |
| name | text | not null |
| description | text | |
| is_caregiver | boolean | not null default false [INFER] |
- Public-readable spaces. Creation/edit is admin/service_role only this phase
  (Tier-1 community-creation governance is Phase 3).

### 1.5 `memberships` — member ↔ community join
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| member_id | uuid | references profiles(id) ON DELETE CASCADE |
| community_id | uuid | references communities(id) ON DELETE CASCADE |
| joined_at | timestamptz | default now() |
- unique(member_id, community_id).

### 1.6 `posts`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| author_id | uuid | references profiles(id) ON DELETE CASCADE |
| community_id | uuid | references communities(id) ON DELETE CASCADE |
| title | text | not null |
| body | text | not null |
| created_at / updated_at | timestamptz | |
- **No denormalized upbeat_count this phase** [INFER/deferral]: score is strictly
  `count(upbeats)` so the no-downvote invariant stays crisp. PRD §13 denormalization
  is a perf optimization deferred to a later phase (noted in reconciliation).

### 1.7 `comments` — threaded, self-referential
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| post_id | uuid | references posts(id) ON DELETE CASCADE |
| author_id | uuid | references profiles(id) ON DELETE CASCADE |
| parent_comment_id | uuid | references comments(id) ON DELETE CASCADE, null = top-level |
| body | text | not null |
| created_at / updated_at | timestamptz | |

### 1.8 `upbeats` — presence/absence positive feedback (NO downvote state)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| member_id | uuid | references profiles(id) ON DELETE CASCADE |
| post_id | uuid | references posts(id) ON DELETE CASCADE, nullable |
| comment_id | uuid | references comments(id) ON DELETE CASCADE, nullable |
| created_at | timestamptz | |
- **Structural invariant:** the row's existence IS the positive signal. There is
  **no** sign/weight/value/direction/dislike column anywhere. (Comment uses the
  guard-whitelisted phrase "no downvote".)
- CHECK: exactly one subject — `(post_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1`.
- unique(member_id, post_id) and unique(member_id, comment_id) → one upbeat per
  member per subject. Score = `count(*)`.
- No UPDATE policy (nothing to mutate; un-upbeat = DELETE the row).

### 1.9 `journey_entries` — member "my journey" blog pages
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| author_id | uuid | references profiles(id) ON DELETE CASCADE |
| title | text | not null |
| body | text | not null |
| is_published | boolean | not null default false [INFER] |
| created_at / updated_at | timestamptz | |

No table anywhere stores ECG/clinical/records data, nor any upload/file reference.

---

## 2. RLS posture per table (default-deny + explicit policies)

Every table: `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` with NO permissive default.
`auth.uid()` identifies the member (= profiles.id). Policy intent is documented
inline in the migration. Anon (unauthenticated) gets nothing except where noted.

| table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | authenticated: all profiles (public display_name/role) [INFER] | self only (id = auth.uid()) | self only | self only |
| self_id_tags | authenticated (public vocabulary) | none (admin/service_role) | none | none |
| health_self_ids | self **AND current consent** | self **AND current consent** (WITH CHECK) | self AND current consent | self |
| consent_records | self only | self only (member_id = auth.uid()) | self, only to set `withdrawn_at` (withdraw); no other field | none (rights-workflow / cascade only) |
| communities | any (incl. anon) — public spaces [INFER] | none (admin/service_role) | none (admin/service_role) | none (admin/service_role) |
| memberships | self only | self only | none | self only |
| posts | authenticated | author (author_id = auth.uid()) | author | author |
| comments | authenticated | author | author | author |
| upbeats | authenticated | self (member_id = auth.uid()) | none | self (un-upbeat) |
| journey_entries | published (any) OR own | author | author | author |

Notes:
- service_role bypasses RLS (backend-only); never shipped to client (Step 6 only
  generates types, no client instance).
- Moderator/admin elevated paths (remove others' content) are **Phase 2** — not added now.

---

## 3. Consent-gating mechanism (invariant 3)

RLS on `health_self_ids` references the consent ledger so self-ID cannot **exist**
or **be read** without a current consent row:

- SELECT USING: `member_id = auth.uid() AND EXISTS (select 1 from consent_records c
  where c.member_id = auth.uid() and c.purpose = 'health_self_id' and c.withdrawn_at is null)`
- INSERT/UPDATE WITH CHECK: same EXISTS predicate.
- Withdrawal hardening: a trigger on `consent_records` — when `withdrawn_at`
  transitions from NULL to a timestamp for purpose `health_self_id` — **deletes**
  that member's `health_self_ids` rows. [INFER design choice] This makes "cannot
  exist without current consent" true at rest, not just at the policy layer.

Effect: insert without consent → denied; with consent → allowed + readable; after
withdrawal → rows removed and unreadable. Self-ID is opt-in, never required to
participate (no other table depends on it), never joined to payments (no payment
tables exist).

---

## 4. Deletion-cascade design (invariant 4)

FK chain, all `ON DELETE CASCADE`:
```
auth.users
  └─ profiles
       ├─ health_self_ids
       ├─ consent_records
       ├─ memberships
       ├─ posts ──┬─ comments ──(self) child comments
       │          └─ upbeats (post_id)
       ├─ comments (authored) ── upbeats (comment_id)
       ├─ upbeats (authored)
       └─ journey_entries
```
Deleting the `auth.users` row (or `profiles` row) removes the account and every
member-owned row, including self-ID tags and consent records. Full account
deletion IS the rights/erasure workflow, so cascading consent records on account
delete is correct (vs. members not being able to arbitrarily DELETE single consent
rows under normal RLS). Backup/replica/subprocessor purge is **operational**
(scheduled job + confirmation records, Amendment §8.x) and not DB-testable here.

---

## 5. pgTAP test plan (TDD — written first, must fail against empty schema)

Files under `supabase/tests/`. A helper sets the JWT claims to impersonate a
member (`set local role authenticated; set local request.jwt.claims …`) and an
`anon` path for unauthenticated checks.

**`00_no_downvote.sql`** → invariant 1 (structural + functional)
- `has_table('upbeats')`; columns are EXACTLY {id, member_id, post_id, comment_id, created_at}.
- `hasnt_column` for value/weight/sign/direction/score/dislike-style fields.
- the CHECK (exactly one subject) and both unique constraints exist.
- functional: same member upbeating same post twice → unique violation (`throws_ok`).

**`01_rls_default_deny.sql`** → invariant 2
- every table in scope has `relrowsecurity = true` (loop over a table list).
- anon SELECT on posts/profiles/health_self_ids → 0 rows / denied.
- member A cannot SELECT member B's private rows (consent_records, memberships, own-only paths).
- member cannot INSERT a post as another author (WITH CHECK denial).

**`02_consent_gating.sql`** → invariant 3
- INSERT health_self_id with NO consent row → denied (`throws_ok`/0 rows).
- grant consent → INSERT succeeds, SELECT returns the row.
- set `withdrawn_at` → SELECT returns 0 rows AND underlying row deleted by trigger.

**`03_deletion_cascade.sql`** → invariant 4
- seed one member with profile + membership + post + comment + upbeat + journey
  entry + consent + self-ID (via service_role).
- delete the `auth.users` row.
- assert `is(count, 0)` for that member, ENUMERATING every member-owned table
  (APPROVAL NOTE 3): consent_records, health_self_ids, upbeats, journey_entries,
  posts, comments, memberships, profiles.

Run: `npx supabase test db`. Expect ALL RED before migrations exist; commit the
red tests as the checkpoint.

---

## 6. Seed plan (`supabase/seed.sql`)

Insert initial communities only (no members, no health data, no content):
AFib, SVT, ARVC, Long QT, VT, PVCs, Post-ablation, ICD recipients,
Caregivers (`is_caregiver = true`), General. Each with slug + name + short
plain-language description. Confirm `npx supabase db reset` applies migrations +
seed cleanly.

---

## 7. RESEARCH-SPEC RECONCILIATION (inferences to reconcile when the spec lands)

1. **profiles.id = auth.users.id (1:1)** — assumed; spec may use a separate surrogate key.
2. **profiles.role default `patient`**, and `display_name` required — assumed.
3. **profiles SELECT is authenticated-wide** (public display_name/role) — assumed; spec may restrict.
4. **self_id_tag_type = {diagnosis, physical_symptom, emotional_symptom}** — inferred from §7.1's "physical and psychological."
5. **Controlled vocabulary (`self_id_tags`)** — per APPROVAL NOTE 2, self-ID uses a lookup table, not free text. The seeded allowed set (§1.2a) is grounded in the diagnosis communities + PRD §1 anxiety/depression, but MUST reconcile with **wireframe B3** (not in-repo). The vocabulary is governance-extensible later (add/deactivate tags via admin → eventually Tier-1).
6. **consent_purpose enum = {health_self_id}** only — extensible; spec may define more purposes (e.g., comms, analytics-aggregate).
7. **Withdrawal trigger deletes self-ID rows** — design choice to enforce "cannot exist without current consent."
8. **upbeats polymorphic via two nullable FKs + CHECK** (vs. subject_type/subject_id) — design choice for true ON DELETE CASCADE.
9. **No denormalized `posts.upbeat_count`** this phase — PRD §13 perf optimization deferred; score = count(upbeats).
10. **journey_entries.is_published** boolean visibility model — inferred; spec may have richer privacy states.
11. **communities are public-readable incl. anon** — inferred from "public spaces"; spec may gate.
12. **memberships unique(member_id, community_id)** and self-managed join/leave — inferred.

---

## 8. Step sequence after approval
3. `npx supabase init` + `start` (first run pulls images; not a hang) → confirm healthy.
4. Write pgTAP tests → run → confirm RED → **commit failing tests**.
5. Write migrations (tables, enums, constraints, cascade chain, RLS + policies,
   consent-gating + withdrawal trigger) → `supabase test db` green WITHOUT
   touching tests → `db reset` clean.
6. `gen types typescript --local > src/lib/database.types.ts` (no client wiring).
7. `seed.sql` communities → `db reset` runs seed.
8. privacy-reviewer subagent on migrations + RLS → resolve any FAIL.
9. Verify tests green + db reset clean; append SESSION_LOG; write
   docs/adr/0003-mvp-data-model.md (incl. §7 reconciliation); commit
   `feat: Phase 1B — MVP data model, RLS default-deny, crown-jewel invariant tests (pgTAP)`. STOP.
