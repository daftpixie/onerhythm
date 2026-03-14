# Story Submission Policy

This document defines how OneRhythm reviews community stories for launch.

## Purpose

Community stories exist to hold emotional truth, solidarity, and personal perspective without turning the platform into a medical-advice surface.

## Submission boundary

Stories may include:

- lived experience
- emotional burden
- care-navigation frustration
- resilience, uncertainty, and identity impact
- reflections on feeling less alone

Stories should not be used to publish:

- diagnosis claims about another person
- treatment instructions
- crisis advice
- direct medical recommendations
- identifying information the author did not clearly intend to publish

## Consent and publication rules

Rules already enforced by the product:

- stories may be drafted privately
- public story sharing requires explicit `public_story_sharing` consent
- a story may not move to review without granted consent
- a story may not be published after consent revocation

Architecture reference:

- [Community stories](../architecture/community-stories.md)

## Visibility and review states

Visibility:

- `private`
- `review`
- `published`

Review:

- `draft`
- `pending_review`
- `changes_requested`
- `approved`
- `rejected`

## Moderation workflow

1. Author drafts privately.
2. Author chooses public-story consent explicitly.
3. Author submits for review.
4. Maintainer with `support` or `admin` role reviews the story.
5. Maintainer either:
   - publishes
   - requests changes

## Review checks

Maintainers should review for:

- privacy leaks
- boundary violations
- unsafe or crisis-heavy content needing a more careful response
- marketing-style embellishment that distorts the story
- respectful tone

Block or request changes when a story includes:

- legal name or third-party identifying details not meant for publication
- “this platform diagnosed me”
- “you should take this treatment”
- claims that a mosaic tile proves a medical fact
- content likely to harm or mislead readers

## Author display rules

Allowed public display modes:

- first name
- pseudonym

Rules:

- use only the selected public display mode
- do not publish extra personal details
- if a pseudonym is chosen, respect it consistently

## Reviewer notes

When requesting changes:

- be specific
- focus on privacy, safety, or boundary issues
- do not rewrite the emotional truth out of the story
- keep feedback humane and brief

## Escalation

If a story contains acute crisis language, self-harm references, or clear safety concerns:

- do not publish
- request changes or hold the story
- flag for maintainer follow-up

Future crisis-handling workflows may need a more formal policy. For launch, err on the side of caution.

## Data rights

Stories remain user-owned records.

Current behavior:

- export includes owned stories
- delete removes owned stories
- publication is never automatic

Related docs:

- [Community stories](../architecture/community-stories.md)
- [Tone and style guide](tone-and-style-guide.md)
