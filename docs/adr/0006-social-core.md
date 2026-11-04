# ADR 0006 — Phase 1D social core: communities, threads, comments, composer, upbeats

Status: Accepted
Date: 2026-07-08
Relates: PRD §7.2/§7.3/§9; Wireframes B4–B6, C4–C7; Brand v2 §8/§9;
ADR 0003 (data model), 0004 (auth), 0005 (grants); plan
.claude/plans/phase-1d-social-core.md (approved 2026-07-08).

## What shipped

Routes (all inside AppShell — 🆘 on every screen): `/feed`, `/compose`,
`/communities`, `/communities/[slug]`, `/posts/[id]`; the landing page now
redirects signed-in members to the feed and offers signed-out visitors the
anon community browse. Components: `UpbeatButton`, `PostCard`,
`CommentThread`, `CommunityRow`. Data layer `src/lib/social/` (typed
functions over the session client only; no privileged key can appear in
client code, verified in the exported web bundle). No schema, policy, grant,
or migration change; no new tables.

## Decisions

### 1. Realtime — DEFERRED (founder-approved)
Fetch-on-focus + pull-to-refresh + an explicit Refresh button ship instead of
Supabase Realtime Broadcast. The authoritative channel design lives in
research spec §4/§7, which is not in-repo — building Broadcast now means
inventing what the spec defines. Websocket lifecycle also costs the 65+/older-
device baseline user battery and fragility for little peer-support value at
MVP traffic. Staleness of an upbeat count harms no one. Revisit as a polish
slice when the spec lands.

### 2. Report flag (⚑) — OMITTED ENTIRELY (founder-approved)
The wireframes show ⚑ on every card, but the moderation queue and human
review behind it are Phase 2. In a health community, a flag that silently
goes nowhere is a FALSE safety affordance — a member who reports dangerous
misinformation and walks away believing a human will look is worse off than
one who sees no flag. A disabled stub also fails the honesty voice (§9) and
adds focus noise. The ⚑ ships in Phase 2 with the queue it feeds. A
PostCard test pins the absence so it can't drift in unnoticed.

### 3. Member counts — NOT displayed (founder-approved)
Wireframe B5 shows "4,210 members," but `memberships` RLS is deliberately
self-only, so any client-side count would truthfully render 0 or 1. Standing
rule recorded per approval note: a future member count arrives as a
deliberate, reviewed aggregate surface (e.g. SECURITY DEFINER counter) in
Phase 2+ — NEVER as a loosening of memberships RLS.

### 4. Upbeat toggle mechanics
Optimistic flip with snapshot rollback; add = insert, remove = delete of the
presence row; a 23505 duplicate (double-tap, second device) resolves as
"already upbeated" — the DB unique constraint is the arbiter, never a crash.
Counts are aggregates per fetch (`upbeats(count)`); the denormalized
`posts.upbeat_count` stays deferred (ADR 0003 #9). No pathway renders or
stores negative state.

### 5. Toggle state exposure — accessibilityState.selected (sanctioned amendment)
The checkpoint test originally asserted `accessibilityState.pressed`; RN core
whitelists accessibilityState to {busy, checked, disabled, expanded,
selected} and silently strips `pressed` (verified in the installed RN source
— Pressable/View/Text all rebuild from that whitelist). Founder-approved
3-line amendment (commit 6a8b195): assert `selected` (the RN toggle idiom),
and the component ALSO passes `aria-pressed` through to react-native-web so
the web DOM carries true ARIA toggle-button semantics. The literal-
satisfaction alternative (semantics on a nested Text) was rejected because it
degrades real accessibility (double tab stop / lost focus ring).

### 6. Cards show counts as text; the toggle lives on the thread screen
Wireframe B4 could be read as an upbeat control on every feed card. Feed/
community cards render counts as text and the whole card is one button; the
interactive UpbeatButton lives in thread detail (post + every comment). A
nested interactive control inside a pressable card is a keyboard/screen-
reader trap, and B4's own note says "count only."

### 7. Threading render
One flat fetch per thread; pure `buildCommentTree` (orphans degrade to root);
siblings oldest-first; indent 12px × depth CAPPED at 4 — deeper replies stay
at the cap and say "Replying to {name}" in words, so nesting never crushes
the text column under zoom/reflow (approved).

### 8. TDD mechanics this slice (red checkpoint preserved)
Red commit 9db589d: 7 suites / 26 tests authored first against typed stubs
throwing "Phase 1D: not implemented yet" — verbatim red: `Test Suites: 7
failed, 8 passed, 15 total / Tests: 26 failed, 28 passed, 54 total` — with
the new suites temporarily excluded from the pre-commit jest run
(jest.config.js) so the checkpoint could land without --no-verify. The
implementation commit removes the exclusion; the diff between the two commits
proves the tests were untouched except the sanctioned amendment above (its
own commit, 6a8b195).

## Research-spec reconciliation (inferences to revisit when the spec lands)

1. Feed = union of joined communities, `created_at desc`, no ranking (spec §4
   may define richer feed logic).
2. Realtime deferred pending spec §4/§7 (Decision 1).
3. Member counts absent (Decision 3).
4. B5 sort options (Most upbeats / Active) deferred with ranking; Newest only.
5. Comment siblings oldest-first.
6. Search (🔍 in wireframe headers) out of scope this slice.
7. Community Guidelines/Moderators rows (B5) are Phase 2 moderation surface.
8. Posting is not membership-gated at the DB level (RLS checks authorship
   only); the UI paths compose into joined/open communities. If the spec
   gates posting on membership, that's an RLS change with its own review.

## Reviewer gates

- privacy-reviewer: PASS 8/8 (no upload surface anywhere — pinned by test;
  no diagnostic language; no health self-ID queried/joined/displayed —
  author embeds are display_name+role only; session/anon client only — the
  exported web bundle contains zero privileged keys; grants/RLS layering
  respected; no analytics/third-party calls; data minimization intact; the
  sanctioned amendment is exactly 3 lines).
- a11y-reviewer: initial audit PASSED 8 files, 2 BLOCKING findings fixed and
  re-verified 5/5 (compose radiogroup now labelled via aria-labelledby;
  landing-page headings marked; plus advisories applied: PostCard accessible-
  name information parity, quiet-button 44px width). Remaining advisories
  recorded for follow-up: alert announcements on native
  (AccessibilityInfo.announceForAccessibility), heading levels, roving-
  tabindex radios, loading-state announcements.

## Verification

pgTAP 4 suites / 34 assertions green (untouched); jest 54/54 (26 new + 28
prior; rn 43, db 11); lint (1 pre-existing warning) + typecheck clean;
`expo export --platform web` builds; served bundle boots with the local
Supabase URL + publishable key only and carries the composer reminder copy
verbatim. The full member click-path (signed-out browse → sign-in → join →
post → reply → reply-to-reply → upbeat post + comment → remove upbeat) is
proven end-to-end against the live stack by the db suites; a human visual +
keyboard/screen-reader pass on web remains worthwhile before Phase 2.
