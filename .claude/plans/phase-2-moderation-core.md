# Plan — Phase 2: the moderation core

**Status:** APPROVED — the founder merged this plan (PR #6) on 2026-10-29 and
answered Q1–Q9 the same day (§9). Build step 0 is in its own PR; steps 1–2
(ADRs 0019–0021, failing tests) follow. **G1–G4 and G9 are still unmet**
(§8), so no moderator, panelist, reviewer or retention value exists yet.
**Date:** 2026-10-28 · **Revision:** 4 (2026-10-29: founder answers recorded)
**Sources:** PRD v1.0 §6.2, §6.4, §7.6, §12.1; Amendment 1 (§12.1
`moderation_actions`, §13 authorization matrix, SLIs); Amendment 2 (§7.9 — Phase
2M follows this phase); Amendment 3 (§6.4 safety-floor additions, §6.7 privacy
floor and the rule for changing a floor); Wireframes Addendum A (B15 moderator
console); ADR 0005 (explicit grants), ADR 0013 (tests must fail against a
deliberate violation), ADR 0014 (web test project), ADR 0017 (Decision 4);
`docs/PRODUCTION_READINESS.md` §1.6; vision §5.2.

**Founder decisions this plan builds to (2026-10-28), not reopened:**

1. Crisis response and the review queue are a **launch gate, definition TBD**.
2. Automated triage uses **published word and phrase lists only**. No AI
   classifier, no third-party moderation API.
3. Appeals are a **launch gate; the interim panel is TBD**.
4. Misinformation is handled **community-notes style, with clinical and partner
   oversight**. Removal is for safety-floor violations only.
5. **Web first.** iOS-only requirements are noted, not built.
6. Moderation first; rule-file alignment runs alongside in a separate PR.
7. Live sessions are never recorded (not in this phase's scope; recorded as a
   non-goal).

**Binding gate (Amendment 3):** wherever `CLAUDE.md` or `.claude/rules/*` is
stricter than this plan, the rule file wins.

---

## 0. What "done" means — and what it does not

**Done** means the moderation machinery is built, tested and accessible, and
every human-dependent part is wired to a launch gate that is **visibly unmet**
until the founder defines it.

**Done does not mean** the member platform may open. It stays closed until every
gate in §8 is met. This phase must never show a member a promise that no person
is yet in place to keep.

**Found during review, in shipped code (fix in build step 0, §10):** the
existing `CrisisHelpSheet` links 988 only to a website — there is no
`tel:`/`sms:` action and no emergency-number action — and it has no focus move
on open or focus return on close. `AppShell`'s header is a plain view with no
banner landmark. Every moderation surface reuses both, so they are fixed first.

---

## 1. Scope against the PRD

| Requirement | Source | In this phase |
|---|---|---|
| Report/flag on every post and comment → queue | PRD §7.6; Amendment 2 §7.9 step 5 | Yes |
| **Block** another member | Task brief; Apple Guideline 1.2 (noted) | Yes |
| **Filter**: a member's own muted words | Task brief; Apple Guideline 1.2 (noted) | Yes (Q6) |
| Automated pre-filters: spam, scams, dangerous-claims list → human review | PRD §7.6; decision 2 | Yes — published lists only |
| Human review queue | PRD §7.6; Addendum A B15 | Machinery yes; staffing is gate G1 |
| Public moderation log | PRD §7.6 | Yes — aggregate only, no member identifiers (§3.9) |
| Moderator tools: lock, remove, restore, escalate, temporary ban | PRD §7.6 | Tools yes; who holds them is G4 |
| Context notes on borderline health claims | PRD §7.6; decision 4 | Yes — model chosen by founder (Q1); publishing gated (G3) |
| The published safety and privacy floors | PRD §6.4; Amendment 3 §6.4, §6.7 | Yes (§2) |
| Crisis routing to trained humans, **community spaces only** | Amendment 3 §6.4 | Machinery yes; gate G1 |
| Appeals of Tier 1 decisions to an elected panel | PRD §6.2; decision 3 | Machinery yes; gate G2 |
| Media classifier, image reports | Amendment 2 | **No** — Phase 2M, after this |
| Private journals | Amendment 3 §7.10 | **No.** Nothing in this phase can read a journal; none exist; when they do, no moderator policy touches them |

**The safety floor (PRD §6.4 as amended), never put to a vote:**

- dangerous medical misinformation;
- interpreting a specific person's ECG or diagnosis;
- self-harm and crisis — **in community spaces**, to trained humans and crisis
  resources, never to a vote;
- illegal content, harassment, doxxing, impersonating a clinician, CSAM, spam,
  scams;
- the AI organizes and never interprets;
- crisis help is one tap away on every screen.

**Non-goals, stated so nobody drifts them:**

- no AI classifier or third-party moderation API (decision 2);
- no automated action on a person — triage never bans, removes or notifies
  anyone but the queue;
- no downvote, "not helpful" mark or negative score anywhere, including on
  context notes (§4.3);
- no moderation of private journals, ever;
- no recording of live sessions (privacy floor item 10, in the rule-file PR);
- no drag-to-reorder in the console (SC 2.5.7 needs no alternative because
  there is no drag);
- no iOS build (decision 5).

**iOS note (decision 5).** Apple's App Review Guideline 1.2 requires apps with
user-generated content to offer filtering, a way to report content with timely
responses, the ability to block abusive users, and published contact information
(vision ref. [5]). The web build delivers filtering, reporting and blocking, and
a published contact page (§4.8). "Timely responses" depends on gate G1.

---

## 2. The floors as published, versioned artifacts

### 2.1 Where they live

- `docs/policy/safety-floor.md` and `docs/policy/privacy-floor.md`, each with a
  version header, effective date, and a changelog with the reason for every
  change. Each item states the harm or legal basis behind it (ADR 0017
  Decision 4). The privacy floor's text is ADR 0017's nine items plus item 10
  (ADR 0018, in the rule-file PR).
- A public page in the app renders the same text and shows that its hash
  matches the repository.
- **The misinformation boundary is written into the safety floor's text**:
  what counts as *dangerous* (removed — e.g. telling people to stop prescribed
  treatment, "cures", dosing advice, anything creating imminent physical risk;
  PRD §6.4) versus *borderline* (left up with a context note). Any note-writer
  or reviewer can escalate a borderline item to Tier 3. A note is never a way
  to leave dangerous content up.

### 2.2 `floor_versions` and `floor_items`

`floor_versions` (public read, anon included; no member data):

| Column | Rule |
|---|---|
| floor | `safety` / `privacy` |
| version, content_sha256 | hash of the published text |
| change_kind | `initial` / `tighten` / `tighten_emergency` / `loosen` |
| reason | non-empty, always |
| announced_at, effective_at | `tighten`: `announced_at <= effective_at`. Only `tighten_emergency` may take effect at announcement, and is published with its reason at once |
| notice_ends_at, adr_ref, legal_review_ref | **required** for `loosen`; CHECK `effective_at >= notice_ends_at` and `notice_ends_at >= announced_at + minimum_notice` |
| applies_from, requires_fresh_optin, policy_version | **required** when `floor = privacy` and `change_kind = loosen` (the loosened item applies only to data collected after `applies_from`, with fresh opt-in in the consent ledger and a privacy-policy version bump) |

- `minimum_notice` comes from a single config row (CHECK greater than zero;
  service-only writes; every change published in the log history). **While it
  is NULL, a trigger rejects every `loosen` row** — so "no loosening until the
  notice period is set" is enforced. The length is set in the governance
  charter or a rule-file change (Amendment 3 §6.7).
- The `notice_ends_at >= announced_at + minimum_notice` check and the "not in
  the past" checks run **in a trigger** (a CHECK can't read the config row or
  call `now()`). T10 tests the trigger.
- **A `tighten` must actually tighten.** The trigger compares the new
  `floor_items` with the previous version: a row labelled `tighten` or
  `tighten_emergency` may not remove or weaken an item; anything that does must
  be recorded as `loosen`. Each `tighten_emergency` is counted in the public log
  and carries its reason from the moment it takes effect.
- **Only a service-role function writes it.** No FK to proposals or ballots
  exists, so no vote can change a floor.
- `floor_items` (floor, version, item number, plain-language text) gives
  moderation actions a real foreign key for "item N of version V".

### 2.3 Who may change a floor, and how members can question one

- Only VT Infinite, Inc., or a future steward under the same rule (ADR 0017
  Decision 4).
- Every change appears on the public floor page, in the public log's history
  (§3.9), and as a plain-language notice to members on their next visit.
- **Re-examination requests.** Any member can ask for the stated basis of an
  item to be re-examined, through a published form. It is a public
  re-examination, never a vote. Requests are published only after a human
  review, through a view with no member identifier; showing a name is an
  unchecked opt-in recorded in the consent ledger. The form says "Please don't
  include health details". Drafts stay private. Deleting the account deletes
  the request; a published answer may stay, with nothing that identifies the
  requester.

---

## 3. Data model

### 3.1 Posture for every new table

- RLS enabled with **no** policies until each is justified. Default-deny.
- **Repeat the `authenticated` REVOKE** (`docs/PRODUCTION_READINESS.md` §1.6):
  each new table starts with `revoke all on … from anon, authenticated;`, then
  grants back only the verbs its policies need, listed in an authorization
  matrix in the migration header.
- **Ordinary, deletable records.** "Append-only" means no client or moderator
  UPDATE/DELETE; the rights workflow and the deletion cascade still remove rows.
- **Audit logs carry no member identifiers** (§3.7).
- Every member-linked table joins `MEMBER_OWNED_TABLES`, the export test and
  `supabase/tests/03_deletion_cascade_test.sql`.
- **Privileged writes** go through `SECURITY DEFINER` functions,
  `set search_path = ''`, `revoke execute … from public, anon`, and also from
  `authenticated` unless the function itself checks `is_moderator()` or the
  caller's ownership.
- **Views use `security_invoker = true`** so RLS applies; grants on views are
  checked like grants on tables.
- **Moderator functions never read `health_self_ids` or `memberships`.** A
  moderator sees the content and the floor, not the member's health tags.

### 3.2 Changes to `posts` and `comments`

- `moderation_state` enum: `visible` (default) / `removed` / `locked` (posts
  only). Post-then-review stays (Amendment 2).
- `removed_at`, `removed_under` (FK → `floor_items`).
- **Removed text is not readable by other members.** `posts`/`comments` are
  `using (true)` for authenticated members today, and RLS cannot hide one column.
  So on removal the `body` (and post `title`) is **moved** to
  `removed_content` — a moderator-and-author-only table — and the public row
  keeps an empty body. Restore moves it back.
  - `removed_content` is retained only as long as the data inventory says
    (enough for an appeal or second look), then purged; it cascades with the
    author's account.
  - Other members see a generic "Removed" placeholder, as a list item with text.
    **Only the author** sees which floor item and why.
  - `posts` and `comments` never use `REPLICA IDENTITY FULL`, so a Realtime
    update on removal does not carry the old text. No derived copy survives
    removal — search vectors, excerpts, cached previews or notification text.
    T22 checks the derived copies too.
  - `removed_content` joins `MEMBER_OWNED_TABLES` and the export, so the author's
    data file includes their own removed text.
- Migration follows expand → backfill → contract, behind a feature flag.

### 3.3 New tables

| Table | Holds | Member-linked? | Who reads | Who writes |
|---|---|---|---|---|
| `floor_versions`, `floor_items` | §2.2 | No | anon, authenticated | service function |
| `floor_reexamination_requests` | §2.3: item, request text, public answer | Yes (requester, optional display) | public | member (insert), service (answer) |
| `triage_lists` | list (`crisis`, `misinfo`, `spam`, `scam`), term, version, active | No | per Q5 | service function |
| `reports` | reporter_id, post_id **xor** comment_id, reason code, optional note (500 chars), created_at. **The note is purged when the item closes**; the row is kept only as long as the data inventory says. A self-harm reason code is treated like a crisis item (§3.8) | **Yes** | reporter only — **no moderator SELECT policy**; moderators use a definer function that omits `reporter_id` | reporter (insert) |
| `moderation_items` | subject (post xor comment), source (`report`/`triage`), category, **tier (1 or 3 only)**, state (`queued`/`in_review`/`escalated`/`actioned`/`appealed`/`closed`), report_count, created_at, first_reviewed_at, closed_at | Via content | moderators | system functions |
| `moderation_actions` | item_id, action (`remove`/`restore`/`context_note`/`lock`/`no_action`/`escalate`/`temporary_ban`/`sent_crisis_resources`), `floor_item` FK (required for `remove` and `temporary_ban`), reason (required, ≤ 280 chars, hint "Don't quote health details", retention in the data inventory), confirming moderator (Tier 3 removals and bans, per G1), created_at, actor reference (Q4) | Via content | moderators; the author sees **only** `remove`, `lock`, `context_note` on their own content | moderator functions |
| `removed_content` | §3.2 | **Yes** (author) | author (own), moderators | system |
| `member_blocks` | blocker_id, blocked_id; unique pair; no self-block | **Yes** (both) | blocker only; **not moderators** | blocker |
| ~~`muted_terms`~~ | **Not built (Q6 decided: device only).** Muted words stay on the member's device; nothing is stored on the server and no consent purpose is added | — | — | — |
| `context_notes` | subject, body, sources, status (`draft`/`in_review`/`published`/`withdrawn`), library entry (model C) or clinical-review fields (model A fallback); author reference `on delete set null` (Q1) | Yes, until the author deletes their account; then no author | published: authenticated | moderator functions (Q1: C, fallback A). Built with ADR 4, at step 7 |
| `appeals` | action_id, appellant_id, statement (≤ 1,000; retention in the data inventory), state (`submitted`/`waiting_for_panel`/`decided`/`withdrawn`), outcome, outcome_reason | **Yes** | appellant (own); panel via function (pseudonymous, Q4) | appellant (insert, withdraw); panel functions |
| `appeal_decisions` | appeal_id, panelist reference, choice (CHECK on valid values); **unique(appeal_id, panelist)** — one equal vote per panelist; **no weight column**; quorum, panel size and tie rule set in G2 | Via panel | panel; outcome public in aggregate | panel functions |
| `moderator_grants` | member reference, role (`moderator`/`panelist`), granted_at, **`expires_at` NOT NULL, after `granted_at`**, revoked_at, basis (`interim` / `elected`) | Yes | public by pseudonym (Q4 b); a name only with the person's recorded consent; expired and revoked rows leave the public view after a retention set in the data inventory. **Interim moderators are also named publicly, with end dates (Q3 b)** | service function |
| `moderator_pseudonyms` | member reference, stable pseudonym ("Moderator 7"). **Q4 (b):** held apart from the actions; never public; deletable; every read logged in `moderation_audit` (role, time, function, table, row count) | Yes | no client role; service and the definer functions that stamp an action | service function |
| `legal_holds` | held record reference, named legal basis, `expires_at` (required), created_at; every access logged | Yes (via record) | **no member access**; service only | service function |
| `moderation_log_public` | §3.9 — aggregate rows only | **No** | anon, authenticated | system job |
| `moderation_audit` | time, actor **role**, function, table, row count | **No** | service role; published only in aggregate with the §3.9 suppression | system |
| `launch_gates` + `launch_gate_history` | gate key, status (`unmet`/`met`), public definition (may be "Not defined yet"), defined_at, met_at; history of every change | No | anon, authenticated | service function |

**`launch_gates` is how decisions 1 and 3 stay honest.** Member-facing copy
reads each gate's status and definition from it. Changing a gate to `met`
requires a definition and writes a public history row.

### 3.4 Exactly one subject

`reports`, `moderation_items` and `context_notes` use the `upbeats` pattern:
`check ((post_id is not null)::int + (comment_id is not null)::int = 1)`, with
`on delete cascade` from both.

### 3.5 Who is a moderator, and for how long

- `public.is_moderator()` (definer, stable) is true only for a current,
  unexpired, unrevoked `moderator_grants` row. `profiles.role` alone is not
  enough.
- **Every grant has an end date after its start** (CHECK). Interim grants are
  **capped**: a `max_interim_term` config row sets the longest term, and while
  it is NULL a trigger rejects every interim grant. A trigger also rejects any
  change to an interim grant's `expires_at`, and a second interim grant to the
  same person and role unless the gap set in G4 has passed. **Elections replace
  interim grants and never extend them; renewal exists only for elected
  grants.** Every grant and revocation is published in the log history with its
  end date.
- **Before an elected panel exists,** interim moderators may act only on
  safety-floor matters and clear spam. **The action functions check the grant's
  basis**: an interim grant cannot remove, ban or lock for a Tier 1 reason —
  only "request an edit" or a context note. T24 pins this.
- **Q3 decided (2026-10-29): (b).** Founder-appointed interim moderators,
  named publicly, with end dates, replaced by election. **The founder does not
  sit on the interim appeals panel.** Who they are is still G4, unmet: no
  grant row is created until the founder names them.
- **Q9 decided (2026-10-29): temporary bans before elections** are allowed
  only for safety-floor violations, by G4 holders, with a floor item, a reason,
  an end date and a second look by a different person. The action functions
  enforce all five (T9, T18, T24).

### 3.6 Conflict of interest, enforced in the database

Triggers reject:

- a moderator acting on content they wrote, or on an item they reported;
- an appeal decision by the moderator who took the action under appeal, or by
  the appellant;
- a panelist deciding an appeal about content they wrote or reported;
- a Tier 3 removal or ban "confirmed" by the same person who proposed it (the
  two-person rule, when G1 requires it).

Each has a test (T16–T18). Because a reporter's account deletion deletes their
reports, the triggers check current rows only; the ADR records that limit.

### 3.7 Audit without member identifiers

Amendment 1 §12.1 asked for `reporter_id`, `subject_id` and an "immutable audit
trail". Amendment 3 §7.10.3 and the newer rules say audit logs carry no member
identifiers and records stay deletable. **The moderation ADR records this as an
explicit supersession** so the older text is not reinstated:

- **Operational records** (`reports`, `moderation_items`,
  `moderation_actions`, `appeals`) are member-linked where they must be,
  deletable, and cascade. They are not the audit log.
- **`moderation_audit`** records time, actor role, function, table, row count.
- **Individual moderator accountability** is Q4.

### 3.8 Crisis items are health inferences — minimal and short-lived

A `crisis` item tied to a post is an inference about a person's mental health.
So:

- the item stores the category and the post reference, **not the matched
  term**;
- after it is closed, it is reduced to a non-identifying count within a short
  retention period (set in the data inventory), then deleted;
- triage matching is disclosed in the Consumer Health Data Privacy Policy, and
  the records are treated as consumer health data;
- **no post text or matched term appears in Edge Function, database or
  application logs** (those logs sit with a subprocessor) — T11 checks this;
- moderators never see the author's health tags (§3.1);
- a `sent_crisis_resources` action falls under the same short retention;
- **whether a member's access request covers their own crisis items** (GDPR
  Art. 15 and the MHMDA access right include inferred health data) is settled
  with counsel under G6. Options: describe the data on request, or include the
  category for the member's own items. The ADR records the answer.

### 3.9 The public moderation log — aggregate, never small

Decided here, not left open (it protects people in small rooms):

- **Weekly counts** by floor item or Tier 1 rule, and action.
- **Communities with few members are rolled up** into "All other
  communities"; the threshold is set in the moderation ADR.
- **Cells under 5 show "fewer than 5"**, with complementary suppression so a
  total minus the visible cells can't reveal a small one. Totals across all
  communities are always shown.
- **Crisis and self-harm categories are never shown per room** — only as a
  site-wide weekly count, itself shown as "fewer than 5" when small.
- The same suppression applies to every `kind` (grants, appeal outcomes) and to
  the published aggregate of `moderation_audit`; while only one person holds a
  role, actor roles are merged into "a moderator or administrator".
- `kind` column so the log can also hold: floor changes, gate changes,
  moderator grants and revocations (with end dates), and appeal outcomes in
  aggregate. No member identifiers in any kind.
- The removed placeholder other members see is generic, so the log cannot be
  matched to a visible post.

### 3.10 Deletion, legal holds and export

| When a member deletes their account | What happens |
|---|---|
| Their `reports` | Deleted. `report_count` drops; the item stays if other reports or triage hold it |
| Their posts/comments | Deleted (existing cascade) → `removed_content`, items, actions and notes on them cascade |
| `member_blocks` either side, `appeals`, `floor_reexamination_requests` | Deleted (no `muted_terms` table exists: Q6 device only) |
| A moderator's own account | Grants deleted; the Q4 pseudonym mapping deleted; actions remain without any link to a member |
| Notes they **wrote** | **Kept, with the author link set to null (Q1, decided 2026-10-29)** — the only `set null` allowed, with no identifier left |
| `moderation_log_public`, `moderation_audit`, `floor_*`, `launch_gates` | Untouched — no member identifiers |

Deletion also reaches backups, replicas and subprocessors on the published
schedule (`.claude/rules/privacy.md`).

**Legal holds (privacy floor item 8).** Where a valid legal order or reporting
duty requires data to be kept, `legal_holds` keeps only the named records, with
a named legal basis and an end date, outside member reach, with every access
logged. Health self-ID and crisis items are never held unless an order names
them. Each hold is counted in the public report (item 9), under the §3.9
suppression. It is not general immutability. (Text only in this phase; image
preservation, such as for CSAM, arrives with Phase 2M.) Counsel defines it (G6),
and the deletion-cascade test covers held and released rows.

**Export** (`src/lib/rights/export.ts`) gains: reports I filed, my blocks, my
my appeals, my second-look requests, my re-examination requests, notes I
wrote, a moderator's own grants and panel decisions, and
**removals, locks and context notes on my content**, with floor item and reason.
It never includes who reported me, report counts, triage or crisis tags, or
escalations.

---

## 4. The pipeline

### 4.1 Word-list triage (decision 2)

- Runs at post and comment **insert and edit**, in a database trigger or Edge
  Function, against active `triage_lists`. Case-insensitive whole-word/phrase
  matching with simple normalization. No scoring, no model, no network call.
- A match creates or updates a `moderation_items` row (`source = triage`).
  Content stays published (post-then-review), **except spam and scam matches,
  which are held as "checking" until a human looks (Q7 a, 2026-10-29)**. The
  author sees "We're checking this post. It isn't visible to others yet." with
  no timing promise. Holding depends on G1: until G1 is met, a held post has no
  reviewer, so the hold is not switched on in production before G1.
- Lists are published (decision 2; Q5 for how). Every change is versioned and
  shown on the policy page.
- Triage never acts on a person.

### 4.2 Human review queue (gate G1)

The Addendum A B15 console, rebuilt to §5:

- items classified as Tier 1 or Tier 3 on arrival; only a human can change a
  tier, with a reason, and an appeal panel can never lower an item from 3;
- oldest first; age in text;
- a required reason for every action, citing a floor item or a Tier 1 rule;
- "Add context note" offered before removal for borderline health claims;
- for crisis items, "Send crisis resources to the member" is one step;
- **two-person review for hard cases** (vision §5.2), enforced as distinct
  people (§3.6) when G1 requires it;
- **queue previews never show a snippet** for crisis or harassment items — only
  the category in words ("Possible self-harm signal"); content opens behind
  "Show this content".

### 4.3 Context notes (decision 4) — model chosen by the founder (Q1)

Notes add context; they never remove a post. They address a **claim**, never a
person's symptoms, ECG or diagnosis. Every note links to at least one source from
a published list of acceptable source types, with descriptive link text. Labels
are in words ("Context added by OneRhythm moderators"), never revealing an
individual moderator (Q4).

**No negative rating in any option.** Any rating is presence-only ("This note
helped me"), one per member per note, and acceptance is decided by review or a
published rule — never a net score. T1 pins this.

**Clinicians and partners** approve or withdraw only a note's **wording and
sources**, with public reasons. They have no power over removals, bans, ballots,
budgets or elections (PRD §6.4: policy maintenance, not case-by-case diagnosis).
They are distinct from the AI advisory group (Amendment 3 §6.8) and their seats
are not conflated with it.

| | A. Moderator-written, clinically reviewed | B. Member-written, community-bridged, clinically spot-checked | C. Partner-sourced library |
|---|---|---|---|
| Who writes | Trained moderators | Eligible members (same anti-sybil gate as voting) | Moderators, choosing from a library written with clinical and partner input |
| How it's rated | Not rated | Presence-only "helped me" marks, counted when members who usually disagree both mark it ("bridging", as in X's Community Notes) | Not rated |
| Who publishes | Moderator, after a volunteer clinical reviewer approves the wording | Automatically once the bridging rule is met; clinicians check a sample afterward and can withdraw | Moderator, from the approved library |
| Clinical review | Before every note | After, on a sample, and on every withdrawal | Once, when each library note is written |
| Partner review | Optional source review | Source list only | Partners help write the library |
| Speed | Slow | Medium; needs many raters | Fast |
| Load on volunteers | Highest per note | Spread across members | Front-loaded |
| Risks | Bottleneck; clinician burnout | Needs a large, varied community; **bridging needs each member's marking history, which is profiling, and makes a mark's effect depend on the marker — closer to weighting than to one equal vote**; complex | The library may not fit a new claim (falls back to A) |

**Decided by the founder, 2026-10-29 (Q1): C at launch, A as the fallback.**
A fallback note is moderator-written and clinically reviewed before it is
published. When a note's author deletes their account, the note is kept with
no author. **Recommendation, now the decision:** **C for launch, A as the
fallback.** Option B only after its own ADR, privacy-reviewer and
governance-reviewer, which must show the marks are a publication signal and not
a ballot, prove no weighting by tenure or reputation, keep marks presence-only
with `unique(note_id, member_id)`, add the marks table to the export and the
cascade, and reconcile with "never a net score".

### 4.4 Removal for floor violations

Only for safety-floor items. Removal moves the text to `removed_content` (§3.2),
cites the floor item, writes an action and an aggregate log entry, and shows the
author:

> "We removed your post. It broke one of our safety rules: {the rule in plain
> words}. You can ask us to look at it again."
> [ Ask us to look again ]

When the removed post contained crisis language, the notice also carries the
crisis resources inline (§4.6), not only the header 🆘.

Tier 1 issues (tone, off-topic) are never removals under the floor. They use a
request to edit, a lock, or a context note, and are appealable.

### 4.5 Appeals (gate G2)

- **Tier 1 actions** are appealable to an elected panel (PRD §6.2). **Tier 3
  actions are never put to a vote**; an author can ask a trained human for a
  second look (part of G1).
- The form, tables and panel console are built. **The panel is not populated**
  (decision 3).
- While G2 is unmet, the author sees:

> "You can ask us to look at this again. We haven't set up our review panel
> yet, so we can't say when. Your request is saved. You'll see the answer in
> Settings."

- The member-facing state is "Your request is saved" until G2 is met, and
  "Waiting for a reviewer" only after — never an internal state name. An
  appeal is never silently dropped; the member can withdraw it.
- A Tier 3 "look again" while G1 is unmet reads: "We haven't set up this
  review yet. Your request is saved, and you'll see the answer in Settings."

### 4.6 Crisis routing (gate G1), community spaces only

- Crisis-list matches in **community posts and comments** create a Tier 3
  `crisis` item at the top of the queue (§3.8 for what is stored).
- **At the moment of posting**, the author sees crisis resources at once, with
  real actions — no staff needed, always on:

> **If you might hurt yourself, or you are not safe, get help now.**
> [ ☎ Call 988 ] [ 💬 Text 988 ] (US)
> [ ☎ Call your local emergency number ]
> [ 🌍 Help in another country ]
> No one from OneRhythm will contact you about this post.

  - 988 buttons are `tel:` and `sms:` links, 44px.
  - "Help in another country" opens a published list of crisis lines by
    country, chosen in the crisis ADR. The member picks their country on the
    device; **no location is stored**.
  - The last line is shown only while G1 is unmet. Staffing is explained on the
    policy page, not to a person in crisis. (A moderator's "Send crisis
    resources" action exists only once G1 is met, so the two never conflict.)
  - The panel takes focus on its heading when it appears, is never timed or
    auto-dismissed, and does not block: the post stays published.
  - The country choice stays on the device and is never sent; no IP or geo
    lookup; no analytics event for the panel, the click or the country; no tag
    on the post; external links use `rel="noreferrer noopener"`; the list is
    static content; the "crisis matched" signal reaches only the author's
    response and appears in no log.
- **When G1 is met**, the copy reads the gate's published definition (for
  example, its hours) and never promises more.
- **Q8 decided (2026-10-29): (b).** Other readers see a crisis-matched post
  behind a gentle "This post talks about very hard feelings — Show" button;
  the author gets the resources above. Counsel and G1 inform the final copy.
  **So that "no tag on the post" stays true,** the reader's device matches the
  post against the published crisis list when it renders. Nothing is stored,
  logged or sent (ADR 0019 §8).
- Nothing here reads a private journal; no moderator or coach role can open one.

### 4.7 What every member sees, whatever the gate status

- The 🆘 "Need help right now?" control is reachable on every screen and **in
  every sheet and dialog** (§5.1) — removed notices, report, block, appeal,
  muted words, the moderator console, the public log and floor pages.
- No copy promises a response time, a reviewer or a panel that `launch_gates`
  does not record as met.
- The policy page shows each gate in words: "Crisis review by trained people:
  **not in place yet**. Definition: not decided yet."

### 4.8 Report, block, filter, contact — member flows

- **Report** (⚑ "Report" + text) on every post and comment: reason radio list
  (safety reasons first, then Tier 1 reasons), optional note with the hint
  "Please don't include health details or anyone's name", "Send report".
  Status message: "Thanks. We saved your report." No timing promise unless G1
  is met.
- **Block** from a member's name or a post menu, in three short lines: "You won't
  see their posts. They can't reply to you. We won't send them a notice, but
  they may notice they can't see your posts." A blocked
  member's reply attempt gets a neutral outcome through a definer function, so
  the block is not revealed. Undo from Settings.
- **Muted words**: Settings → "Words I don't want to see". Matching posts
  collapse behind a button named "Show post hidden because of the word
  '{word}'". Never hidden silently. Terms are health-revealing ("ICD",
  "ablation"). **Q6 decided (2026-10-29): device only at launch.** Nothing is
  stored on the server, so there is no `muted_terms` table and no new consent
  purpose; moderators and triage cannot read the terms because the server
  never has them. The screen says plainly: "These words are saved on this
  device only. If you use a new phone or computer, add them again." Server sync
  can come later, under its own consent purpose and review.
- **Contact**: a published contact page for safety concerns (Apple 1.2), linked
  in the same place on every moderation surface.

---

## 5. Accessibility — WCAG 2.2 AA, members' and moderators' surfaces alike

Every surface follows Brand v3 and the v3.1 addendum: Atkinson Hyperlegible,
≥16px (metadata included), Ink on Paper, icon + text always, 44px primary
targets (per-item ⚑, "Remove 'X'", console "Open" and "Show" included), 24px
minimum with spacing for inline links, visible 2px Ink focus ring, no
colour-only state, 🆘 on every screen. Colours only from `tokens.ts`.

### 5.1 The crisis control in every state (blocking item from review)

- Every moderation **sheet and dialog carries its own "Need help right now?"
  button** inside it, because a modal makes the header behind it inert.
  (Alternative for report/block/appeal: non-modal inline panels that keep the
  header reachable — decided in the moderation UI ADR.)
- Opening the crisis sheet from inside another sheet returns focus to that
  sheet on close.
- **The moderator console (B15) and the public floor, gates and log pages mount
  `AppShell`**, so the header control is present there too.
- **Render-failure fallback:** if `CrisisHelpSheet` throws, an error boundary
  shows, in the header position, 44px `tel:`/`sms:` links for 988 and "call
  your local emergency number" — independent of any Modal. A silent failure is
  a safety incident (`.claude/rules/a11y.md`).
- **Crisis adjacency (Brand v3.1 §6.3).** Every member-facing or public surface
  that names suicide or self-harm — the safety-floor page, the public log's
  crisis count, the gates page, a removal notice for a crisis post — renders the
  standard resources block **in the same text block**: call or text 988 (US),
  and in an emergency call your local emergency number, as `tel:`/`sms:` links.
  The header 🆘 does not count. In the console, an opened crisis item shows a
  one-line link to the same resources, for the moderator's own wellbeing.
- **Emoji are decorative.** ☎ 💬 🌍 ⚑ 🆘 ⏱ are hidden from assistive technology;
  the accessible name is the text label.
- **On native (after web),** stacked modals are unreliable, so report, block
  and appeal should be inline non-modal panels there, or the stacked case is
  tested with VoiceOver and TalkBack.
- The `CrisisHelpSheet` defects in §0 are fixed first.

### 5.2 Dialog contract (every sheet and dialog)

- `role="dialog"`, `aria-modal`, an accessible name; focus moves to the title
  (`tabindex="-1"`) on open; focus is trapped; Escape closes; focus returns to
  the control that opened it.
- **If that control is gone** (Block hid the post; Remove took it away), focus
  goes to a named fallback — the next post, or the list heading — never to
  `body`.
- No time limits. Sheets reuse `useReducedMotion`.
- Focused inputs scroll into view above the on-screen keyboard; sticky footers
  ("Send report") never cover the focused field (SC 2.4.11).

### 5.3 Status messages (SC 4.1.3)

- One `role="status"` (`aria-live="polite"`) region, **mounted at the app root
  outside any modal** and present before any change, announces: report saved; blocked / unblocked; muted word added or
  removed (never echoing the word, which may be health-revealing); appeal
  saved or withdrawn; moderator "Action applied". These are
  announced even though focus has moved after a sheet closes.
- `role="alert"` only for failures. A failure inside an open sheet uses an
  alert inside that sheet, so it is not lost behind an inert background.
- Counts update one node ("2 new items"), never one announcement per item.

### 5.4 Errors and entry

- Errors: text + icon below the field, `aria-invalid`, `aria-describedby`, focus
  to the first error, an error summary on long forms. Plain words: "Choose a
  reason to send your report."
- Character counts warn at 90% and at the limit, announced politely.
- **Redundant entry (SC 3.3.7):** the report note survives a failed send or an
  accidental close; the appeal draft survives navigation; the console reason
  survives an item refresh; blocking never asks for a reason.
- **No cognitive tests (SC 3.3.8):** no CAPTCHA, puzzle or "type the name to
  confirm" for Block, Remove or appeals. Moderators sign in by magic link or
  passkey only.

### 5.5 The moderator console

- **Landmarks, a skip link past the moderator navigation, real headings**
  ("Queue", then one heading per item).
- **Realtime never moves focus or reorders.** New items are announced once
  ("2 new items — Show") and inserted only when the moderator chooses; the
  focused item keeps its position.
- **"Live" indicator** is text, never animated, with "Pause live updates".
  Reduced motion is honoured by default.
- **Queue age** is static text ("waiting 22 minutes, as of 10:42"), refreshed on
  request — not announced every tick.
- **If another reviewer handles an open item,** the console announces "Another
  reviewer already handled this item" without moving focus and keeps any typed
  reason.
- **Session expiry** warns at least 20 seconds ahead with "Stay signed in", and
  keeps unsaved reasons; any "claimed by you" lock is announced and extendable.
- **Keyboard-complete.** Any single-key shortcuts can be turned off or remapped
  (SC 2.1.4).
- **Reflow.** The two-pane layout becomes one column at narrow widths and at
  400% zoom; sticky headers never cover a focused row (SC 2.4.11, 1.4.10).
- **Crisis alerts are visible and announced**, never sound-only.
- **Moderator care:** "Show this content" (`aria-expanded`, `aria-controls`) for
  crisis, violent and harassment categories, never auto-expanded; an optional
  "take a break" prompt that is never a timed modal; onboarding materials in
  the same plain language.

### 5.6 Other surfaces

| Surface | Requirement |
|---|---|
| Report sheet | Radio group with fieldset and legend; labels inside 44px rows |
| Muted-word list | Labelled input; "Remove '{word}'" text buttons; duplicate and over-60-character errors |
| Removed placeholder | A list item with text ("Removed"), not an empty row |
| Context note | A labelled region with a text label and the 3px Ink rule; links say where they go and that they open elsewhere |
| Crisis interstitial (Q8 b) | 🆘 stays reachable; expanding never hides the post from assistive technology |
| Public log and floor pages | Real tables with headers; dates in words |
| Consistent help (SC 3.2.6) | The contact link sits in the same place on report, block, appeal, console and public pages |

### 5.7 Gate before merge

Automated axe in the `web` jest project (ADR 0014) **plus** behaviour tests
there for §5.1–§5.5 (T5, T14, T15, T20–T22), a reduced-motion run, a
readability check (grade 8 or lower) over a single file holding every
member-facing string, and a manual keyboard and screen-reader pass with
VoiceOver, NVDA and TalkBack (JAWS if available), recorded in the PR.

---

## 6. Test plan — pinned test-first, each proven to fail (ADR 0013)

Write the tests, confirm they fail, **commit the failing tests**, then implement
without modifying them. Each is audited with `scripts/vacuity-audit.sh` (or, for
guards, a staged violating file) and recorded CAUGHT. Database tests are pgTAP
unless stated; `web` means the jest `web` project.

| # | Invariant | Deliberate violation |
|---|---|---|
| T1 | **No downvote** anywhere: no negative column, enum value or rating; note marks presence-only, one per member | Add `rating smallint`; add `'not_helpful'` |
| T2 | **RLS default-deny** on every new table and view; `authenticated` holds only matrix verbs; anon only on `floor_versions`, `floor_items`, `floor_reexamination_answers`, `governance_config`, `launch_gates*`, `moderation_log_public`, `interim_moderators_public`, published `triage_lists` | Drop a REVOKE; add `to anon` on `reports` |
| T3 | **No member identifiers in the public log or audit log**, and **no small cells**: no column or FK to `profiles`/`auth.users`; no reason text; cells under 5 suppressed; crisis never per room | Add `actor_id`; expose `reason`; publish a cell of 2 |
| T4 | **Deletion cascades** through reports, blocks (both sides), appeals, re-examination requests, `removed_content`, items/actions on deleted content, notes per Q1, moderator grants and pseudonym mappings; `MEMBER_OWNED_TABLES` cross-check | Switch an FK to `set null` (other than the notes case); omit a table |
| T5 | **The crisis control survives every moderation state** — present and **reachable by keyboard and in the accessibility tree while each sheet is open**: removed post (author/others), locked thread, report, block, appeal (gate unmet/met), muted post, console, public log, floor page, post-submit crisis panel; plus the render-failure fallback with working links; plus **crisis adjacency** — every page naming self-harm has the resources block in the same text block (`web`) | Render a sheet without its in-sheet control; make `CrisisHelpSheet` throw; remove the block from the log page |
| T6 | **Reporter anonymity** — subject, moderators and the subject's export never get `reporter_id`, note, count or timestamps; the note is gone after the item closes | Add `reporter_id` to the queue function; keep the note |
| T7 | **Tier 3 never routed to a vote** — no appeal-panel path from a Tier 3 action; tier is 1 or 3; a panel cannot lower 3 | Insert an appeal against a Tier 3 action; set tier 2 |
| T8 | **Honest copy follows the gate** — with G1/G2 unmet, no member, console or policy-page string promises a reviewer, panel or time (including the Tier 3 "look again" copy and the "Your request is saved" state) | Hard-code "A reviewer will contact you" |
| T9 | **Removal and temporary bans need a floor item**; a Tier 1 action cannot use `remove` | Insert a `remove` with no `floor_item` |
| T10 | **Floor-change rules** — `loosen` rejected without ADR, legal review, adequate notice (trigger), or while `minimum_notice` is NULL; `minimum_notice` > 0; privacy `loosen` needs `applies_from` + fresh opt-in; `tighten` cannot take effect before announcement; a `tighten` that removes or weakens an item is rejected; only the service function writes | Insert each bad row; label a weakening `tighten`; write as `authenticated` |
| T11 | **Triage is lists only** — no network call, and no post text, matched term or "crisis matched" signal in any log | Add a `fetch`; log the term or the signal |
| T12 | **Crisis resources shown at once** to the author, with working `tel:`/`sms:` actions, taking focus, never timed, whatever the gate; no analytics event, no stored country, `noreferrer` links | Gate resources on G1; use a plain URL; fire an event |
| T13 | **Block** hides both ways; the blocked member gets a neutral outcome on reply; moderators cannot read blocks | Expose the RLS error; add a moderator policy |
| T14 | axe clean on every new screen, plus the console's landmarks and skip link (`web`) | Remove a label; drop the skip link |
| T15 | **Realtime never steals focus** — an item arriving while focus is on item 3 leaves focus and order unchanged (`web`) | Auto-insert and re-sort |
| T16 | **COI:** a moderator cannot act on their own content or an item they reported | Act on own post |
| T17 | **COI:** an appeal cannot be decided by the acting moderator, the appellant, or a panelist who wrote or reported the content | Decide own appeal; decide about own report |
| T18 | **Two-person rule** confirms with two distinct people | Confirm own removal |
| T19 | **Grants expire and are capped:** no end date, an end before the start, an interim term over `max_interim_term` (or any interim grant while it is NULL), or an extended interim end date is rejected; an expired grant gives no `is_moderator()` | Insert each; update an interim `expires_at` |
| T20 | **Dialog contract** per sheet: focus in, trap, Escape, return — including return after the opener unmounts (`web`) | Return focus to body |
| T21 | **Status messages** announced via the root status region, including while a sheet is open (`web`) | Render confirmation without the region |
| T22 | **Removed text unreadable** by a second member, including Realtime payloads and derived copies; author and moderators can read it; it is in the author's export | Leave `body` in `posts`; set `REPLICA IDENTITY FULL` |
| T23 | **Moderators cannot read** `health_self_ids`, `memberships`, `member_blocks`, `legal_holds`, `moderator_pseudonyms` (no `muted_terms` table exists: Q6) | Grant through `is_moderator()` |
| T24 | **Interim grants are limited:** an interim moderator cannot remove, ban or lock for a Tier 1 reason (all three tested) | Interim grant removes, bans or locks for a Tier 1 reason |
| T25 | **Legal holds** have a basis and an end date, no member access, and are covered by the cascade test when released | Insert a hold without an end date |

**Database tests caveat.** `db` jest and pgTAP have not run since 2026-08-09;
cloud sandboxes cannot pull the Supabase images. The phase is **not done** until
every database test above runs green against a local stack (G8).

---

## 7. ADRs this needs

Numbering continues after the rule-file PR's ADR 0018. (ADR 0015 is still
missing from `docs/adr/`; `.claude/hooks/secrets-pii-scan.sh` cites it — a known
follow-up.)

1. **Moderation data model and authorization matrix** — tables, grants, RLS,
   `is_moderator()`, grants with end dates, COI triggers, removed content,
   deletion, legal holds, export, reporter anonymity, and the explicit
   supersession of Amendment 1 §12.1's immutable-audit wording.
2. **Publishing the floors** — `docs/policy/`, `floor_versions`/`floor_items`,
   the enforced change rules, re-examination requests, the misinformation
   boundary.
3. **Triage lists** — publication (Q5), normalization, what triage may and may
   not do, crisis-item minimization.
4. **Context notes** — the founder's choice (Q1), clinical and partner limits,
   no negative rating.
5. **Appeals and launch gates** — `launch_gates`, honest copy, the panel,
   one equal vote per panelist.
6. **Crisis routing in community spaces** — automatic resources, the country
   list without stored location, G1, never journals. Counsel confirms routing a
   post to a trained human is moderation, not inference (vision §7.4).
7. **Moderator identity and accountability** — Q4.
8. **Moderation UI** — modal vs. inline sheets, the dialog contract, the console.

---

## 8. Launch gates — explicit, all **unmet**

| Gate | Blocks | Definition |
|---|---|---|
| **G1 — Crisis response and review staffing** | Member launch; any copy promising review or response | **TBD (founder decision 1).** Must define: who reviews, training, hours, what happens outside them, any response targets, when two-person review is required, moderator care. Nothing is invented here |
| **G2 — Appeals panel** | Member launch; deciding Tier 1 appeals | **TBD (founder decision 3).** Must define: the interim panel (at least 3 distinct people, labelled "interim" with an end date and replaced by election — PRD §6.2 calls for an elected panel), how chosen, size, quorum, tie rule, terms, conflicts, timelines. **Decided 2026-10-29 (Q3): the founder does not sit on the interim panel.** Still unmet |
| **G3 — Context-note oversight** | Publishing context notes | **Model decided 2026-10-29 (Q1): C, fallback A.** The clinical reviewers and partner roles are **TBD; still unmet**, within §4.3's limits |
| **G4 — Who moderates before elections** | Granting any `moderator_grants` row | **Model decided 2026-10-29 (Q3 b):** founder-appointed interim moderators, named publicly, with end dates, replaced by election. **Who they are is TBD; still unmet.** Elections need Phase 3 |
| **G5 — Published floors v1** | Member launch | Both floors at `docs/policy/` and in the app, each item with its basis; `minimum_notice` set in the charter |
| **G6 — Legal review** | Member launch (CLAUDE.md #7) | Counsel on: the floors; crisis routing; triage-match inference under MHMDA and similar laws, and its disclosure; legal holds; appeals copy; the public log; Section 230 (vision Appendix B) |
| **G7 — Manual accessibility pass** | Member launch | Recorded for every moderation surface, moderators' included, with the screen readers in §5.7 |
| **G8 — Database tests run** | Calling this phase done | pgTAP and `db` jest green against a local stack |
| **G9 — Data inventory entries** | Member launch. **Deferred — values NULL, fail closed; set with counsel before launch** (founder, 2026-10-29) | Retention for `removed_content`, closed crisis items, `reports`, appeal statements, action reasons, expired grant rows and access logs; the small-community threshold for the log; `max_interim_term` and the interim gap (with G4) |

The gates appear in `launch_gates` and on the public policy page.

---

## 9. Open questions for the founder

**Q1 — Context notes model.** A, B or C (§4.3)? Recommended: **C at launch, A as
fallback**, B only after its own ADR. Also: when a note's author deletes their
account, delete the note, or keep it with no author?

> **Decided 2026-10-29.** C at launch: a partner-sourced library written with
> clinical and partner input. A is the fallback: a moderator-written note with
> clinical review before publishing. B only after its own ADR, with privacy
> and governance review. A deleted author's note is **kept with no author**.

**Q2 — removed (decided in §3.9).** Review found per-action log rows could
identify people in small rooms, so the plan now publishes weekly aggregates with
suppression. Tell me if you want finer detail anyway.

> **Confirmed 2026-10-29.** Weekly aggregates, small cells suppressed (§3.9).

**Q3 — Who holds interim moderator grants (G4).**
- (a) The founder only.
- (b) Founder-appointed interim moderators, named publicly, with end dates,
  replaced by election.
- (c) A partner organization's trained staff, under a written agreement, named
  publicly, with end dates.
- Recommended: **(b)**. Also: may the founder sit on the interim appeals panel?
  Review flagged a structural conflict: the founder would appoint the
  moderators whose decisions the panel reviews. Recommended: **no** — or at
  least mandatory recusal from appeals about the founder's own appointees.

> **Decided 2026-10-29: (b).** Founder-appointed interim moderators, named
> publicly, with end dates, replaced by election. **The founder does not sit on
> the interim appeals panel.** G4 (who) and G2 (the panel) stay unmet.

**Q4 — Moderator accountability without member identifiers in the audit log.**
- (a) `actor_id` (a member id) in `moderation_actions`, visible only to the
  panel and the moderator.
- (b) A stable pseudonym per moderator ("Moderator 7"); the mapping is held
  separately, deletable, with logged access, and never public. Panelists see
  appellants by pseudonym too.
- (c) No individual attribution.
- Recommended: **(b)**.

> **Decided 2026-10-29: (b).** A stable pseudonym per moderator; the mapping is
> held separately (`moderator_pseudonyms`), deletable, its access logged, never
> public. Panelists see appellants by pseudonym.

**Q5 — Publishing the triage lists.**
- (a) Every list in full.
- (b) Crisis and misinformation lists in full; spam and scam lists as categories
  with examples, because full lists help spammers evade.
- Recommended: **(b)**, if you agree it still counts as "published".

> **Decided 2026-10-29: (b).** Crisis and misinformation lists published in
> full; spam and scam lists published as categories with examples.

**Q6 — Muted words on the server or on the device?**
- (a) Server (`muted_terms`), owner-only, exported and deleted; follows the
  member across devices.
- (b) Device only; nothing stored; lost on a new device.
- Recommended: **(a) only with its own consent purpose** (unchecked by
  default, in the consent ledger; withdrawal deletes the terms), because the
  baseline user may switch devices with help. Privacy review notes **(b)** is
  the safer default if you'd rather not add a consent purpose.

> **Decided 2026-10-29: (b) device only at launch.** Nothing stored on the
> server; no `muted_terms` table; no new consent purpose. The UI says plainly
> that muted words do not follow a member to a new device. Server sync can come
> later under its own consent purpose and review.

**Q7 — Holding spam and scam matches.** (a) hold as "checking" until a human
looks; (b) publish with a "being checked" note; (c) publish normally. Holding
needs G1, or posts sit unseen.

> **Decided 2026-10-29: (a)**, hold as "checking" until a human looks. It
> depends on G1, which is unmet.

**Q8 — Crisis posts in the feed.** (a) Fully visible, with resources to the
author; (b) visible behind a gentle "This post talks about very hard feelings —
Show" for other readers. Recommended: **(b)**. Counsel and G1 inform it.

> **Decided 2026-10-29: (b)**, visible behind a gentle "This post talks about
> very hard feelings — Show" for other readers, with resources to the author.
> Counsel and G1 inform the final copy.

**Q9 — Temporary bans before elections.** Allowed only for safety-floor
violations, by G4 holders, with a floor item, a reason, an end date and a second
look?

> **Decided 2026-10-29: yes, only that.** Safety-floor violations only, by G4
> holders, with a floor item, a reason, an end date and a second look.

**Still unmet after these answers:** G1 (crisis staffing), G2 (appeals panel),
G3 (context-note oversight) and G4 (interim moderators) are recruitment
decisions for the founder and are **not defined**. Nothing in this build
populates `moderator_grants`, a panel or a reviewer, or invents people, hours
or response times. G9 (data-inventory values) is also unmet, and it blocks the
migrations (§8).

---

## 10. Build order (after approval)

Progress (2026-10-29): step 0 is merged (PR #10). Steps 1–3 are on PR #11.
**Step 3 is built with G9 deferred:** the founder decided on 2026-10-29 that
the migrations ship with every G9 value NULL, failing closed (no grant, no
ban, no purge job, no per-community public-log row). That is acceptable only
because no member data exists. G9 still blocks member launch. See §12.

0. Fix `CrisisHelpSheet` and `AppShell`: `tel:`/`sms:` for 988, an
   emergency-number action, focus move and return, dialog role and name, the
   render-failure fallback, and a banner landmark for the header. Test-first.
1. ADRs 1, 2 and 5, with privacy-reviewer and governance-reviewer.
2. Failing tests T1–T23 committed.
3. Migrations: expand (`posts`/`comments` columns, new tables with REVOKEs),
   then policies, triggers and functions.
4. Member flows: report, block, muted words, removal notice, appeal form,
   contact page (gate-aware).
5. Moderator console (B15, §5.5).
6. Public pages: floors, gates, log, re-examination requests.
7. ADRs 3, 4, 6, 7 and 8 as Q1–Q9 are answered; context notes ship last,
   behind G3.
8. Reviewers on every step: privacy, governance, a11y.

---

## 11. Review record

**Round 1 (2026-10-28):**

- **privacy-reviewer: FAIL (3 blocking).**
  - Removed text was still readable through the API. Fixed in §3.2.
  - The public log could identify people in small rooms. Fixed in §3.9.
  - Crisis matches and report notes are inferred health data with no limits.
    Fixed in §3.1, §3.8, §4.8 and G6.
  - 9 non-blocking items applied (reporter anonymity, author-visible actions,
    block disclosure, muted terms, option B's marks table, view security, panel
    pseudonyms, deletion of moderator mappings, recording the Amendment 1
    supersession).
- **governance-reviewer: conditional pass (4 blocking).**
  - Floor-loosening checks were weaker than ADR 0017. Fixed in §2.2.
  - Omitted floor-change rules. Fixed in §2.2–§2.3.
  - No conflict-of-interest enforcement. Fixed in §3.6 and T16–T18.
  - The interim authority had no end date. Fixed in §3.5 and T19.
  - 9 non-blocking items applied (tiers 1/3 only, the misinformation boundary,
    option B's weighting risk, limits on clinicians, legal holds, log kinds and
    "fewer than 5", bans need a floor item, `floor_items`, non-goals).
- **a11y-reviewer: FAIL (5 blocking).**
  - The crisis control was unreachable inside sheets, with no fallback. Fixed
    in §5.1 and T5.
  - The dialog contract was missing. Fixed in §5.2 and T20.
  - Status messages were missing. Fixed in §5.3 and T21.
  - Console realtime and focus rules were incomplete. Fixed in §5.5 and T15.
  - The crisis copy's reading level was too high, with no `tel:`/`sms:` actions
    and no non-US route; the removal notice used jargon. Fixed in §4.4–§4.6.
    This also surfaced the shipped `CrisisHelpSheet` defects (§0).
  - 15 non-blocking items applied in §5.

**Round 2 (2026-10-28):**

- **privacy-reviewer: PASS.** 9 non-blocking items applied:
  - Realtime and derived copies of removed text, and removed text in the export
    (§3.2, T22).
  - Suppression extended to the site-wide crisis count, log kinds and audit
    roles (§3.9).
  - Retention for reports, appeals and action reasons; the report note purged
    on close (§3.3, G9).
  - A `legal_holds` schema (§3.3, §3.10, T25).
  - Re-examination requests via a view, after human review, with no identifier
    by default (§2.3).
  - Publishing grants needs consent and has a retention period (§3.3).
  - The crisis country choice stays on the device, with no analytics (§4.6,
    T12).
  - Access to one's own crisis items goes to counsel (§3.8).
  - Muted words need their own consent purpose (§4.8, Q6).
- **governance-reviewer: conditional pass (1 blocking).** The interim term was
  not enforced. Fixed in §3.5 — capped, never extended, no repeat grant, basis
  checked in the action functions — and T19/T24. 8 non-blocking items applied:
  - `minimum_notice` in a trigger and above zero.
  - A `tighten` must actually tighten.
  - Test numbering, and the panelist conflict case in T17.
  - No weight column; a CHECK on choices; a tie rule.
  - The founder-on-panel recommendation in Q3, and at least 3 people in G2.
  - Privacy for re-examination requests.
- **a11y-reviewer: FAIL (1 blocking).** Pages naming self-harm lacked
  same-block crisis resources. Fixed in §5.1 and T5. 9 non-blocking items
  applied:
  - The status region at the root, and alerts inside sheets.
  - Focus and timing for the post-submit panel.
  - Inline panels on native.
  - Fallback links.
  - The Tier 3 "look again" copy, and "Your request is saved".
  - Decorative emoji.
  - The `AppShell` landmark (§0, §10 step 0).

**Round 3 (2026-10-28): PASS from all three reviewers**, with no blocking items.
Optional notes applied:

- T24 covers remove, ban and lock.
- T11 also checks the "crisis matched" signal.
- T14 checks the console landmarks and skip link.
- Muted-word status messages never echo the word.

Left for build time:

- The `expires_at > granted_at` CHECK goes in the migration header.
- The moderation UI ADR picks inline panels or tested stacked modals for
  native before step 4.
- If Q6 (a) is chosen, the consent purpose exists before the migration, with
  a withdrawal-deletes-terms test.
- The §5.1 crisis links carry no click handlers or analytics.

---

## 12. Build step 3 record (2026-10-29)

Migrations `20261029130000`, `20261029130100` and `20261029130200`; ADR 0019
"Build notes" lists what differs from the ADR and what is not built yet.

**Tests.** T1–T23's database files (10–21) went green without edits. Two
existing files grew with the migration, as `db.md` and their own headers ask:
`03_deletion_cascade` (the member-linked moderation tables) and
`06_function_execute_allowlist` (the EXECUTE matrix). A new file,
`22_moderation_review_fixes`, holds the review round 1 tests and the audit's
missing guards. It was committed failing before the fix.

**Test defect found, not edited.** `13_moderation_cascade_test`'s foreign-key
check compares `conrelid::regclass::text` with `'public.<table>'`. With
`public` on the search path, regclass prints bare names, so the check matches
nothing and always reports 0. Switching `reports.reporter_id` to
`on delete set null` passes all 35 assertions. File 22 carries a correct
check (`conrelid = any(array[...]::regclass[])`), which catches it. The fix to
file 13 is the founder's call.

> **Corrected 2026-10-30, by founder decision.** File 13 now compares
> `regclass[]` values, as file 22 does. This corrects a vacuous test (ADR
> 0013); it does not weaken one. Proof, against a local stack: with
> `reports.reporter_id` switched to `on delete set null`, the old check
> passed (ok 21) and the corrected one fails (not ok 21). On the real
> schema the corrected check passes.

**Vacuity audit** (`scripts/vacuity-audit.sh`, one mutation each, against a
local Postgres 16 + pgTAP with a Supabase shim; a mutation that broke the
migration itself was re-run until it applied):

| Invariant | Mutation | Result |
|---|---|---|
| T1 | `weight` column; `not_helpful` enum label; unique per panelist dropped | CAUGHT ×3 |
| T2 / T23 | anon SELECT on `reports`; authenticated REVOKE dropped; moderator policy on blocks | CAUGHT ×3 |
| T3 | `actor_id` in audit; small-cell CHECK off | CAUGHT ×2 |
| T3 | crisis-per-room CHECK off | VACUOUS in file 12 (the G9 threshold rule also rejects the row); CAUGHT by file 22, which sets the threshold first |
| G9 log rule | threshold trigger off | VACUOUS in file 12; CAUGHT by file 22 |
| T4 | `reports.reporter_id` → `set null` | Was **VACUOUS in file 13** (defect above); **CAUGHT by file 13 since 2026-10-30**; CAUGHT by file 22; `member_bans` likewise CAUGHT by 22 |
| T4 (unit) | `reports` dropped from `MEMBER_OWNED_TABLES` | CAUGHT |
| T6 | queue returns `report_count`; note kept on close | CAUGHT ×2 |
| T7 | `submit_appeal` takes Tier 3; tier CHECK off | CAUGHT ×2 |
| T7 | Tier 3→1 guard off | VACUOUS alone (the tier/category CHECK also refuses); CAUGHT with both off |
| T8 | met without definition; seeded met; no history row; member writes a gate; hard-coded "A reviewer will contact you within 24 hours" in `src/` | CAUGHT ×5 |
| T9 | table accepts `remove` with no floor item; floor item on a Tier 1 item; crisis item removable | CAUGHT ×3 |
| T9 | privacy-floor removal | VACUOUS with one or two of three layers off (`moderate()`, action trigger, `removed_under` guard); CAUGHT with all three off |
| T10 | loosen with NULL notice; notice not enforced; tighten rewrites; `initial` twice; items rewritable; versions deletable; tighten at announcement; zero notice; member writes a floor | CAUGHT ×9 |
| T11 (unit) | `raise notice` with the body; a `net.http_post` call | CAUGHT ×2 |
| T13 | block one way only; self-block | CAUGHT ×2 |
| T16–T18 | own content; own report; proposer confirms; conflicted confirmer; acting moderator decides; reporter-panelist decides | CAUGHT ×6 |
| T19 | G4 unchecked | VACUOUS in file 19 (NULL `max_interim_term` also refuses); CAUGHT by file 22 |
| T19 | elected allowed | VACUOUS in file 19 (interim checks also ran for elected grants; fixed); CAUGHT by file 22 |
| T19 | interim with NULL term; term cap; extension; second interim with NULL gap; no naming consent; expired or revoked still a moderator; consent withdrawal ignored | CAUGHT ×8 |
| G9 bans | ban allowed with NULL `max_ban_term` (function and trigger) | CAUGHT |
| T22 | body left in `posts`; `REPLICA IDENTITY FULL`; `removed_content` open; author reads actions | CAUGHT ×4 |
| Round 1 | back-dated loosen; block check public; orphan item; crisis reason kept; notes kept; two-person CHECK off; privacy-floor citation; ban lengthened; banned member edits; service_role EXECUTE | CAUGHT ×10 |

Every VACUOUS row is either a layered rule (each layer backs the other, and
removing all layers is caught), or now has its own test in file 22. File 13's
defect was corrected on 2026-10-30.
