# Research Pulse

Research Pulse is OneRhythm's reviewed medical-advancement feed.

## Purpose

- surface newly published peer-reviewed arrhythmia and electrophysiology research
- translate it into calm, human language
- preserve provenance for every claim
- remain educational only

## Boundaries

- never use ECG-derived inputs
- never publish preprints
- never mirror copyrighted full text unless reuse rights allow it
- always include the persistent disclaimer on educational surfaces
- require review before publication at launch
- never publish founder or internal narrative as Research Pulse evidence
- fail closed when a publication is under-sourced or weakly reviewed

## Data model

The normalized launch model is:

- `source_feed`
  Holds a source family such as PubMed E-utilities, Europe PMC, Crossref, or a justified journal RSS feed.
- `source_query`
  Holds a reviewable saved query under a feed, including diagnosis/topic scope and `exclude_preprints`.
- `publication`
  Holds the canonical paper record and launch feed ranking fields.
- `publication_identifier`
  Holds DOI, PMID, and PMCID as separate rows so identifiers remain auditable and extensible.
- `publication_license`
  Holds reuse and access details for abstract-only vs OA full-text workflows.
- `publication_topic`
  Holds diagnosis/theme mappings used by feed filters and profile-driven relevance.
- `publication_author`
  Holds ordered author metadata.
- `publication_journal`
  Holds normalized journal metadata.
- `publication_ingest_run`
  Holds each ingest pass against a source feed/query.
- `publication_summary`
  Holds the plain-language AI summary output.
- `publication_provenance`
  Holds source payload and citation provenance for both ingest and summary claims.
- `publication_user_relevance`
  Holds profile-driven relevance scoring when that is computed later.
- `publication_review_state`
  Holds moderation, guardrail, and publication-state decisions.

## Relationships

- `source_feed 1 -> many source_query`
- `source_feed 1 -> many publication_ingest_run`
- `source_query 1 -> many publication_ingest_run`
- `publication_journal 1 -> many publication`
- `publication 1 -> many publication_identifier`
- `publication 1 -> many publication_license`
- `publication 1 -> many publication_topic`
- `publication 1 -> many publication_author`
- `publication 1 -> many publication_summary`
- `publication 1 -> many publication_provenance`
- `publication 1 -> many publication_review_state`
- `publication 1 -> many publication_user_relevance`
- `publication_summary 1 -> many publication_provenance`
- `publication_summary 1 -> many publication_review_state`
- `publication_ingest_run 1 -> many publication_provenance`
- `profiles 1 -> many publication_user_relevance`

This keeps the model easy to audit:

- canonical paper metadata lives on `publication`
- identifiers, licenses, authors, and topics are explicit child records
- provenance is appendable and inspectable
- review/publish decisions are separate from the raw paper record

## Initial implementation

The current code adds:

- the normalized schema above
- a local reviewed-seed ingestion path
- first source connectors for PubMed, Europe PMC, and Crossref, plus scaffolded PMC OA XML fetch support
- a structured summarization pipeline that writes safe, review-ready publication summaries
- public API routes for feed and detail retrieval
- latest, topic-filtered, and signed-in personalized feed endpoints
- shared TypeScript contracts for both the normalized model and feed/detail responses

The current code intentionally does not yet include:

- an editorial review UI
- scheduled workers

## Connector posture

The first connector layer is modular and testable:

- `PubMedConnector`
  Discovers candidate papers from saved PubMed queries and normalizes PMID / DOI / PMCID when available.
- `EuropePMCConnector`
  Enriches a candidate with article lookup metadata and OA signals.
- `CrossrefConnector`
  Enriches publisher and license metadata through DOI lookup.
- `PMCOAConnector`
  Fetches reusable OA XML only when the candidate already has a reusable OA signal.

Each connector contributes raw source payloads that are stored through `publication_provenance`.

## Topic taxonomy

Research Pulse uses a patient-relevance taxonomy, not a generic cardiology taxonomy.

Topic groups:

- electrophysiology
- arrhythmia subtypes
- treatment and device therapy
- innovation, mapping, and genetics
- mental health and quality of life in arrhythmia care

The first rule-based classifier maps publications into these groups with:

- `diagnosis_code`
- `theme_key`
- `label`
- `confidence`
- `assignment_source`

Topic records are stored in `publication_topic`.

## Profile-aware relevance

Personalization uses only self-reported profile data:

- diagnosis selection
- physical symptoms
- emotional context
- ablation count
- implantable-device flag
- current medications
- prior procedures
- personal narrative

No ECG-derived input is used.

The first scoring layer writes explainable results into `publication_user_relevance`.

Each score includes:

- overall `relevance_score`
- matched keywords
- diagnosis match flag
- topic matches
- mental-health match flag
- treatment-context matches

This keeps personalized ranking reviewable and contributor-friendly rather than opaque.

## Summarization pipeline

Research Pulse summarization is currently deterministic and review-first.

Inputs:

- publication title
- abstract text when available
- article type and study design metadata
- provenance-backed source URLs
- OA full text only when separately permitted and stored

Structured outputs:

- short summary
- plain-language explanation
- why it matters
- what this does not prove
- study type
- population or sample size when available in the abstract
- questions to ask your doctor
- caution and uncertainty notes

Safety posture:

- no diagnostic framing
- no treatment recommendations
- no ECG-derived inputs
- plain explanation of observational, preclinical, and small-study limits
- source claims persisted in `publication_summary.source_claims_json`
- summary-linked provenance records persisted in `publication_provenance`
- generated summaries move to `review_ready` and still require human publication review
- generated summaries are explicitly treated as `automated_summary` material
- public feed/detail routes only surface items that also pass source-integrity checks

## Source integrity gate

Research Pulse public routes now apply a runtime integrity gate in addition to `state=published`.

For a publication to surface publicly, it must have:

- external source typing that is not `founder_narrative` or `internal`
- primary provenance records with visible source URLs and stored raw payload metadata
- adequate source grounding through DOI, PMID, PMCID, or another verified external identifier
- a reviewed `published` state with `guardrail_status=passed`
- reviewer attribution and review timestamp
- summary-linked claim citations

If those conditions are not met, the item is treated as `limited` or `excluded` and does not appear in public feed or detail routes.

This means weak coverage now degrades to:

- empty public results
- `coverage_state=limited`
- no fallback to thin, internal, or weakly reviewed items

Operational entrypoint:

- `pnpm --filter @onerhythm/api run summarize:research-pulse`

This allows newly ingested connector-backed publications to move from raw ingest into a safe, reviewable educational summary without making them publicly visible until the review state is explicitly promoted to `published`.

## Maintainer workflow

Research Pulse publication is intentionally review-first.

Operational policy lives in:

- [Research Pulse editorial workflow](../content/research-pulse-editorial-workflow.md)

That document defines:

- source policy
- inclusion criteria
- preprint and peer-review handling
- summary QA expectations
- promoted and deep-dive review
- stale and update handling
- launch blockers versus future enhancements
