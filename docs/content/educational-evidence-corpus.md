# Educational Evidence Corpus

This document defines the launch evidence expectations for the API-backed educational corpus in [approved_sources.json](../../apps/api/app/content/approved_sources.json).

The launch corpus is intentionally strict:

- educational retrieval must be grounded in approved external evidence first
- OneRhythm docs, founder narrative, and campaign materials are not the launch evidence base
- every launch diagnosis must have complete section coverage
- ingestion fails closed if the corpus regresses

## Launch section coverage

Each launch diagnosis must include all four educational sections:

- `condition_education`
- `doctor_questions`
- `recent_advancements`
- `mental_health_resources`

At launch, each diagnosis is expected to be diagnosis-specific rather than satisfied by generic fallback entries.

## Minimum topic coverage by diagnosis

The current launch matrix is:

- `arvc`: `genetics`, `family_screening`, `icd`, `mental_health_support`
- `afib`: `ablation`, `medication`, `mental_health_support`
- `vt`: `ablation`, `icd`, `mental_health_support`
- `svt`: `ablation`, `medication`, `mental_health_support`
- `long_qt`: `genetics`, `medication`, `mental_health_support`
- `brugada`: `genetics`, `icd`, `mental_health_support`
- `wpw`: `ablation`, `mental_health_support`

These topic tags are not diagnostic outputs. They are source-governance tags that describe what the reviewed source is allowed to support inside OneRhythm's educational boundary.

## Required source posture

Launch educational entries must use one of these source classes:

- `clinical_guideline`
- `peer_reviewed_study`
- `institutional_reference`

Launch educational entries must use an external publisher kind:

- `professional_society`
- `journal`
- `health_system`
- `institution`

The launch corpus must not use:

- `onerhythm_editorial`
- `founder`

Those source kinds may still exist elsewhere in the repository for campaign, origin, or product narrative, but they are not accepted as the main evidence base for educational retrieval.

## Required metadata per entry

Every launch corpus entry must include:

- reviewed source metadata:
  - `source_name`
  - `source_url`
  - `reviewed_at`
  - `reviewer_ref`
- provenance metadata:
  - `registry_source_id`
  - `source_document_id`
  - `source_classification`
  - `publisher_kind`
  - `citation.citation_label`
  - `monthly_update_cycle`
  - `approval_status`
  - `topic_tags`
  - `usage_scope`
- section-specific payload:
  - `everyday_language_notes` for `condition_education`
  - `questions` for `doctor_questions`
  - `resource_kind` for `mental_health_resources`

If a DOI, PMID, or source publication date cannot be verified, leave that field blank instead of guessing.

## Update workflow

1. Verify source metadata directly from PubMed, the guideline body, or the journal landing page.
2. Update [approved_sources.json](../../apps/api/app/content/approved_sources.json).
3. Keep `topic_tags`, `usage_scope`, `reviewed_at`, and `monthly_update_cycle` current.
4. Run `pnpm --filter @onerhythm/api test`.
5. Run `pnpm --filter @onerhythm/api run ingest:curated`.
6. Confirm the educational API still fails closed if a diagnosis loses section coverage or review freshness.

## Current implementation boundary

The educational corpus is profile-derived and retrieval-backed.

It must never:

- use ECG-derived interpretation
- recommend treatment plans
- infer a diagnosis from uploaded artifacts
- hide or omit provenance from the API response
