# Evidence And Provenance

This document defines the evidence and provenance layer for OneRhythm's public content and educational surfaces.

## Purpose

OneRhythm needs to show where its claims and framing come from without making pages unreadable for non-technical users.

The launch system therefore uses:

- a lightweight evidence registry in [apps/web/content/sources.ts](../../apps/web/content/sources.ts)
- structured content-to-source links in [apps/web/content/entries.ts](../../apps/web/content/entries.ts)
- structured educational source references from the API retrieval layer

## Source classes

Every source must be classified as one of:

- `peer_reviewed_study`
- `clinical_guideline`
- `institutional_reference`
- `founder_narrative`
- `internal`

These classes are intentionally plain and small so contributors can maintain them without learning a large editorial taxonomy.

## Publisher kinds

Current publisher kinds:

- `journal`
- `professional_society`
- `health_system`
- `institution`
- `onerhythm_editorial`
- `founder`
- `internal`

This keeps public pages clear about whether a source is external research, an institutional document, or OneRhythm's own narrative material.

`internal` should be used for maintainer-only or operational source context.
It is not a public evidence class for launch educational or Research Pulse surfaces.

## Citation metadata

Every structured source can include:

- citation label
- DOI
- PMID
- guideline body

Rule:

- if a citation field is not verified, leave it blank
- never invent citation details

## Reviewed and updated metadata

The source registry and educational API both support:

- publish date
- updated date
- reviewed date
- reviewer reference
- review state

Public pages should show enough of that metadata to communicate freshness and review status without overwhelming the reader.

## Content linking

### Public editorial content

Static public pages link to sources by `source_id`.

Flow:

1. add a source to [apps/web/content/sources.ts](../../apps/web/content/sources.ts)
2. reference that `source_id` from a content entry in [apps/web/content/entries.ts](../../apps/web/content/entries.ts)
3. render it through the shared source card UI

### Educational API content

Educational responses carry structured source references from the retrieval layer.

These include:

- classification
- publisher kind
- citation metadata
- review metadata
- approval metadata

This keeps personalized educational surfaces traceable without mixing them into the static editorial registry.

## Current launch posture

The initial registry is intentionally modest and currently leans on:

- founder narrative
- OneRhythm public source documents
- reviewed institutional/editorial references

The model is ready for verified studies and guidelines, but those should only be added when maintainers have the exact citation details.

## Maintainer workflow

1. Add or update a source in [apps/web/content/sources.ts](../../apps/web/content/sources.ts).
2. Confirm the classification is correct.
3. Add citation metadata only if it is verified.
4. Link the source from the relevant content entry.
5. If the source is also part of API educational retrieval, update [apps/api/app/content/approved_sources.json](../../apps/api/app/content/approved_sources.json) provenance fields as needed.
6. Run typecheck in `packages/types` and `apps/web`.

Related docs:

- [Content architecture](content-architecture.md)
- [Curated content ingestion](curated-content-ingestion.md)
- [Campaign and content strategy](../brand/content-strategy/README.md)
