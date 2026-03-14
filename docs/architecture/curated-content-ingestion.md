# Curated Content Ingestion

This is the first approved-source ingestion path for educational retrieval.

## Current shape

- source file: [approved_sources.json](../../apps/api/app/content/approved_sources.json)
- storage table: `curated_content_entries`
- ingestion command: `pnpm --filter @onerhythm/api run ingest:curated`
- retrieval path: `DatabaseEducationalRetrievalProvider`

## What is stored

Each curated entry keeps:

- section and diagnosis scope
- title and summary
- source name and source URL
- source publication date
- reviewer reference
- ingestion run id
- checksum of the ingested record
- structured content payload
- provenance metadata

This is enough for auditable retrieval without introducing a generic crawler or scheduler.

## Launch validation gates

`ingest_curated_content` now validates the source file before writing anything to the database.

The launch gate rejects the corpus if:

- any launch diagnosis is missing one of the four required educational sections
- topic coverage regresses below the launch diagnosis matrix
- a launch entry uses `onerhythm_editorial` or `founder` as the evidence source
- required provenance metadata is missing
- a condition or question entry is not backed by a clinical guideline
- a research or mental-health entry is not backed by peer-reviewed literature

The current launch diagnosis matrix lives in:

- [Educational evidence corpus](../content/educational-evidence-corpus.md)

## Monthly update workflow

1. Review and edit [approved_sources.json](../../apps/api/app/content/approved_sources.json).
2. Update `reviewed_at`, `monthly_update_cycle`, and any changed summaries or payloads.
3. Run `pnpm --filter @onerhythm/api run migrate` if schema changes were added.
4. Run `pnpm --filter @onerhythm/api run ingest:curated`.
5. Run `pnpm --filter @onerhythm/api test` so coverage and provenance regressions fail before ingest is merged.
6. Verify the educational API still returns the expected source references, section content, and review metadata.
7. If content is older than the configured review window, the educational API should fail closed until the review cycle is refreshed.

## Provenance rules

- every entry must include `provenance`
- `source_document_id` identifies the reviewed source bundle
- `ingested_from` identifies the local source file
- `monthly_update_cycle` records the review window
- `approval_status` must be `approved` before ingestion
- `topic_tags` define diagnosis and topic coverage
- `usage_scope` defines where the source may be used in the educational API

## Retrieval behavior

The retrieval layer filters approved entries by:

- locale
- requested content section
- matching diagnosis code

Production-safe educational routes do not fall back to stub content. If no approved entries match, if the content is stale, or if an internal-only source slips into the curated result, the API returns an explicit failure state instead of inventing educational output.
