# Data Backbone Plan

This document defines the first concrete data plan for the OneRhythm MVP. It is a planning artifact only. It does not introduce API routes or persistence code yet.

## Objectives

- Keep self-reported profile data logically separate from anonymized mosaic tile data
- Ensure educational responses are driven only by self-reported profile inputs and curated retrieval sources
- Support explicit, granular, revocable consent
- Preserve GDPR-style export and delete workflows
- Keep blockchain optional behind an adapter

## Canonical bounded contexts

### Profile

Owns self-reported diagnosis, symptom history, treatment history, emotional context, and personal narrative.

### Consent

Owns explicit consent records, revocation state, policy versioning, and export/delete eligibility checks.

### Upload Session

Owns sensitive ECG intake metadata for the processing session only. Raw uploads must never persist beyond the active processing window.

Current implementation note:

- metadata stripping is implemented before downstream redaction or tile handoff
- OCR/redaction now runs through a local provider boundary with structured stage reports
- post-redaction tile derivation now requires a destructive artistic transform artifact rather than the raw upload
- durable upload metadata includes stage reports, cleanup verification, and
  non-retention proof points without storing raw filenames or uploads

### Mosaic

Owns anonymized public-facing tile metadata and artistic display properties only.

### Education

Owns educational response records, retrieval source references, and profile-derived guidance payloads.

### Ledger Adapter

Owns optional blockchain integration behind an internal adapter boundary. It must not be required for MVP runtime success.

## Canonical schemas

The existing shared contracts in [packages/types/src/contracts/mvp-domain.ts](../../packages/types/src/contracts/mvp-domain.ts) and [packages/types/src/schemas](../../packages/types/src/schemas) are the starting point.

### `DiagnosisSelection`

- `diagnosis_code`
- `diagnosis_source`
- `free_text_condition`

### `UserProfile`

- `profile_id`
- `display_name`
- `preferred_language`
- `diagnosis_selection`
- `physical_symptoms`
- `emotional_context`
- `treatment_history`
- `personal_narrative`
- `created_at`
- `updated_at`

### `ConsentRecord`

- `consent_record_id`
- `profile_id`
- `consent_type`
- `status`
- `policy_version`
- `locale`
- `source`
- `granted_at`
- `revoked_at`

### `UploadSession`

- `upload_session_id`
- `profile_id`
- `upload_format`
- `processing_status`
- `consent_record_ids`
- `phi_redaction_applied`
- `raw_upload_retained`
- `started_at`
- `completed_at`
- `resulting_tile_id`
- `failure_reason`

### `MosaicTileMetadata`

- `tile_id`
- `upload_session_id`
- `condition_category`
- `contributed_at`
- `is_public`
- `display_date`
- `tile_version`
- `render_version`
- `visual_style`

### `EducationalContentResponse`

- `response_id`
- `profile_id`
- `locale`
- `generated_at`
- `content_basis`
- `self_reported_profile_snapshot`
- `condition_overview`
- `suggested_clinician_questions`
- `recent_research_highlights`
- `support_resources`
- `disclaimer`
- `ecg_clinical_inputs_used`

## Required schema adjustments before route work

These should be added to `packages/types` before the first real API implementation pass:

### Profile additions

- `profile_version`
- `deleted_at`
- `export_requested_at`
- `last_educational_response_at`

### Consent additions

- `consent_scope_id`
- `revocation_reason`
- `effective_at`
- `recorded_by`

### Upload session additions

- `processing_pipeline_version`
- `raw_upload_destroyed_at`
- `redaction_summary`
- `anonymization_summary`

### Mosaic tile additions

- `tile_version`
- `source_upload_session_id`
- `render_version`
- `visibility_status`

### Educational response additions

- `response_version`
- `retrieval_corpus_version`
- `source_reference_ids`
- `medical_review_status`

## Data separation rules

### Allowed link direction

- `ConsentRecord` may reference `profile_id`
- `UploadSession` may reference `profile_id` during active processing only
- `UploadSession` may reference `resulting_tile_id`
- `EducationalContentResponse` may reference `profile_id`

### Forbidden logical coupling

- `MosaicTileMetadata` must not contain `profile_id`
- `EducationalContentResponse` must not contain upload-derived waveform features
- public mosaic views must not expose direct join paths back to a profile record
- export/delete operations must not depend on blockchain availability

## Proposed API surface

These are route groups only. No implementation is proposed yet.

### Profile

- `POST /v1/profiles`
- `GET /v1/profiles/{profile_id}`
- `PATCH /v1/profiles/{profile_id}`
- `DELETE /v1/profiles/{profile_id}`

### Consent

- `POST /v1/consents`
- `GET /v1/profiles/{profile_id}/consents`
- `POST /v1/consents/{consent_record_id}/revoke`

### Export / delete

- `POST /v1/profiles/{profile_id}/export-requests`
- `GET /v1/profiles/{profile_id}/export-requests/{request_id}`
- `POST /v1/profiles/{profile_id}/delete-requests`
- `GET /v1/profiles/{profile_id}/delete-requests/{request_id}`

### Upload sessions

- `POST /v1/upload-sessions`
- `GET /v1/upload-sessions/{upload_session_id}`
- `POST /v1/upload-sessions/{upload_session_id}/complete`
- `POST /v1/upload-sessions/{upload_session_id}/fail`

### Mosaic

- `GET /v1/mosaic/summary`
- `GET /v1/mosaic/tiles`
- `GET /v1/mosaic/tiles/{tile_id}`

### Educational responses

- `POST /v1/educational-responses`
- `GET /v1/profiles/{profile_id}/educational-responses`
- `GET /v1/educational-responses/{response_id}`

### Ledger adapter

- Internal only, no public route commitment yet
- Candidate internal operations:
  - `record_contribution`
  - `record_consent`
  - `record_revocation`
  - `record_donation`

## Migration entities

These are the first-pass persistence entities to plan for.

### `profiles`

- stores self-reported profile data only

### `profile_events`

- stores profile creation/update/delete audit events

### `consent_records`

- stores granular consent lifecycle rows

### `export_requests`

- stores export request status, timestamps, and completion metadata

### `delete_requests`

- stores delete request status, processing checkpoints, and completion metadata

### `upload_sessions`

- stores session-scoped intake metadata only

### `upload_processing_events`

- stores PHI stripping, anonymization, destruction, and failure checkpoints

### `mosaic_tiles`

- stores anonymized public tile metadata only

### `educational_responses`

- stores generated educational payload metadata and rendered content

### `educational_response_sources`

- stores retrieval references used for a response

### `ledger_events`

- stores optional adapter-level event dispatch and confirmation state

## Export and deletion workflow expectations

### Export

- export must include profile data, consent records, educational responses, and the user’s own upload session history where still retained as metadata
- export must not require blockchain access to complete
- export should produce a versioned machine-readable bundle plus human-readable summary

### Delete

- delete must revoke future educational generation for the profile
- delete must destroy remaining off-chain upload artifacts and related keys where applicable
- delete must preserve only the minimal audit footprint required for compliance and abuse prevention
- anonymized public tile retention must be decided explicitly in an ADR before implementation

## Validation boundaries

- `packages/types` remains the source for shared TypeScript contracts and JSON Schemas
- FastAPI should load or mirror the JSON Schemas at the boundary, not invent parallel undocumented payloads
- every write route should validate request bodies against explicit schemas
- every read route should validate serialized responses before returning them

## Sequencing

1. Extend shared schemas in `packages/types`
2. Decide unresolved ADRs
3. Design SQLAlchemy or equivalent persistence models
4. Add migration files
5. Implement route handlers
6. Add export/delete job orchestration
7. Add optional ledger adapter

Related docs:

- [Architecture overview](README.md)
- [Public PRD](../prd/README.md)
- [ADRs](../adr/README.md)
