# Community Stories

This document defines the first version of the OneRhythm community story system.

## Purpose

Community stories let people share the emotional truth of living with arrhythmia-related experiences without turning the product into a clinical advice surface.

The system is designed to support:

- explicit public-story consent
- simple, real moderation
- optional pseudonym use
- clear private, review, and published states

## Data model

The story model lives in:

- [apps/api/app/db/models.py](../../apps/api/app/db/models.py)
- [packages/types/src/contracts/mvp-domain.ts](../../packages/types/src/contracts/mvp-domain.ts)

Current fields include:

- title
- summary
- body
- visibility status
- review status
- author display mode
- optional pseudonym
- linked consent record
- moderator note
- submission, review, publish timestamps

## Consent model

Public story sharing requires the dedicated consent type:

- `public_story_sharing`

Rules:

- a story may be drafted privately without that consent
- a story may not move to review without explicit granted consent
- a story may not be published if that consent has been revoked

## Visibility and review states

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

## Author display rules

Allowed public author modes:

- `first_name`
- `pseudonym`

Rules:

- if `first_name` is chosen, the public author label uses the profile display name when available, otherwise `OneRhythm member`
- if `pseudonym` is chosen, the submitted pseudonym is used publicly
- legal names are not required for public display

## Moderation workflow

Maintainers with `support` or `admin` role review stories through the moderation API.

Current route surface:

- `GET /v1/profiles/{profile_id}/stories`
- `POST /v1/profiles/{profile_id}/stories`
- `PUT /v1/profiles/{profile_id}/stories/{story_id}`
- `POST /v1/profiles/{profile_id}/stories/{story_id}/submit`
- `GET /v1/stories/public`
- `GET /v1/stories/public/{slug}`
- `GET /v1/moderation/stories`
- `POST /v1/moderation/stories/{story_id}/publish`
- `POST /v1/moderation/stories/{story_id}/request-changes`

Simple workflow:

1. author drafts privately
2. author explicitly consents to public story sharing
3. author submits story for review
4. maintainer reviews for privacy, safety, and boundary compliance
5. maintainer either:
   - publishes
   - requests changes

Moderation checks should block:

- direct medical advice
- diagnostic claims
- treatment instructions
- identifiable personal information the author did not mean to publish
- unsafe crisis content without appropriate handling

## Public positioning

Published stories are:

- personal narratives
- moderated for safety and boundary compliance
- non-diagnostic
- separate from educational guidance output

## Data rights

Stories are user-owned off-chain records.

Current behavior:

- export includes owned story records
- delete removes owned story records
- stories are never published automatically

## Maintainer notes

- moderation is intentionally simple for launch
- there is no complex editorial CMS or queue UI yet
- audit events are recorded for create, update, submit, publish, and changes-requested actions
