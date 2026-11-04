# Phase 1D plan — the social core: communities · threads · comments · composer · upbeats

Status: APPROVED 2026-07-08 (with notes) — EXECUTED; see ADR 0006
Date: 2026-07-08
Basis: PRD §7.2/§7.3/§9; Wireframes B4–B6, C4–C7; Brand v2 §8/§9; ADR 0003/0004/0005.
Out of scope: journey pages (1E), moderation/⚑ (Phase 2 — see Decision b),
governance, payments, analytics, realtime (see Decision a), search,
notifications, profile editing, data-rights screens. NO new tables, NO schema,
policy, or grant changes, NO test/guard weakening.

## 1. Route map (Expo Router) + components

```
app/
  index.tsx            (exists) + redirect to /feed when a session exists
  feed.tsx             NEW  Home feed — posts from joined communities, newest first
  compose.tsx          NEW  Post composer (community picker, title, body, reminder)
  communities/
    index.tsx          NEW  Browse: "Your communities" + "Discover" (anon-friendly)
    [slug].tsx         NEW  Community detail: description, join/leave, thread list
  posts/
    [id].tsx           NEW  Thread detail: post + threaded comments + reply composer
```

All screens render inside the existing `AppShell` (🆘 crisis affordance in the
header on every screen — untouched). Signed-out access: `/communities` and
`/communities/[slug]` work with names/descriptions only (the approved anon
surface); `feed`, `compose`, `posts/[id]` redirect to `/sign-in`.

New components (`src/components/`), matching the existing StyleSheet +
`PressState` focus-ring idiom and Brand v2 §8 treatments (Paper/Mist cards, 1px
Line border, 12px radius, no shadows; primary = Heart Deep solid 44px):

- `UpbeatButton.tsx` — the ♥ Upbeat control. Icon + TEXT ("Upbeat") + count,
  never icon-only. `accessibilityRole="button"` +
  `accessibilityState={{ pressed }}`; filled heart when upbeated, outline when
  not; ≥44px target; visible focus ring. Structurally no negative control.
- `PostCard.tsx` — feed/community-list card: community · author · relative
  time, title, body preview, upbeat count, reply count. When the author's
  profile role = `professional`: "✔ Verified" label + `DisclaimerBand`
  (reusing the 1A component unchanged) — render path built and tested even
  though no account can attain the role yet (ADR 0004).
- `CommentNode.tsx` — one comment + its children (recursive), each with its
  own UpbeatButton and Reply affordance; professional comments wear the band.
- `CommunityRow.tsx` — community name/description + Join/Leave button
  (secondary button treatment; explicit label, confirmation not needed — leave
  is reversible and non-destructive).

Copy in Brand §9 voice throughout (e.g. empty feed: "Nothing here yet. Join a
community to see posts from people who get it." — plain, warm, no hype).

## 2. Data-access layer (`src/lib/social/`)

Same pattern as `consent.ts`: pure async functions taking the typed
`SupabaseClient<Database>` (session client in app code; node clients in db
tests). No service_role anywhere in client paths — anon/session keys only, the
grants+RLS layering does the enforcement (ADR 0005).

- `communities.ts` — `listCommunities(client)` (all, anon-safe),
  `listMyMembershipIds(client)`, `joinCommunity`, `leaveCommunity`
  (duplicate-join 23505 handled as already-joined, not a crash).
- `posts.ts` — `getFeed(client)`: memberships → `posts.in(community_id, …)`
  ordered `created_at desc`, embedding `author:profiles(display_name, role)`,
  `community:communities(name, slug)`, `upbeats(count)`, `comments(count)`;
  `listCommunityPosts(client, communityId)`; `getPost(client, id)`;
  `createPost(client, { communityId, title, body })` with
  `author_id = auth user` (RLS WITH CHECK is the enforcement; the function just
  passes the session uid).
- `comments.ts` — `listComments(client, postId)` (flat, `created_at asc`),
  `buildCommentTree(rows)` (pure, by `parent_comment_id`),
  `createComment(client, { postId, parentCommentId?, body })`.
- `upbeats.ts` — `listMyUpbeats(client, { postIds?, commentIds? })` and the
  toggle primitives below.

Counts are aggregates per fetch (`upbeats(count)`, `comments(count)`); the
denormalized `posts.upbeat_count` stays deferred (ADR 0003 #9 — score remains
exactly `count(upbeats)`).

## 3. Upbeat toggle design

State per subject: `{ hasUpbeated, count }`, seeded from the fetch +
`listMyUpbeats`.

- **Add**: optimistic `hasUpbeated=true, count+1` → `insert {post_id|comment_id}`
  (member_id = session uid). On `23505` (double-tap / race / second device):
  the row already exists — keep the optimistic state; the DB unique constraint
  is the arbiter and the duplicate is a handled no-op, never a crash.
- **Remove**: optimistic `hasUpbeated=false, count-1` →
  `delete().match({ member_id, post_id|comment_id })`. Deleting an
  already-gone row affects 0 rows and is success.
- **Any other error**: roll back to the pre-toggle snapshot and show a gentle
  inline message ("We couldn't save that. Want to try again?" — §9 voice).
- In-flight guard: the button ignores presses while a toggle is pending
  (prevents self-race; the constraint still backstops cross-device races).
- No pathway renders or stores any negative state; "remove upbeat" is row
  deletion, not a down-anything.

## 4. Comment threading on a narrow canvas

Single flat fetch per thread (RLS-filtered), pure `buildCommentTree`
(orphans → root, defensive), depth-first render, siblings oldest-first.
Indentation = 12px × depth, **capped at depth 4**; deeper replies render at
the cap's indent with a plain "Replying to {name}" line so nesting never
crushes the text column on mobile (a11y: reflow/zoom safety, PRD §9). Depth is
data-unbounded (self-referential FK), only the visual indent is capped.

## 5. THE TWO DECISIONS (recommendations for approval)

### a) Realtime (Supabase Broadcast) — RECOMMEND: DEFER to a polish slice
Ship fetch-on-focus + pull-to-refresh (the PRD's own graceful fallback) now.
- For: the authoritative realtime design lives in research spec §4/§7, which
  is NOT in-repo — building Broadcast now means inventing channel/topic design
  the spec defines (standing rule: don't invent). Live-updating counts add
  websocket lifecycle, reconnection, and battery cost on the older devices our
  baseline user owns, for little peer-support value in an MVP with near-zero
  concurrent traffic. Smaller slice, cleaner review.
- Against: feed/counts are stale until refocus; the wireframe's "⟳ live"
  affordance ships later. Accepted: staleness of an upbeat count harms no one.

### b) Report flag (⚑) — RECOMMEND: OMIT ENTIRELY this slice
- For: the queue, human review, and safety-floor escalation behind ⚑ are
  Phase 2. In a health community a flag that silently goes nowhere is a FALSE
  safety affordance — a member who reports dangerous misinformation and walks
  away believing a human will look is worse off than one who sees no flag at
  all. A disabled/stub control also fails the honesty bar (§9) and adds
  keyboard-focusable noise for screen-reader users.
- Against: wireframes show ⚑ on every card; there'll be a gap until Phase 2.
  Accepted: no public launch happens before legal review anyway (CLAUDE.md
  non-negotiable 7), so the gap has no real audience.

## 6. TDD plan (Step 3 targets)

**Red-commit constraint (flagging up front):** pre-commit runs the full jest
suite and `--no-verify` is forbidden, so failing jest tests cannot land as a
separate red commit (1C precedent). As in 1C: tests are authored FIRST, run,
and their failing output captured verbatim; implementation then ships with
them green in one commit. pgTAP is unaffected (no new tables → no new pgTAP).

DB tests (`tests/db/`, node against the live stack, anon/session keys only):
- `upbeat-toggle.test.ts` — upbeat a post then remove it (count 1 → 0); count
  = presence rows only; double-insert surfaces 23505 and the toggle helper
  resolves it as "already upbeated" (no throw); same for a comment upbeat.
- `feed-membership.test.ts` — anon client: communities visible, posts/feed
  empty; member sees posts only from joined communities (join → post appears,
  leave → gone); duplicate join handled; membership row count stays exactly 1
  after join-join; 0 after leave.
- `composer-thread.test.ts` — createPost lands in the chosen community with
  author = session user; a reply nests under its parent; a reply-to-reply
  carries the grandparent lineage (tree builder proves depth 2).

RN tests (`tests/components/`, `tests/screens/`, RNTL):
- `UpbeatButton.test.tsx` — accessible name; `accessibilityState.pressed`
  true/false with state; count rendered; optimistic flip on press; rollback
  restores prior count/state when the lib call rejects; no downvote affordance.
- `compose-screen.test.tsx` — community picker/title/body render; the
  medical-records reminder copy renders verbatim; NO upload control exists
  (no element matching /upload|attach|photo|image|file|camera/i); submit calls
  createPost with the chosen community.
- `thread-screen.test.tsx` — reply renders nested under parent; reply-to-reply
  at depth 2; professional-authored comment renders DisclaimerBand.
- `PostCard.test.tsx` — professional post → "Verified" + DisclaimerBand;
  patient post → neither; targets/focus/a11y props asserted.

## 7. A11y plan (WCAG 2.2 AA, per screen)

Every screen: inside AppShell (🆘 reachable — Consistent Help); headers use
`accessibilityRole="header"`; all interactive elements ≥44px with visible
focus ring (`PressState`), icon+text always (♥ + "Upbeat", never bare ♥);
16px+ body text, 1.5 line-height, Brand contrast pairs; labels above inputs
(composer, reply box) — never placeholder-as-label; errors = words + color;
UpbeatButton exposes pressed state; join/leave announce via accessible labels
("Join AFib" / "Leave AFib"); lists keyboard-navigable on web; no motion, no
autoplay, no drag-only interaction anywhere. Gate: jsx-a11y lint +
a11y-reviewer on every new screen/component + manual keyboard pass (Step 6).

## 8. Research-spec reconciliation (inferences, since spec §4/§7 are absent)

1. Feed = union of joined communities, `created_at desc` (recency only). No
   ranking of any kind. (Spec §4 may define richer feed logic — revisit.)
2. Realtime deferred (Decision a) pending spec §4/§7.
3. **Member counts are NOT shown** on communities (wireframe B5 shows
   "4,210 members"): `memberships` RLS is self-only, so a client-side count
   would truthfully render 0/1. Showing a real count needs a deliberate
   aggregate surface (SECURITY DEFINER counter or count-only policy) = a
   grants/policy change this slice must not make (ADR 0005). Deferred, flagged.
4. B5's sort options (Most upbeats / Active) deferred with ranking; "Newest"
   only.
5. Comment ordering: oldest-first within siblings (conversation reads top-down).
6. Search (🔍 in every wireframe header) is out of scope per the slice brief.
7. Community "Guidelines ▸ / Moderators ▸" rows (B5) are Phase 2 (moderation).

## 9. Execution order after approval

1. Author all Step-6 tests → run → capture red output verbatim.
2. Data layer (`src/lib/social/`) → components → routes, until all new tests
   green with prior suites (pgTAP 34, jest 28) untouched and green.
3. Reviewer gates: a11y-reviewer (all new UI), privacy-reviewer (charged: no
   upload surface; no diagnostic language; no health self-ID rendered
   anywhere on posts/profiles; client uses session/anon keys only; nothing
   joins health data to anything).
4. Manual web pass (signed-out browse → sign-in → join → post → reply →
   reply-to-reply → upbeat post + comment → remove upbeat → 🆘 everywhere).
5. SESSION_LOG append + ADR 0006 (decisions incl. a/b + reconciliation) +
   single commit: `feat: Phase 1D — communities, threads, comments, composer,
   upbeat UI`.
