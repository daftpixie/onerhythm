# Content Architecture

This document defines the file-based content architecture used to support OneRhythm's educational, advocacy, and campaign strategy at launch.

## Why this exists

The product now needs two distinct content systems:

- personalized educational guidance from the API, based on self-reported profile data plus approved curated sources
- public editorial content in the web app for essays, research translation, support resources, condition modules, and campaign pages

Those systems should share language rules and provenance expectations, but they should not be collapsed into one runtime path.

## Current implementation

### Shared contracts

Shared content metadata lives in [packages/types/src/contracts/content.ts](../../packages/types/src/contracts/content.ts).

It covers:

- content kind
- author metadata
- structured source provenance
- publish and update dates
- review state
- locale and translation key
- disclaimer requirements for educational surfaces
- structured research-translation highlights for launch study pages

### Web content layer

The launch content layer is file-based and lives in [apps/web/content](../../apps/web/content).

It currently uses:

- [authors.ts](../../apps/web/content/authors.ts)
- [sources.ts](../../apps/web/content/sources.ts)
- [entries.ts](../../apps/web/content/entries.ts)

This keeps authoring simple and auditable while preserving SSR and SEO through normal Next.js server routes.

### Public route surfaces

The web app exposes first-pass public routes for:

- `/stories`
- `/research`
- `/conditions`
- `/support`
- `/campaigns`

Each route has a detail surface and route-level metadata for indexing and sharing.

## Content model

Current content types:

- `essay`
- `research_translation`
- `condition_module`
- `support_resource`
- `campaign_page`

Every entry includes:

- `slug`
- `locale`
- `translation_key`
- `author_ids`
- `publish_date`
- `updated_date`
- `review_state`
- `educational_surface`
- `disclaimer_required`
- structured `sections`
- structured `source_links`

Research translation entries may also include:

- `key_finding`
- `plain_language_meaning`
- `questions_for_doctor`
- `stat_highlights`

## Disclaimer enforcement

Educational content must remain clearly outside diagnostic territory.

Rule:

- if `educational_surface=true` and `disclaimer_required=true`, the page must render the persistent disclaimer component from [packages/ui/src/components/medical-disclaimer.tsx](../../packages/ui/src/components/medical-disclaimer.tsx)

This currently applies to:

- research translation articles
- condition education modules
- support resource pages

Research translation pages use a dedicated pattern:

- `What the research shows`
- `What it means in plain language`
- `Questions to bring to your doctor`
- `Source references`
- persistent disclaimer

## Provenance rules

Every content entry must include structured provenance metadata.

Minimum fields:

- source id
- title
- source name
- source URL
- provenance kind
- review metadata when available

This allows the product to show where a page came from without requiring a separate CMS or opaque editorial backend.

## Language readiness

The launch system is English-first but translation-ready.

To support future locales, each content entry includes:

- `locale`
- `translation_key`

Future localized entries should reuse the same `translation_key` with a different locale-specific record.

## Maintainer workflow

1. Add or update author metadata in [apps/web/content/authors.ts](../../apps/web/content/authors.ts).
2. Add or update entries in [apps/web/content/entries.ts](../../apps/web/content/entries.ts).
3. Keep `review_state`, `publish_date`, and `updated_date` accurate.
4. Ensure educational entries require the disclaimer.
5. Ensure every entry has structured source provenance.
6. Run typecheck in `packages/types` and `apps/web`.

## What stays out of scope for launch

- a full CMS
- remote editorial authoring
- rich markdown/MDX compilation pipeline
- public user-generated publishing flows
- mixing static editorial content with personalized educational API responses

Related docs:

- [Campaign and content strategy](../brand/content-strategy/README.md)
- [Educational guidance engine v1](educational-guidance-engine-v1.md)
- [Curated content ingestion](curated-content-ingestion.md)
