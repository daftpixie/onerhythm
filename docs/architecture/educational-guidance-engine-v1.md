# Educational Guidance Engine v1

This document defines the first implementation boundary for educational guidance.

## Positioning

The guidance engine is educational only.

It must not:

- consume ECG-derived inputs
- produce diagnosis language
- produce treatment recommendations
- imply medical triage or clinical certainty

It may:

- explain a self-reported condition in general terms
- suggest neutral questions a person may bring to a clinician
- surface recent public research summaries
- link to mental health and support resources

## Allowed input contract

Use the shared `EducationalGuidanceInput` contract in [packages/types/src/contracts/mvp-domain.ts](../../packages/types/src/contracts/mvp-domain.ts).

Allowed personalization inputs:

- `diagnosis_selection`
- `physical_symptoms`
- `emotional_context`
- `treatment_history`
- `personal_narrative`
- `locale`

Forbidden inputs:

- upload session metadata
- OCR output
- mosaic tile metadata
- ECG-derived features
- processing summaries

## Retrieval / corpus interface

The retrieval boundary is intentionally narrow:

- input: `EducationalCorpusQuery`
- output: `EducationalCorpusResult`

This keeps retrieval auditable and makes source tracing mandatory.

The retrieval layer must return:

- `retrieval_corpus_version`
- structured `source_references`

It must not return:

- opaque prompt-only text with no source trace
- hidden citations
- proprietary internal-only sources unless they are also suitable for public citation

## Response shape

Use the shared `EducationalContentResponse` contract.

The response is split into these user-facing sections:

- `condition_education`
- `suggested_doctor_questions`
- `recent_advancements`
- `mental_health_resources`

Each response must also include:

- `source_references`
- `disclaimer`
- `guardrails_applied`
- `ecg_clinical_inputs_used: false`

## Disclaimer enforcement

Disclaimer requirements are part of the API contract, not just UI styling.

Rules:

- every educational response must include `disclaimer`
- disclaimer placement is always `persistent_banner`
- disclaimer is never dismissible
- web educational surfaces must mount the reusable `MedicalDisclaimer`
- API responses without disclaimer metadata are invalid

## Source traceability

Every research highlight or support resource should map to a `source_reference_id`.

Minimum source trace fields:

- source name
- title
- URL
- publication date when available
- content section
- evidence kind

This lets contributors audit where educational material came from without exposing private user data.

## UI and API guardrails

UI copy should avoid:

- “you have”
- “your ECG shows”
- “you should start/stop”
- “this confirms”

API generation rules should enforce:

- `no_ecg_inputs`
- `no_treatment_recommendations`
- `no_diagnostic_language`
- `disclaimer_required`

## Implementation note

The current route at [apps/api/app/api/routes/educational_content.py](../../apps/api/app/api/routes/educational_content.py) now validates consent for `educational_profile`, builds an `EducationalGuidanceInput`, calls the curated retrieval interface, and returns an `EducationalContentResponse`.

Production-safe behavior:

- only approved curated content is allowed on the live route
- missing curated content returns an explicit failure state
- stale curated content returns an explicit failure state
- response text is scanned for prohibited diagnostic or treatment phrasing before it is returned
