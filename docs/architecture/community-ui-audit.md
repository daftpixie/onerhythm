# Community UI Audit

This document is a frontend redesign handoff for Claude.

It describes how the current community lane is actually plumbed in the
repository today, what is safe to redesign in the UI, and which behaviors still
need backend coordination before the frontend can promise them honestly.

## Why this exists

The community lane is currently spread across several related but distinct
surfaces:

- the public community hub at `/community`
- the more detailed public Heart Mosaic route at `/mosaic`
- public community stories at `/community/stories`
- authenticated story submission at `/account/stories`
- static editorial essays at `/stories`

Those surfaces are adjacent in the product narrative, but they do not all use
the same plumbing or the same trust rules.

Claude should treat this document as the implementation truth for redesign work.

## Hard product and trust boundaries

These constraints are already reflected in the repo and must survive any UI
redesign:

- OneRhythm is an educational resource and community platform, not a medical
  device.
- Community stories are personal narratives, not diagnosis, treatment
  guidance, or clinical interpretation.
- Story publication requires explicit `public_story_sharing` consent plus
  maintainer review.
- Community stories are separate from educational guidance output.
- ECG uploads and the Heart Mosaic remain artistic and privacy-preserving, not
  diagnostic.
- Do not merge community narratives into Research Pulse or profile-based
  education in a way that weakens those boundaries.

Related source docs:

- [Community stories](community-stories.md)
- [Story submission policy](../content/story-submission-policy.md)
- [Story consent checklist](../launch/story-consent-checklist.md)
- [Public Heart Mosaic](public-mosaic.md)

## Current surface map

### Public routes

- `/community`
  - public landing page for community principles and Heart Mosaic framing
  - pulls public mosaic data
  - links to sign-up, onboarding, public stories, and authenticated story
    submission
- `/mosaic`
  - fuller public Heart Mosaic route with stats, milestones, trust section, and
    explanatory framing
- `/community/stories`
  - public list of published community stories
- `/community/stories/[slug]`
  - public story detail page
- `/stories`
  - static editorial essays, not user-submitted community stories

### Authenticated route

- `/account/stories`
  - authenticated story submission shell
  - requires an authenticated session
  - still requires an owned profile before story creation works

### No current web route

- there is no maintainer moderation UI in the web app today
- moderation exists only as backend API endpoints

## Current backend plumbing

Primary implementation files:

- [apps/api/app/api/routes/community_stories.py](../../apps/api/app/api/routes/community_stories.py)
- [apps/api/app/db/models.py](../../apps/api/app/db/models.py)
- [apps/api/app/api/contracts.py](../../apps/api/app/api/contracts.py)
- [packages/types/src/contracts/mvp-domain.ts](../../packages/types/src/contracts/mvp-domain.ts)

### Story model

The `community_stories` table stores:

- `title`
- `summary`
- `body`
- `slug`
- `visibility_status`
- `review_status`
- `author_display_mode`
- optional `pseudonym`
- optional `consent_record_id`
- optional `moderator_note`
- `submitted_at`
- `reviewed_at`
- `published_at`
- `created_at`
- `updated_at`

### State model

Visibility states:

- `private`
- `review`
- `published`

Review states:

- `draft`
- `pending_review`
- `changes_requested`
- `approved`
- `rejected`

### Route inventory

Owned/authenticated routes:

- `GET /v1/profiles/{profile_id}/stories`
- `POST /v1/profiles/{profile_id}/stories`
- `PUT /v1/profiles/{profile_id}/stories/{story_id}`
- `POST /v1/profiles/{profile_id}/stories/{story_id}/submit`

Public routes:

- `GET /v1/stories/public`
- `GET /v1/stories/public/{slug}`

Moderation routes:

- `GET /v1/moderation/stories`
- `POST /v1/moderation/stories/{story_id}/publish`
- `POST /v1/moderation/stories/{story_id}/request-changes`

### Consent behavior

Current implementation truth:

- private drafting does not require `public_story_sharing` consent
- submit-for-review requires a granted `public_story_sharing` consent record
- publish checks that the linked consent record is still granted at publish time
- delete revokes consents and removes story rows

### Audit and analytics

Implemented today:

- audit events for create, update, submit, publish, and changes-requested
- analytics event `community_story_submitted`
- analytics does not store free-text story content

Related docs:

- [Analytics](analytics.md)
- [Data rights fulfillment](data-rights-fulfillment.md)

## Current frontend plumbing

Primary implementation files:

- [apps/web/app/community/page.tsx](../../apps/web/app/community/page.tsx)
- [apps/web/app/mosaic/page.tsx](../../apps/web/app/mosaic/page.tsx)
- [apps/web/app/community/stories/page.tsx](../../apps/web/app/community/stories/page.tsx)
- [apps/web/app/community/stories/[slug]/page.tsx](../../apps/web/app/community/stories/[slug]/page.tsx)
- [apps/web/app/account/stories/story-submission-shell.tsx](../../apps/web/app/account/stories/story-submission-shell.tsx)
- [apps/web/lib/community-stories-api.ts](../../apps/web/lib/community-stories-api.ts)
- [apps/web/lib/auth-api.ts](../../apps/web/lib/auth-api.ts)

### Public story pages

Current behavior:

- both public story pages fetch with `cache: "no-store"`
- the list page is explicitly `force-dynamic`
- the detail page is effectively dynamic because it fetches uncached server data
- the public story detail page renders the shared `MedicalDisclaimer`
- the public story list page relies on narrative copy about "not medical advice"
  instead of rendering the shared disclaimer component
- the public fetch helper swallows fetch failures and returns `[]` or `null`
  instead of exposing a distinct degraded state

Practical result:

- list fetch failure looks the same as "no stories published yet"
- detail fetch failure looks the same as "story not found"

### Account story submission shell

Current behavior:

- requires signed-in session
- then checks whether the signed-in user has a profile
- loads owned stories and consent records
- creates or updates a story draft
- can create `public_story_sharing` consent inline during submission
- can submit a story for review
- shows existing stories and moderator notes
- renders the shared `MedicalDisclaimer`

What it does not currently provide:

- no way to open an existing draft back into the form after reload
- no delete draft action
- no withdraw-from-review action
- no moderation UI
- no explicit version history or autosave

### Navigation and IA overlap

Current nav shape is not fully aligned:

- header exposes `/community`
- header also exposes `/mosaic`
- footer labels `/community` as "Heart Mosaic"
- footer labels `/community/stories` simply as "Stories"
- static editorial essays live separately at `/stories`

This means the current UI already contains two different "stories" concepts and
two overlapping "community vs mosaic" concepts.

## Findings

Ordered by severity.

### 1. Consent revocation does not currently unpublish already-published stories

This is the most important trust gap in the current community plumbing.

What the code does today:

- submit checks for granted consent
- publish checks for granted consent
- public story listing only checks `visibility_status == "published"` and
  `published_at is not null`

What the code does not do:

- there is no path that automatically unpublishes an already-published story
  when `public_story_sharing` is later revoked

Implication for Claude:

- do not design UI copy that promises "revoke consent and your published story
  is immediately removed" unless backend behavior changes
- if the redesign exposes consent management near story publishing, it should
  describe the current semantics carefully or call for backend work

### 2. Pseudonym mode can silently fall back to first-name display

The current submission form says:

- "Optional public pseudonym. Leave blank and the review will block
  publication."

The backend does not actually enforce that.

Current implementation truth:

- if `author_display_mode == "pseudonym"` and a pseudonym exists, public output
  uses the pseudonym
- otherwise public output falls back to the profile display name's first token
  or "OneRhythm member"

Implication for Claude:

- do not assume pseudonym mode is safe by default if the field is blank
- if the redesign keeps a pseudonym path, the UI should require a value or the
  backend must add enforcement

### 3. Public story delivery is overfetching, unpaginated, and unthrottled

Current implementation truth:

- `GET /v1/stories/public` returns the full `body` field for every story, even
  though the list page only renders title, summary, and author name
- the public story list has no pagination, no cursor, no limit, and no search
- unlike mosaic routes, community story public routes are not rate-limited
- public pages are server-rendered dynamically with `no-store`

Implication for Claude:

- the current backend is adequate for launch-scale editorial volume, not for a
  large public archive
- do not design around infinite archive growth without backend coordination
- if the redesign wants richer list browsing, that likely needs a slimmer list
  DTO plus pagination/filtering support

### 4. Public empty states currently hide backend failure states

The public fetch helper in `apps/web/lib/community-stories-api.ts` returns:

- `[]` for any list fetch failure
- `null` for any detail fetch failure

Practical result:

- the list page renders "No reviewed community stories are published yet" for
  both "truly empty" and "API unavailable"
- the detail page renders `notFound()` for both "slug does not exist" and
  "backend error"

Implication for Claude:

- the redesign can improve presentation, but it cannot show an honest degraded
  state without fetch-layer changes
- do not assume the current public story UI can distinguish empty, missing, and
  broken

### 5. The authenticated story editor is only partially wired for real draft management

The backend supports:

- create
- update
- list owned stories

The current UI only partially exposes that:

- after you create or update a story in the current session, the form keeps the
  `activeStoryId`
- after reload, existing stories are shown in a list but cannot be reopened
  into the form
- there is no "edit draft" affordance on an existing story card

Implication for Claude:

- if the redesign wants a true draft workspace, the UI can likely add it
  without changing backend contracts
- but the current product does not yet behave like a multi-draft editor

### 6. Moderation exists only as an API, not as a maintainer workflow surface

Current implementation truth:

- support/admin users can list stories in review
- support/admin users can publish or request changes
- there is no web moderation queue or review console

Implication for Claude:

- a maintainer moderation UI is possible on top of the existing API
- but it would be net-new web functionality, not just a reskin of an existing
  screen

### 7. The route model is semantically crowded

Current overlaps:

- `/community` and `/mosaic` both carry Heart Mosaic meaning
- `/stories` is static editorial narrative
- `/community/stories` is moderated user-submitted narrative
- footer labeling does not make that distinction obvious

Implication for Claude:

- the redesign should treat IA clarity as a first-class goal
- static essays and user-submitted stories should not be visually or verbally
  collapsed into one content system

### 8. Published community story detail pages are not included in the sitemap

Current implementation truth:

- `/community/stories` is in the sitemap
- dynamic community story detail routes are not enumerated there

Implication for Claude:

- if the redesign assumes public story detail pages are part of the discoverable
  long-tail public surface, that is not fully true yet
- story detail indexability and discoverability need backend or sitemap work

### 9. The community story lane currently has no dedicated automated test coverage

Current repo state:

- there are tests for trust-critical education, account data controls, and
  Research Pulse detail
- there are no dedicated API tests for `community_stories.py`
- there are no dedicated web tests for the story submission shell or public
  story routes

Implication for Claude:

- redesign work in this lane is landing on top of effectively untested
  behavior
- if the community UI is reworked materially, tests should be added as part of
  that work

### 10. Minor implementation caveats that affect polish

These are not architecture blockers, but they matter:

- the story submission shell still uses async work inside `useTransition`
- story consent creation hardcodes `policy_version: "launch-v1"` and
  `locale: "en-US"` in the web client
- there is no richer field-level validation in the current story form beyond
  backend request validation and generic request errors

## What Claude can safely redesign without backend changes

Safe UI work on top of current plumbing:

- public community hub layout and hierarchy
- public story list and story detail visual design
- clearer IA between community, mosaic, essays, and stories
- stronger trust messaging around review, consent, and non-advice boundaries
- authenticated story workspace information architecture
- better draft list presentation and story-status explanation
- clearer moderator-note presentation
- clearer distinction between empty, private, review, and published concepts in
  the UI

Likely-safe workflow upgrades using existing endpoints:

- add an "edit draft" affordance that loads an existing story into the form
- add a clearer draft/review/published status rail
- add a dedicated review-status explainer
- add a maintainer moderation UI for list/publish/request-changes if that work
  is intentionally in scope

## What requires backend coordination before the UI should promise it

These should be treated as backend or full-stack tasks, not pure redesign:

- automatic unpublish or public removal after consent revocation
- guaranteed pseudonym-only publication when pseudonym mode is selected
- pagination, filtering, search, or archive-scale public story browsing
- separate list/detail payload shapes for public stories
- degraded-state handling that distinguishes API failure from empty content
- explicit draft deletion or review withdrawal
- formal crisis escalation workflow
- sitemap inclusion for published dynamic story detail pages
- durable automated test coverage for the community story lane

## Recommended framing for Claude

If Claude is redesigning the community lane, the safest framing is:

1. Treat "community" as a lane with at least three sub-surfaces:
   - Heart Mosaic / public collective artwork
   - moderated community stories
   - mission/editorial narrative
2. Keep user-submitted stories visually and semantically distinct from static
   essays.
3. Keep community stories clearly separated from educational guidance and
   Research Pulse.
4. Preserve explicit trust affordances:
   - personal narrative only
   - explicit consent
   - maintainer review
   - not medical advice
5. Avoid any UI implication that:
   - stories publish automatically
   - consent revocation already removes a published story
   - pseudonym mode is airtight without additional validation
   - the public archive is already a large-scale searchable content system

## Source inventory used for this audit

Core backend:

- [apps/api/app/api/routes/community_stories.py](../../apps/api/app/api/routes/community_stories.py)
- [apps/api/app/api/routes/consent.py](../../apps/api/app/api/routes/consent.py)
- [apps/api/app/db/models.py](../../apps/api/app/db/models.py)
- [apps/api/app/services/data_rights.py](../../apps/api/app/services/data_rights.py)
- [apps/api/app/api/contracts.py](../../apps/api/app/api/contracts.py)

Core frontend:

- [apps/web/app/community/page.tsx](../../apps/web/app/community/page.tsx)
- [apps/web/app/mosaic/page.tsx](../../apps/web/app/mosaic/page.tsx)
- [apps/web/app/community/stories/page.tsx](../../apps/web/app/community/stories/page.tsx)
- [apps/web/app/community/stories/[slug]/page.tsx](../../apps/web/app/community/stories/[slug]/page.tsx)
- [apps/web/app/account/stories/story-submission-shell.tsx](../../apps/web/app/account/stories/story-submission-shell.tsx)
- [apps/web/components/public-site-header.tsx](../../apps/web/components/public-site-header.tsx)
- [apps/web/components/public-site-footer.tsx](../../apps/web/components/public-site-footer.tsx)
- [apps/web/lib/community-stories-api.ts](../../apps/web/lib/community-stories-api.ts)
- [apps/web/lib/auth-api.ts](../../apps/web/lib/auth-api.ts)
- [apps/web/app/sitemap.ts](../../apps/web/app/sitemap.ts)

Policy and architecture docs:

- [community-stories.md](community-stories.md)
- [story-submission-policy.md](../content/story-submission-policy.md)
- [story-consent-checklist.md](../launch/story-consent-checklist.md)
- [public-mosaic.md](public-mosaic.md)
- [data-rights-fulfillment.md](data-rights-fulfillment.md)
- [content-model.md](../content/content-model.md)
