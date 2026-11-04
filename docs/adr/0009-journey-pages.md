# ADR 0009 — Journey pages: member-owned long-form, publish lifecycle

Status: Accepted
Date: 2026-07-09
Relates: PRD §7.4; Wireframe B7; Brand v2 §3/§8/§9; ADR 0003 (journey_entries
+ RLS, 1B), 0005 (grants), 0006 (social-core patterns); plan
.claude/plans/phase-1e-journey-pages.md (approved with all three decisions).

## What shipped

Routes (all in AppShell — 🆘 everywhere): `/journey` (own list, drafts +
published), `/journey/editor` (new/edit; title + plain-text long-form; NO
media control — pinned by test), `/journey/entry/[id]` (reading view),
`/members/[id]/journey` (another member's PUBLISHED entries). Components:
`JourneyEntryCard` (text status chip), `JourneyEntryView` (Brand §3 long-form:
18px body, 1.6 line-height, 640px ≈ 70ch measure, Atkinson; owner controls;
inline destructive-delete confirmation). Data layer `src/lib/social/journeys.ts`
(session client only). Entry points: feed nav "My journey"; thread author line
links to the author's journey (no profile screen exists yet — minimal interim).

## The three decisions (founder-approved 2026-07-08)

### a) Journey upbeats — INCLUDED
Expand-only migration `20260709013535_journey_upbeats.sql`: nullable
`journey_entry_id` FK ON DELETE CASCADE; CHECK became exactly-one-of-three;
new `unique(member_id, journey_entry_id)`. ZERO grant/RLS changes (upbeats
grants already sufficient; anon still has none). Sanctioned pgTAP suite-00
amendment applied exactly as the founder-reviewed diff (commit af1b86d,
git-verified: 2 lines changed + 2 added): plan 11 → 12 — the column set
gained `journey_entry_id` and a NEW unique-pair assertion was added. More
assertions, never fewer. The no-downvote invariant is provably intact:
presence/absence row, no sign/weight, one per member per subject, score =
count(*). pgTAP total: 35.

### b) No DisclaimerBand on journey pages
The band means "general information, not medical advice" — it belongs on
education (professional posts/comments, 1D). Journey entries are personal
narrative: stamping a medical disclaimer on someone's own story misreads the
content, reads as institutional distrust, and dilutes the band where it must
stay meaningful. Even a professional-role author's journey entry is
narrative, not broadcast education. Render tests PIN the band's absence.
Revisit only on Phase 2 moderation evidence of journeys-as-education. The 🆘
crisis affordance is on every screen regardless.

### c) Read scope: authenticated-only (confirmed)
Journey content stays authenticated-only — anon has NO grant on
journey_entries (42501 at the table gate; asserted in tests). B7's "public
pages are shareable" defers to the absent research spec §8 (SEO/indexing).
**Standing rule (founder note): any future public shareability is PER-ENTRY
member opt-in through a reviewed grant/RLS decision — never a blanket flip.**

## Deferrals (approved; same rationale class as 1D's member-count rule)

1. **B7 [ Follow ]** — following/notifications are a later slice.
2. **B7 "Member since · communities" header line** — requires OTHER-member
   membership visibility; memberships RLS is deliberately self-only. Arrives
   (if ever) as a reviewed aggregate/disclosure decision, never a casual
   loosening. Journey headers show display_name only.

## Design notes

- Draft privacy is RLS-backed, never client filtering: the 1B
  published-or-own policy is untouched, and the lifecycle test proves a RAW
  query from another member returns zero rows for a draft.
- Deletion is a real DB delete; entry→upbeats cascades (proven in test);
  member→entries cascade unchanged (pgTAP suite 03 untouched).
- Destructive delete follows Brand §8: Paper fill, Heart Deep text+border,
  explicit label, REQUIRED inline confirmation ("This deletes the entry for
  good. There's no undo.") — plus, per a11y review: the confirmation region
  is a polite live region, focus lands on the SAFE control ("Keep it") when
  it opens, and returns to the trigger when it closes.
- `PostListItem.author_id` added (optional) to link author → journey.

## Reviewer gates

- privacy-reviewer: PASS 7/7 (RLS-backed drafts; no health data near the
  surface; migration contains zero grant/policy statements — git-verified;
  real deletion + cascade; no SEO/indexing exposure; sanctioned amendment
  exactly as approved; no donation vocabulary/analytics).
- a11y-reviewer: one BLOCKING finding (delete-confirmation region announced
  to AT + focus management) — FIXED and re-verified. Advisory recorded, not
  applied this slice: the editor inputs dual-label (accessibilityLabel +
  aria-labelledby, a pre-existing house pattern the frozen tests match) —
  candidate for a dedicated a11y-polish pass across all screens.

## Research-spec reconciliation

1. Public shareability/SEO of journey pages → spec §8 (absent); decision c.
2. B7 upbeat counts on entry cards → implemented via decision a.
3. B7 Follow + header metadata → deferred (above).
4. Media in journey entries: outside Amendment 2's scope by its own terms;
   journey pages remain plain text indefinitely until a future amendment
   says otherwise.
