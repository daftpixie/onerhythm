# ADR 0019 — Moderation data model and authorization matrix

Status: Accepted — founder, 2026-10-29

Built from the approved moderation plan
(`.claude/plans/phase-2-moderation-core.md`, merged as PR #6) and the founder's
answers of 2026-10-29.
Date: 2026-10-29
Relates: plan §2–§3, §4.1, §4.4–§4.6, §6 (T1–T4, T6, T7, T9, T13, T16–T19,
T22, T23); ADR 0005 (explicit grants); ADR 0013 (tests fail against a
deliberate violation); ADR 0017 (Decision 4, the two floors); ADR 0018;
ADR 0020 (floors); ADR 0021 (appeals and launch gates); migration
`20261029120000`, in PR #9, not yet on `main` (function EXECUTE is
default-deny);
`.claude/rules/db.md`, `privacy.md`, `governance.md`.

## Context

Phase 2 adds reports, a human review queue, removals for safety-floor
violations, blocks, appeals and a public log. Each of these holds data about
people: who reported whom, whose post was removed, who blocked whom, who
moderates. Some of it is a health inference. A crisis match on a post says
something about the author's mental health.

The plan fixed the shape. The founder's answers of 2026-10-29 settle the open
parts:

- **Q1:** context notes come from a partner library (C), with moderator-written,
  clinically reviewed notes (A) as the fallback. A deleted author's note is kept
  with no author.
- **Q3:** interim moderators are appointed by the founder, named publicly, with
  end dates. The founder does not sit on the interim appeals panel.
- **Q4:** each moderator has a stable pseudonym. The mapping is held apart,
  deletable, its access logged, never public.
- **Q6:** muted words stay on the device only.
- **Q7:** spam and scam matches are held as "checking" until a human looks.
- **Q8:** other readers see a crisis post behind a gentle "Show" button.
- **Q9:** a temporary ban before elections needs five things: a safety-floor
  violation, a G4 holder, a floor item, a reason and an end date, plus a second
  look by a different person.

This ADR records the data model and who may do what. It does not populate any
grant, panel or reviewer. Gates G1–G4 are unmet (ADR 0021).

## Decision

### 1. Posture for every new table (plan §3.1)

- RLS is enabled with default-deny, and the migration repeats the
  `authenticated` REVOKE. It grants back only the verbs in the matrix below
  (`docs/PRODUCTION_READINESS.md` §1.6).
- Every privileged write goes through a `SECURITY DEFINER` function with
  `set search_path = ''`. EXECUTE is granted explicitly, because function
  EXECUTE is default-deny since `20261029120000`. A definer function that takes
  a member id answers only for `auth.uid()`, or checks `is_moderator()`.
- Views use `security_invoker = true`.
- Moderator functions never read `health_self_ids`, `memberships` or
  `consent_records`.
- "Append-only" means no client or moderator UPDATE or DELETE. The rights
  workflow and the deletion cascade still remove rows.
- Every member-linked table joins `MEMBER_OWNED_TABLES`, the export and
  `supabase/tests/03_deletion_cascade_test.sql`.

### 2. Content state (plan §3.2)

`posts` and `comments` gain:

- `moderation_state` (`content_moderation_state`: `visible` default,
  `removed`, `locked`; `locked` is valid for posts only);
- `removed_at`;
- `removed_under`, a foreign key to `floor_items`.

**Removal moves the text.** The body (and a post's title) moves to
`removed_content`, and the public row keeps an empty body. Restoring moves it
back. Neither table uses `REPLICA IDENTITY FULL`, so a Realtime update on
removal does not carry the old text.

### 3. Tables

Abbreviations: anon = `anon`, auth = `authenticated`, svc = service function or
`service_role`. "Member-linked" tables cascade on account deletion.

| Table | Key columns | Member-linked | Read | Write |
|---|---|---|---|---|
| `governance_config` | `key` (`minimum_notice`, `max_interim_term`, `interim_gap`, `max_ban_term`), `value interval` (NULL or > 0). All start NULL, and each rule that reads one fails closed while it is NULL | No | anon, auth | svc |
| `floor_versions`, `floor_items` | ADR 0020 | No | anon, auth | svc |
| `floor_reexamination_requests` | requester_id, floor_item_id, request_text (≤ 2,000), state | Yes | requester (own) | requester (insert) |
| `floor_reexamination_answers` | floor_item_id, question_summary (written by the reviewer, never the member's own text), answer, answered_at. **No requester column**, so the answer survives the requester's account deletion | No | anon, auth | svc |
| `triage_lists` | list (`crisis`, `misinfo`, `spam`, `scam`), term, version, active | No | anon and auth: `crisis` and `misinfo` in full; `spam` and `scam` as a published category view (Q5) | svc |
| `reports` | reporter_id, post_id **xor** comment_id, reason (`report_reason`), note (≤ 500, purged when the item closes), item_id, created_at | Yes | reporter (own) only; **no moderator policy** | auth, through `report_content()` |
| `moderation_items` | post_id xor comment_id, source (`report`, `triage`), category, **tier (1 or 3 only)**, state (`queued`, `checking`, `in_review`, `escalated`, `actioned`, `appealed`, `closed`), report_count, created_at, first_reviewed_at, closed_at | Via content | moderators, through `moderation_queue()` | definer functions |
| `moderation_actions` | item_id, action, **exactly one of** floor_item_id or tier1_rule (CHECK), reason (1–280 chars), actor_pseudonym, confirmed_by_pseudonym, ends_at (required for `temporary_ban`), created_at | Via content | moderators only. **The author has no policy on this table**: they read `remove`, `lock` and `context_note` on their own content through `my_moderation_notices()`, which omits every pseudonym column | `moderate()`, `confirm_action()` |
| `removed_content` | post_id xor comment_id, author_id, title, body, kind (`removed`, `held`), removed_at | Yes (author) | author (own), moderators | definer functions |
| `member_blocks` | blocker_id, blocked_id, created_at; primary key on the pair; no self-block | Yes (both) | blocker only; **not moderators** | blocker (insert, delete) |
| `moderator_grants` | member_id, role (`moderator`, `panelist`), basis (`interim`, `elected`), granted_at, **expires_at NOT NULL and > granted_at**, revoked_at, public_name, election_ref | Yes | **Interim grants are named publicly with their end dates (Q3)** through `interim_moderators_public` (public name, role, granted_at, expires_at). That view is a named list, not part of the aggregate log, so the "fewer than 5" rule does not apply to it. **A view never shows a name and a pseudonym together**, so a named moderator's actions stay unattributed | svc |
| `member_bans` | member_id, floor_item_id (**safety floor only**), reason (1–280 chars), ends_at (NOT NULL, after created_at, in the future when written and when confirmed, and no longer than `governance_config.max_ban_term`), proposed_by_pseudonym, confirmed_by_pseudonym, confirmed_at, created_at | Yes (the banned member) | moderators; the banned member through `my_moderation_notices()`, without pseudonyms | `moderate()` and `confirm_action()` |
| `moderator_pseudonyms` | member_id (pk), pseudonym (unique) | Yes | **no client role** | svc |
| `appeals` | action_id, appellant_id, appellant_label, statement (≤ 1,000), state, outcome, outcome_reason | Yes | appellant (own) | `submit_appeal()`, `withdraw_appeal()` |
| `second_look_requests` | requester_id, action_id, statement (≤ 1,000), state, created_at | Yes | requester (own) | `request_second_look()` |
| `appeal_decisions` | appeal_id (`on delete cascade` from `appeals`), panelist_pseudonym, choice (`uphold`, `overturn`); **unique(appeal_id, panelist_pseudonym)**; no weight column. When a panelist's pseudonym mapping is deleted, their decisions stay, linked to no member | Via panel | panel, through functions | `decide_appeal()` |
| `legal_holds` | held_table, held_id, legal_basis (non-empty), expires_at (NOT NULL), created_at | Via the held record | **no client role** | svc |
| `moderation_log_public` | week_start, kind, scope, category, action, count, fewer_than_five | No | anon, auth | svc job |
| `moderation_audit` | at, actor_role, function_name, table_name, row_count | **No** | svc | definer functions |
| `launch_gates`, `launch_gate_history` | ADR 0021 | No | anon, auth | svc |

**Not built:**

- `muted_terms` (Q6: device only). There is no table and no consent purpose.
- `context_notes`, built with ADR 4 at plan step 7. Its author reference is
  `on delete set null` (Q1), the one `set null` the cascade test allows.

### 4. Functions (all definer, `search_path = ''`)

| Function | EXECUTE | Checks |
|---|---|---|
| `is_moderator()` | auth | a current, unexpired, unrevoked `moderator` grant for `auth.uid()`. `profiles.role` alone is not enough |
| `is_blocked_between(a uuid, b uuid)` | auth | used only by the `posts`/`comments` read policies, so a block hides both ways. It answers only when `auth.uid()` is `a` or `b` |
| `report_content(post_id, comment_id, reason, note)` | auth | one subject; creates or updates the item; a `self_harm` reason makes a Tier 3 `crisis` item |
| `moderation_queue()` | auth (raises `42501` unless `is_moderator()`) | returns item id, subject, category, tier, state, `reported` (a boolean: "reported by one or more members") and `age_hours` (rounded to the hour). **Never reporter_id, note, report_count or any timestamp** (T6): on a one-report item a count of 1 or an exact time would point at the reporter. `report_count` stays internal, for ordering and the aggregate log. No snippet for crisis or harassment |
| `moderate(item_id, action, floor_item_id, tier1_rule, reason, ends_at)` | auth (moderators) | conflict of interest (§5); a **safety-floor** item for `remove` and `temporary_ban`; `remove` never for a Tier 1 reason; interim grants: no `remove`, `lock` or `temporary_ban` on a Tier 1 reason (T24); `temporary_ban` writes a pending `member_bans` row for the content's author, needs a future `ends_at`, and has no effect until confirmed (Q9); moves removed text |
| `confirm_action(action_id)` | auth (moderators) | the confirmer must: be a different person from the proposer (T18); pass the same conflict-of-interest checks as the actor (T16); hold a current grant; and respect the interim limits |
| `submit_appeal(action_id, statement)` | auth (the author) | **raises for a Tier 3 action** (Tier 3 is never put to a vote; T7) |
| `decide_appeal(appeal_id, choice)` | auth (panelists) | the panelist is not the acting moderator, the appellant, or the author or reporter of the content (T17); one decision per panelist |
| `grant_moderator(member, role, basis, expires_at)` | service_role | the triggers in §6 |

**Error codes**, so tests cannot pass on an unrelated error (for example a
missing function, `42883`):

- a rule about **who may act** (conflict of interest, not a moderator,
  appealing a Tier 3 action, a client writing a service-only table) raises
  `42501`;
- a rule about **the shape of the data** (missing floor item, Tier 1 removal,
  missing end date, a forbidden floor change, a small public cell) raises
  `23514`.

**Labels:**

- `moderation_category`: `crisis`, `dangerous_misinfo`, `harassment`, `doxxing`,
  `illegal`, `impersonation`, `spam`, `scam`, `other_safety`, `tier1`. Every
  category except `tier1` is Tier 3.
- `report_reason`: `self_harm`, `dangerous_misinfo`, `harassment`,
  `spam_or_scam`, `other_safety`, `off_topic`, `unkind`.

**A floor item only on a Tier 3 item; a floor action never reaches a vote.**
An action carries `floor_item_id` exactly when its item is Tier 3, and
`tier1_rule` exactly when it is Tier 1 (trigger). `submit_appeal()` raises if
the action has a `floor_item_id` or its item is Tier 3. So a safety-floor
decision can never be routed to a panel through a Tier 1 item.

**Crisis items are never removed or banned.** `moderate()` rejects `remove`
and `temporary_ban` on a `crisis` item (`23514`). Crisis posts go to trained
people and to resources, not to removal.

**Crisis triage waits for counsel.** Crisis-list triage does not run on real
member content until G6 rules on consent and on collection under MHMDA and
similar laws (privacy floor item 1).

**Tier changes.** A trigger rejects any change of an item from Tier 3 to
Tier 1, by anyone. A wrongly classified Tier 3 item is closed with
`no_action` and a reason; it is never re-tiered into something a vote could
decide (T7).

**`removed_under`** may point only at a safety-floor item. A CHECK by trigger
stops a privacy-floor item from being cited for a removal.

**Bans take effect in the database.** The insert policies on `posts` and
`comments` reject a member who has a confirmed `member_bans` row whose
`ends_at` is in the future. A ban is keyed to the member, not the content, so
deleting the post does not clear it.

**Held spam and scam (Q7)** use the item state `checking`, which hides the
post from other members. The hold applies only while `launch_gates` records G1
as `met`. While G1 is unmet the item is queued and the post stays visible, so
no post sits unseen with no reviewer.

**Pseudonyms.**
- `moderator_pseudonyms` is read only through definer functions, which log
  each read. A direct read by `service_role` (an operator at the console)
  cannot be logged by the database. It is break-glass, as `db.md` describes
  for health-data tables: the operator records operator, time, table and row
  count in the operations log, outside the database.
- A pseudonym is never reused after its mapping is deleted.
- The author's view of an action on their content shows the action, floor
  item and reason, and never the pseudonym.
- **Appellants are shown to panelists by a per-appeal label** ("Member 1"),
  stored on the `appeals` row. There is no lasting appellant mapping, so
  nothing links one member's appeals.

**Tier 3 "look again".** `second_look_requests` (requester_id, action_id,
statement ≤ 1,000, state, created_at) is member-linked and joins the export
and cascade. It saves the request so that "Your request is saved" is true. It
is separate from `appeals`, so T7 holds: no Tier 3 action ever reaches a
panel.

**Held spam and scam text.** A held post's text moves to `removed_content`
with `kind = 'held'`, the same way a removal does (T22), so it cannot be read
through the API while it is held.

Every privileged function writes one `moderation_audit` row: role, time,
function, table and row count. It carries no member identifier. A read of
`moderator_pseudonyms` is logged the same way (Q4).

### 5. Conflict of interest (plan §3.6)

The functions and triggers reject:

- a moderator acting on content they wrote, or on an item they reported (T16);
- an appeal decision by the acting moderator, the appellant, or a panelist who
  wrote or reported the content (T17);
- a confirmation by the proposer (T18).

Because deleting a reporter's account deletes their reports, the checks read
current rows only. This is a known limit.

### 6. Grants expire and are capped (plan §3.5; T19)

- `expires_at` is NOT NULL and after `granted_at` (CHECK).
- An `interim` grant longer than `governance_config.max_interim_term` is
  rejected. **While that value is NULL, every interim grant is rejected.**
- An interim grant's `expires_at` can never be changed.
- A second interim grant to the same person and role is rejected until
  `interim_gap` has passed. While that value is NULL, it is always rejected.
- Elections replace interim grants and never extend them.
- An expired or revoked grant gives no `is_moderator()`.
- **An `elected` grant needs an election behind it.** It requires an
  `election_ref`. Until Phase 3 builds elections, a trigger rejects every
  `elected` grant, so the interim limits cannot be skipped by labelling a grant
  `elected`.
- **No grant while G4 is unmet.** A trigger rejects any `moderator_grants` row
  unless `launch_gates` records G4 as `met`. Bans need a grant, so they wait
  for G4 too.
- **Ban length is capped.** `max_ban_term` is NULL until the founder sets it;
  while it is NULL, every ban is rejected.
- **An interim grant needs a public name (Q3), under consent.** Being named as
  a moderator here shows membership of a heart-rhythm community, which is
  health-adjacent. So the name is published only under a current
  `moderator_public_name` record in the consent ledger. It is unchecked by
  default and can be withdrawn. Withdrawing it removes the name from every
  view, nulls `public_name`, and ends the interim grant: `is_moderator()` is
  false for an interim grant with no current naming consent.
  - One narrow definer function, `has_current_consent(member, purpose)`,
    answers this. It returns a boolean only, answers only for `auth.uid()` or a
    definer caller, and is the only way moderation code touches
    `consent_records`.
  - Naming is voluntary. Someone who declines is not pressed: they are simply
    not appointed as an interim moderator, because Q3 requires interim
    moderators to be named. Elected moderators may serve by pseudonym.
  - New `consent_purpose` values, named here as `db.md` requires:
    `moderator_public_name` and `reexam_show_name`. The second is for a member
    who chooses to have their name shown beside the published answer to their
    request (`floor_reexamination_answers.shown_name`, set only under that
    consent, nulled on withdrawal and deleted with the account). There is no boolean column for either; the ledger is the only
    record.

### 7. The public log and the audit log (plan §3.7, §3.9; T3)

- Neither table has a column that refers to `profiles` or `auth.users`, and
  neither has a free-text reason.
- `moderation_log_public` has two CHECKs:
  - for count kinds (`action`, `appeal_outcome`, `legal_hold`,
    `grant_count`): `count is null or count >= 5`, with
    `fewer_than_five = (count is null)`;
  - non-count kinds (`floor_change`, `gate_change`) carry `floor` and
    `version`, or a gate key, which point at the public row that holds the
    reason. They have no count and no free text;
  - `category = 'crisis'` only with `scope = 'all'`, so crisis is never shown
    per room.
- Complementary suppression is done by the job that writes the rows and is
  tested there.
- The threshold for rolling up small communities waits for G9. Until it is set,
  the job publishes only `scope = 'all'` rows.
- **Supersession.** Amendment 1 §12.1 asked for `reporter_id` and `subject_id`
  in an "immutable audit trail". That is superseded by Amendment 3 §7.10.3 and
  `db.md`: audit logs carry no member identifiers, and operational records stay
  deletable. The older wording is not to be reinstated.

### 8. Crisis items are health inferences (plan §3.8)

- A crisis item stores the category and the subject. It never stores the
  matched term.
- A `reports` row with reason `self_harm` gets the same minimization and
  retention as a crisis item. So does a `sent_crisis_resources` action.
- Triage matching is disclosed in the Consumer Health Data Privacy Policy,
  with a policy-version bump, before it runs on member content.
- These free-text fields are health data and are marked so in the data
  inventory:
  - `reports.note`;
  - `moderation_actions.reason`, whose form hint says "Don't quote health
    details";
  - `appeals.statement`;
  - `floor_reexamination_requests.request_text`;
  - `second_look_requests.statement`.
- **Q8, the "very hard feelings — Show" gate, stores nothing.** A stored
  per-post crisis flag would publish an inference about the author to every
  reader, against plan §4.6 ("no tag on the post"). So the reader's own device
  matches the post against the published crisis list (Q5) when it renders, and
  shows the gate. Nothing is stored, logged or sent, and no column is added.
  The server-side crisis item is visible only to moderators. Counsel (G6) and
  G1 inform the copy. Choosing a stored flag instead would need counsel and a
  retention rule first.
- Once closed, it is reduced to a count, then deleted after a retention period
  set in the data inventory (G9).
- No post text, matched term or "crisis matched" signal reaches any log (T11).
- Whether a member's access request covers their own crisis items is decided
  with counsel (G6).

### 9. Deletion, holds and export (plan §3.10)

- When an account is deleted, these cascade:
  - reports, blocks on either side, bans, appeals (and their panel
    decisions), second-look requests and re-examination requests;
  - `removed_content`;
  - items and actions on the member's deleted content;
  - grants and the pseudonym mapping.
- The log and audit tables are untouched; they hold no member identifiers.
- Deletion also reaches backups, replicas and subprocessors on the published
  schedule (`.claude/rules/privacy.md`).
- **Accepted limit:** deleting an account also deletes its ban. A ban cannot
  outlive the member's right to delete. Only a legal hold can keep it.
- `legal_holds` keeps only named records, with a named basis and an end date,
  out of member reach. In addition:
  - every access goes through a definer function and is logged in
    `moderation_audit`;
  - each hold is counted in the public report (privacy floor item 9), under
    the §7 suppression;
  - health self-ID and crisis items are never held unless an order names them;
  - the deletion-cascade test covers held rows (kept while the hold runs) and
    released rows (deleted when it ends) (T25).
- The export (`src/lib/rights/export.ts`) gains:
  - the member's own reports, blocks, bans, appeals and re-examination
    requests;
  - their `removed_content`;
  - a moderator's or panelist's own grants, pseudonym and panel decisions;
  - notes they wrote, once context notes exist (ADR 4);
  - removals, locks and context notes on their content, with the floor item
    and reason.
- The export never includes who reported the member, report counts, triage
  tags or escalations. **Whether it includes the member's own crisis items is
  pending G6** (counsel), as §8 says.

### 9a. Where this ADR supersedes the plan

- Plan §3.3 said grants are "public by pseudonym". Here no view ever shows a
  pseudonym; interim moderators are named (Q3), and no view shows a name
  beside a pseudonym.
- Plan §2.2 allowed `announced_at <= effective_at` for a plain `tighten`.
  ADR 0020 requires `<`.
- Plan §6 lists T1–T25. The failing tests here cover T1–T4, T6, T7, T9, T10,
  T13, T16–T19, T22 and the database half of T8. The rules this ADR added
  (elected label, G4, ban cap, crisis items, `initial` once, immutable floor
  rows, confirmer conflict of interest) are pinned in the same files.

### 10. Values this ADR does not set

Each is a founder decision. None is invented here, and each starts NULL or
unset:

- **G9 (data inventory):** retention for `removed_content`, closed crisis items,
  reports, appeal statements, action reasons, expired grant rows and access
  logs; the small-community threshold; `max_interim_term` and `interim_gap`;
- **G4:** who holds interim grants;
- `max_ban_term`, the longest temporary ban;
- **G2:** the appeals panel.

## Consequences

1. **The plan says G9 blocks building the migrations.** Two behaviours need no
   G9 value and are built regardless: the report note is purged when the item
   closes, and a closed crisis item is reduced to a count. The "ship NULL,
   leave purge jobs unscheduled" option is acceptable only before any real
   member data exists. This ADR and the
   failing tests can land first. The migrations wait until the founder records
   the G9 values in the data inventory, or decides that the migrations may ship
   with NULL values that fail closed (as `governance_config` already does) and
   with purge jobs unscheduled.
2. Every invariant above gets a failing test, committed in the same PR as this
   ADR and before any migration: `supabase/tests/10_…` to `21_…`, and
   `tests/unit/moderation-*.test.ts`.
3. No migration seeds a grant. A moderator grant needs G4 met; a panelist
   grant needs G2 and G4 met (database-enforced since 2026-10-30). There is
   no reviewer role in this schema.
4. `src/lib/rights/export.ts` and the deletion-cascade test grow with each new
   member-linked table, in the same migration PR.

## Build notes — step 3, 2026-10-29

The migrations are `20261029130000` (consent purposes), `20261029130100`
(expand) and `20261029130200` (rules), on PR #11. These notes record where the
build differs from the text above, and what is not built yet. None of them
loosens a floor.

**G9, founder decision of 2026-10-29.** The migrations ship with every G9
value NULL, and every rule that reads one fails closed. No grant can be made,
no ban issued, and no per-community public-log row written; no purge job
exists. NULL retention means data is kept until the value is set. That is
acceptable only because no member data exists (Consequences 1). G9 stays
unmet: "deferred — values NULL, fail closed; set with counsel before launch".
It still blocks member launch.

**Built differently, with the reason:**

- `governance_config` also holds the G9 retention keys (intervals, NULL) and
  `small_community_threshold`. The threshold sits in an `int_value` column, so
  a count is never read as a duration.
- `interim_moderators_public` is a definer function, not a view. `anon` has no
  grant on `moderator_grants` (T2), so an invoker view could not work.
- `is_blocked_between` lives in `moderation_private`, a schema PostgREST does
  not expose. As a public RPC, a blocked member could ask "has X blocked me?"
  (privacy review). The read policies still call it. It also answers only
  about a member who has written a post or comment, so even a caller who
  reaches it another way learns nothing the hidden posts do not already show.
  The hosted project's exposed schemas are a dashboard setting, and pg_graphql
  should be off (PRODUCTION_READINESS §1.4–1.6).
- Reports are unique per member per item, not per post. A member who reported
  a post as unkind can still report it for self-harm, and that reaches a
  crisis item (privacy review, round 2: safety first).
- `is_banned_now()` (no argument, the caller only) backs the ban rule in the
  posts and comments insert and update policies.
- Report notes are purged once a moderator acts, not only at close. A closed
  crisis item also has its action reasons replaced with a fixed line, and
  sending crisis resources closes the item (privacy review).
- `floor_versions.recorded_at` lets items join a version only in the
  transaction that publishes it. A non-initial floor change is refused if
  `announced_at` is more than five minutes before the insert, so a notice
  period cannot be skipped by back-dating (governance review).
- `appeals` has no table-level Tier 3 guard: test 13's fixture inserts an
  appeal row against a Tier 3 action directly. `submit_appeal()` and
  `decide_appeal()` refuse Tier 3, and a trigger refuses any
  `appeal_decisions` row for one, so no Tier 3 action reaches a vote.
- **Changed 2026-10-30 (founder decision):** a panelist grant needs G2 as
  well as G4. Migration `20261030120000` adds the check to
  `moderator_grants_on_insert()`; `supabase/tests/23_panelist_grants_need_g2_test.sql`
  pins it, and test 18's fixture now marks G2 met before seating panelists.
  Known limit: G2 is checked when a grant is made. If G2 were later set back
  to unmet, existing panelist grants would stay valid; `decide_appeal()` does
  not re-check G2. No outcome is final without G2's published quorum.

**Not built in step 3:**

- `floor_reexamination_answers.shown_name`. With no member link on that table,
  a name could not be removed on withdrawal or deletion. It waits for step 6
  with a design that can. Keep `reexam_show_name` out of any consent screen
  until then.
- The published spam and scam category view (Q5). Their terms are not
  readable; the category page comes with step 6.
- Placing, reading and releasing legal holds, and keeping held rows through
  the cascade (T25). The table exists; nothing honours it yet, so a held row
  would still be deleted. This belongs in G6 and blocks member launch.
- Hiding a held (spam or scam) post's row from other members. Its text is
  moved out and the author cannot edit it, but the empty row still shows.
  Holding runs only while G1 is met, so it cannot happen yet.
- Lifting a ban, and carrying an overturned appeal or a second-look outcome
  into effect. Ban and appeal outcomes wait for G1 and G2.
- `src/lib/database.types.ts` is not regenerated; the export reads the new
  tables untyped until it is.
