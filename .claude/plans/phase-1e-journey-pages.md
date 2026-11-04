# Phase 1E plan — journey pages: member-owned long-form, publish lifecycle

Status: APPROVED 2026-07-08 (all three decisions as recommended) — EXECUTED; see ADR 0009
Date: 2026-07-08
Basis: PRD §7.4, §9; Wireframe B7; Brand v2 §3 (long-form type), §8
(buttons/cards, destructive pattern), §9 voice; ADR 0003 (journey_entries +
RLS exist since 1B), 0005 (grants), 0006 (social-core patterns).
Out of scope: media (Phase 2M; journey pages are outside Amendment 2's scope
anyway), moderation/⚑, governance, payments, analytics, realtime, SEO/public
exposure (decision c), avatars, Follow/notifications (B7's [ Follow ] —
DEFERRED, flagged for ADR 0009).

## THE THREE DECISIONS (recommendations for approval)

### a) Journey upbeats — RECOMMEND: INCLUDE NOW
B7 shows ♥ on entries; the 1B upbeats CHECK allows exactly one of
post_id/comment_id. Honest costing:
- The cost is IDENTICAL whenever it's paid: a reviewed expand-only migration
  (nullable `journey_entry_id` FK ON DELETE CASCADE, CHECK becomes
  exactly-one-of-THREE, `unique(member_id, journey_entry_id)`), a types
  regen, and a sanctioned amendment to pgTAP suite 00's exact-column-set
  assertion (STOP-and-ask protocol, its own commit, like 1D's).
  Deferring shrinks nothing — it just re-pays session setup later.
- Everything else is warm NOW: UpbeatButton, the toggle lib, the 23505
  race pattern, the TDD/red-checkpoint machinery, both reviewers.
- NO grant change (upbeats already grants authenticated select/insert/delete;
  anon has none — ADR 0005 posture untouched). NO RLS policy change (insert/
  delete are member_id-scoped; the CHECK owns subject shape).
- The no-downvote invariant emerges PROVABLY intact: still a presence/absence
  row, no sign/weight column, one per member per entry, score = count(*).
  Suite 00's amendment ADDS a unique-constraint assertion for the new pair
  (plan = 12 assertions, up from 11) while the columns_are list gains exactly
  `journey_entry_id`. Nothing is weakened; the plan count goes UP.
- Migration is expand-only: nullable column, no backfill, no dual-write, no
  data movement (safe-evolution rules satisfied trivially).
Tradeoff if deferred: B7 ships visibly incomplete (no ♥ on the most personal
content in the product), and the same migration + amendment land in a colder
session. Recommend include.

### b) DisclaimerBand on journey pages — RECOMMEND: NO
The band means "general information, not medical advice — talk to your
clinician." It belongs on EDUCATIONAL content (professional posts/comments,
1D). Journey entries are personal narrative — someone's own story about
their own heart. Stamping a medical disclaimer on a member's lived
experience (a) misreads the content type, (b) reads as institutional
distrust of their truth ("pain is not a competition" cuts both ways),
(c) dilutes the band exactly where it must stay meaningful. PRD §7.4 asks
for supportive, member-owned long-form — no disclaimer requirement. The 🆘
crisis affordance remains on every screen via AppShell (safety unchanged).
Even a professional-role author's journey entry is narrative, not broadcast
education — the role-based band stays scoped to posts/comments. Revisit only
if Phase 2 moderation shows journey pages being used as education. A render
test PINS the band's absence so drift is caught.

### c) Read scope — RECOMMEND: KEEP AUTHENTICATED-ONLY (confirm)
Current enforced posture (1B RLS + ADR 0005 grants): journey content is
authenticated-only; anon has NO grant on journey_entries at all (42501 at
the table gate — stronger than zero-rows). B7's "public pages are shareable"
defers to research spec §8 (SEO/indexing, "never indexed in a way that
exposes private health-gated content") which is NOT in-repo. Making journey
pages anon-readable is a grant + policy + indexing-strategy decision with
real privacy stakes (these are people's hardest stories, often adjacent to
health details they chose to write). Keep authenticated-only this slice;
flag public-shareability as a research-spec reconciliation item requiring
its own reviewed grant/RLS decision (and probably per-entry member opt-in,
not a blanket flip). ADR 0009 records it.

## Routes + components

```
app/journey/index.tsx        My journey: own entries (Draft + Published),
                             write/edit/publish/unpublish/delete
app/journey/editor.tsx       Composer (new; ?id= for edit): title + long-form
                             body. Plain text/paragraphs. NO media control.
app/journey/entry/[id].tsx   Reading view (published-or-own via RLS),
                             long-form presentation, upbeat control if (a)
app/members/[id]/journey.tsx Another member's journey: PUBLISHED entries only
```
All inside AppShell (🆘 everywhere). Entry points: feed nav row gains a quiet
"My journey" button; the thread screen's author meta line gains a quiet
"{name}'s journey" button (B7 is profile-reached; no profile screen exists
yet — flagged in ADR as the minimal interim).

Components:
- `JourneyEntryCard` — list card: title, status chip as TEXT ("Draft" /
  "Published {Month Year}"), body preview, upbeat count if (a).
- `ConfirmDelete` (or inline region) — the Brand §8 destructive pattern:
  Paper fill, Heart Deep text + border, explicit label ("Delete this
  entry"), and a REQUIRED confirmation step: pressing reveals an inline
  confirm region ("This deletes the entry for good. There's no undo." →
  [Yes, delete it] destructive + [Keep it] secondary). Inline, not
  RN Alert — accessible, keyboard-reachable, testable.

Long-form presentation (Brand §3): body 18px / line-height 29 (≥1.6),
Atkinson Hyperlegible, measure capped ~70ch (maxWidth 640 container), title
at page-title scale. Editor inputs labeled ABOVE (never placeholder-as-label).

## Data access — src/lib/social/journeys.ts (1D patterns; session client only)

- `listMyJourneyEntries(client)` — own drafts + published (RLS-backed;
  explicit `.eq("author_id", uid)` as belt-and-braces).
- `listMemberJourneyEntries(client, memberId)` — another member: explicit
  `.eq("is_published", true)` AND RLS enforces it regardless (the test
  proves the RLS layer alone hides drafts — no client-side-only filtering).
- `getJourneyEntry(client, id)` — published-or-own via RLS; null when hidden.
- `createJourneyEntry(client, {title, body})` — draft by default.
- `updateJourneyEntry(client, id, {title, body})`
- `setJourneyPublished(client, id, published)` — publish/unpublish.
- `deleteJourneyEntry(client, id)`
- If (a): `UpbeatSubject` gains `{ journeyEntryId }`; `listMyUpbeats` gains
  `journeyEntryIds`; toggle primitives unchanged (the constraint arbitrates).

## Decision-(a) migration (only if approved)

`supabase migration new journey_upbeats`: add nullable
`journey_entry_id uuid references journey_entries(id) on delete cascade`;
drop + recreate `upbeats_exactly_one_subject` as one-of-three; add
`upbeats_one_per_member_journey unique (member_id, journey_entry_id)`;
header comment per ADR 0005 (no grant changes — none needed). Types regen to
src/lib/database.types.ts. Sanctioned pgTAP suite-00 amendment (STOP-and-ask
already granted by approving this plan? NO — I will still present the exact
diff lines for explicit sign-off before touching the suite, per protocol).

## TDD list (1D red-checkpoint exclusion pattern)

tests/db/journey-lifecycle.test.ts:
- owner lifecycle: create (draft by default) → edit → publish → unpublish →
  delete → gone (author's own reads confirm each step).
- visibility at the DB LAYER: member B cannot read A's draft (getJourneyEntry
  → null; list → absent) but sees it once published; anon select on
  journey_entries → 42501 (grant-layer denial, per decision c).
- spoof: insert with author_id = other member → 42501 (WITH CHECK).
- delete-cascade adjacency: deleting the ENTRY removes its upbeats (if a).
tests/db/journey-upbeats.test.ts (if a):
- add → count 1; raw duplicate → 23505; helper → "already"; remove → 0;
  no negative state pathway.
pgTAP suite 00 (if a): sanctioned amendment — columns_are gains
journey_entry_id; NEW col_is_unique(member_id, journey_entry_id) assertion;
plan 11 → 12. Suites 01/02/03 untouched.
tests/components/JourneyEntryCard.test.tsx:
- status chip is text ("Draft"/"Published"); title/preview render; card
  accessible name; 44px; NO disclaimer-band (decision b pinned).
tests/screens/journey-editor.test.tsx:
- labeled Title + "Your story" inputs (labels above, aria-labelledby);
  save-draft calls create; publish path calls setJourneyPublished; NO
  upload/attach/media control (regex sweep, 1D pattern); keyboard-reachable
  primary actions ≥44px.
tests/screens/journey-reading.test.tsx:
- body text style: fontSize 18, lineHeight ≥ 28.8, Atkinson regular;
  container measure ≤ 680; delete flow REQUIRES confirmation (first press
  reveals the confirm region, delete fires only on "Yes, delete it";
  "Keep it" cancels); destructive button = Paper fill + Heart Deep text
  (asserted via style); no disclaimer-band.

## A11y plan

Headers marked; labels above inputs; destructive confirm is inline,
focusable, worded (never color-only); status chips text-based; all targets
≥44px with focus rings; long-form 18/1.6/70ch; no motion; every screen in
AppShell (🆘); plain §9 voice around people's hardest stories — quiet and
warm ("Your story is yours. Publish when you're ready, or keep it as a
draft forever.").

## Reconciliation notes (for ADR 0009)

1. B7 [ Follow ] — deferred (notifications/following are a later slice).
2. B7 "Member since · communities" header line — needs profiles.created_at
   (exists) + membership visibility of OTHER members (memberships RLS is
   self-only!) — the same class of decision as 1D's member counts: deferred,
   never loosened casually. Journey header shows display_name only this
   slice.
3. Public shareability / SEO → research spec §8 (absent); decision (c).
4. Journey entries and Amendment 2: explicitly out of scope for media.
