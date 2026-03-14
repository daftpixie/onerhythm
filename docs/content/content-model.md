# Content Model

This document explains the launch content model for OneRhythm and where each content type lives.

## Purpose

OneRhythm uses a lightweight file-based content layer so maintainers can add or update content without a separate CMS.

Current implementation:

- static public content in [apps/web/content/entries.ts](../../apps/web/content/entries.ts)
- source registry in [apps/web/content/sources.ts](../../apps/web/content/sources.ts)
- author metadata in [apps/web/content/authors.ts](../../apps/web/content/authors.ts)
- shared contracts in [packages/types/src/contracts/content.ts](../../packages/types/src/contracts/content.ts)

## Content types

Current launch types:

- `essay`
- `research_translation`
- `condition_module`
- `support_resource`
- `campaign_page`

## Required entry fields

Every entry should include:

- `content_id`
- `slug`
- `kind`
- `locale`
- `translation_key`
- `title`
- `kicker`
- `summary`
- `seo.title`
- `seo.description`
- `author_ids`
- `publish_date`
- `review_state`
- `educational_surface`
- `disclaimer_required`
- `sections`
- `source_links`

## Research translation fields

`research_translation` entries should also include:

- `key_finding`
- `plain_language_meaning`
- `questions_for_doctor`
- `stat_highlights`

These fields power the reusable “What the research shows” pattern on public research pages.

## Educational content rules

Educational surfaces include:

- research translations
- condition modules
- support resources

Rules:

- `disclaimer_required` must be `true`
- copy must remain educational and non-diagnostic
- do not add treatment recommendations
- do not imply certainty for any one person
- keep sources attached through `source_links`

## Provenance model

Every claim-bearing page should link to structured sources.

The source registry supports:

- source classification
- publisher kind
- citation metadata
- publish date
- updated date
- reviewed date
- reviewer reference
- review state

Use [docs/content/source-review-policy.md](source-review-policy.md) when adding or updating sources.

## Language readiness

The launch workflow is English-first but locale-ready.

Rules:

- keep `locale` explicit
- keep `translation_key` stable
- if a translated version is added later, use the same `translation_key` with a locale-specific entry

## Community stories

Community stories are not part of the static editorial registry.

They use a separate moderated user-submission path:

- data model and routes: [docs/architecture/community-stories.md](../architecture/community-stories.md)
- review rules: [docs/content/story-submission-policy.md](story-submission-policy.md)

## Add a new article or module

1. Add or reuse an author in [apps/web/content/authors.ts](../../apps/web/content/authors.ts).
2. Add or reuse structured sources in [apps/web/content/sources.ts](../../apps/web/content/sources.ts).
3. Add the entry in [apps/web/content/entries.ts](../../apps/web/content/entries.ts).
4. If it is educational, require the disclaimer and follow the tone guide.
5. Run `pnpm --filter @onerhythm/types run typecheck` and `pnpm --filter @onerhythm/web run typecheck`.

Related docs:

- [Editorial workflow](editorial-workflow.md)
- [Tone and style guide](tone-and-style-guide.md)
