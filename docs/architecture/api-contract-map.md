# API Contract Map

This document captures the initial route surface for the MVP API. It is a contract map only. Route handlers may exist as stubs, but business logic is intentionally out of scope here.

## Auth assumptions

- Profile, consent, export/delete, upload session, and educational content endpoints assume an authenticated end-user context.
- Authentication uses the `onerhythm_session` HTTP-only cookie backed by the `user_sessions` table.
- Protected routes enforce resource ownership against the authenticated `users.user_id`.
- Mosaic stats and tile listing are public read endpoints.
- Admin or maintainer scopes are not modeled yet.

## Shared-shape alignment

The route models in [apps/api/app/api/contracts.py](../../apps/api/app/api/contracts.py) are aligned to the canonical structures in:

- [packages/types/src/contracts/mvp-domain.ts](../../packages/types/src/contracts/mvp-domain.ts)
- [packages/types/src/schemas/user-profile.json](../../packages/types/src/schemas/user-profile.json)
- [packages/types/src/schemas/consent-record.json](../../packages/types/src/schemas/consent-record.json)
- [packages/types/src/schemas/upload-session.json](../../packages/types/src/schemas/upload-session.json)
- [packages/types/src/schemas/mosaic-tile-metadata.json](../../packages/types/src/schemas/mosaic-tile-metadata.json)
- [packages/types/src/schemas/educational-content-response.json](../../packages/types/src/schemas/educational-content-response.json)

## Route surface

### Profile

- `POST /v1/profiles`
  Request: `ProfileCreateRequest`
  Response: `ProfileResponse`
- `GET /v1/profiles/{profile_id}`
  Response: `ProfileResponse`
- `PATCH /v1/profiles/{profile_id}`
  Request: `ProfileUpdateRequest`
  Response: `ProfileResponse`
- `DELETE /v1/profiles/{profile_id}`
  Response: empty `501` stub for now

### Consent

- `POST /v1/consents`
  Request: `ConsentCreateRequest`
  Response: `ConsentRecordResponse`
- `GET /v1/profiles/{profile_id}/consents`
  Response: `ConsentRecordResponse[]`
- `PUT /v1/consents/{consent_record_id}`
  Request: `ConsentUpdateRequest`
  Response: `ConsentRecordResponse`
- `POST /v1/consents/{consent_record_id}/revoke`
  Request: `ConsentRevokeRequest`
  Response: `ConsentRecordResponse`

### Export request

- `GET /v1/profiles/{profile_id}/export-requests`
  Response: `ExportRequestResponse[]`
- `POST /v1/profiles/{profile_id}/export-requests`
  Request: `ExportRequestCreate`
  Response: `ExportRequestResponse`
- `GET /v1/profiles/{profile_id}/export-requests/{request_id}`
  Response: `ExportRequestResponse`
- `GET /v1/profiles/{profile_id}/export-requests/{request_id}/download`
  Response: JSON file artifact

### Delete request

- `GET /v1/profiles/{profile_id}/delete-requests`
  Response: `DeleteRequestResponse[]`
- `POST /v1/profiles/{profile_id}/delete-requests`
  Request: `DeleteRequestCreate`
  Response: `DeleteRequestResponse`
- `GET /v1/profiles/{profile_id}/delete-requests/{request_id}`
  Response: `DeleteRequestResponse`

### Upload sessions

- `POST /v1/upload-sessions`
  Request: `UploadSessionStartRequest`
  Response: `UploadSessionResponse`
- `POST /v1/upload-sessions/{upload_session_id}/process`
  Request: `UploadSessionProcessRequest`
  Response: `UploadSessionResponse`
- `GET /v1/upload-sessions/{upload_session_id}`
  Response: `UploadSessionResponse`

### Mosaic

- `GET /v1/mosaic/stats`
  Response: `MosaicStatsResponse`
- `GET /v1/mosaic/tiles`
  Response: `MosaicTileResponse[]`

Public mosaic responses expose anonymous tile metadata only. They do not return
profile identifiers, upload session identifiers, or raw-source references.
`MosaicStatsResponse` also carries launch-view metadata so the homepage can say
when it is showing a capped public sample rather than the full stored count.
`MosaicTileResponse` includes `tile_version` and `render_version` so artistic
derivation changes can be introduced later without changing the privacy model or
requiring a new public route shape.

### Educational content

- `GET /v1/profiles/{profile_id}/educational-content`
  Response: `EducationalContentResponseModel`

### Research Pulse

- `GET /v1/research-pulse/latest`
  Response: `ResearchPulseFeedResponseModel`
- `GET /v1/research-pulse`
  Response: `ResearchPulseFeedResponseModel`
- `GET /v1/research-pulse/topics/{theme_key}`
  Response: `ResearchPulseFeedResponseModel`
- `GET /v1/research-pulse/for-you`
  Response: `ResearchPulseFeedResponseModel`
- `GET /v1/research-pulse/{slug}`
  Response: `ResearchPulseDetailResponseModel`

## Contract rules

- Educational content responses must remain profile-driven and retrieval-driven only.
- Educational content must include explicit disclaimer metadata and source references.
- Research Pulse responses must preserve source provenance and claim citations.
- Personalized Research Pulse remains profile-driven educational output and requires educational-profile consent.
- Research Pulse must exclude preprints and avoid mirrored copyrighted full text unless reuse rights allow it.
- Mosaic routes must never expose a direct path back to profile data.
- Upload-session contracts may reference a profile during processing, but public mosaic routes may not.
- Blockchain remains outside the public API surface for now.

Related docs:

- [Data backbone plan](data-backbone.md)
- [Architecture overview](README.md)
- [Educational guidance engine v1](educational-guidance-engine-v1.md)
