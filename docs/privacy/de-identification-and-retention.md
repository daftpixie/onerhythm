# De-Identification And Retention

This document describes what the repository currently retains, what it destroys, and where launch behavior is still partial.

## Scope

This document covers:

- ECG upload artifacts and derived tile metadata
- self-reported profile data and consent records
- educational guidance inputs and outputs
- export and delete request behavior

The same non-diagnostic boundary applies throughout:

- ECG uploads are not a clinical input to educational generation
- educational output remains based on self-reported profile data plus approved external sources

## Current retention map

| Data class | Current storage location | Retained now? | Exported now? | Deleted now? | Notes |
| --- | --- | --- | --- | --- | --- |
| Raw upload file | Per-session temporary workspace | No durable retention | No | Destroyed during processing cleanup | `raw_upload_destroyed_at` is recorded after successful cleanup. |
| Sanitized, redacted, and transformed upload artifacts | Per-session temporary workspace | No durable retention | No | Destroyed during processing cleanup | These artifacts are not published or stored as durable product records. |
| Upload-session metadata | Database | Yes | Yes | Yes | Includes status, redaction summary, anonymization summary, and failure details. |
| Processing-job metadata | Database | Yes | Yes | Yes | Stage-level job metadata is retained until delete. |
| Derived mosaic tile metadata | Database and public mosaic response surface | Yes | Yes | Yes | Delete removes current public tiles because unlinkable retention is not yet implemented. |
| Self-reported profile data | Database | Yes | Yes | Scrubbed and tombstoned on delete | Delete clears content while preserving minimal audit references. |
| Consent records | Database | Yes | Yes | Revoked on delete, not hard-deleted | Consent history remains visible for auditability. |
| Educational response history | Not persisted as a separate history store | No | No | Not applicable | Responses are generated on demand in the current MVP. |
| Export artifacts | Local filesystem under the API service | Yes | Downloadable | Removed on delete | The repository records an expiry timestamp but does not yet enforce expiry automatically. |
| Auth sessions | Database | Yes | No | Cleared on delete | Expired sessions are pruned in auth flows. |

## De-identification posture implemented now

Current controls are concrete and auditable:

- image and PDF metadata is removed before later processing stages
- OCR-detected visible text overlays are redacted before downstream artifact use
- recognized text is used in memory only for redaction decisions
- the artistic transform reduces fidelity before tile derivation
- the public mosaic publishes metadata only, not source imagery
- self-reported profile data remains separate from public tile metadata

## Delete and export behavior implemented now

Current delete behavior:

- revokes still-granted consent records
- destroys retained export artifacts
- removes upload-session and processing-job records
- removes derived public mosaic tiles tied to the deleted account
- removes community stories tied to the deleted profile
- clears auth sessions
- scrubs and tombstones user and profile rows so request and audit history can still point at stable identifiers

Current export behavior:

- writes a JSON bundle containing retained off-chain data
- includes upload-session metadata and derived tile metadata
- does not include raw uploads because they are destroyed during processing
- does not include educational response history because that history is not stored in the MVP

## Partial implementation and future work

The following areas are real but incomplete. Launch copy and maintainer expectations should stay aligned with that fact.

- Export artifact expiry is only partially implemented.
  The API records `download_expires_at`, but the download route does not yet enforce expiry and the repository does not yet include an automated purge job for expired export files.
- Temporary workspace sweeping is opportunistic, not scheduled.
  Stale workspace cleanup happens during later upload runs rather than through a dedicated retention worker.
- Public tile retention after delete is conservative, not unlinkable.
  The MVP removes derived public tiles because a stronger unlink model has not been implemented yet.
- The artistic transform is a practical privacy reduction step, not a formal anonymity proof.

## What maintainers should not promise

Do not promise any of the following unless the implementation changes:

- automatic hard expiry of export downloads
- mathematically formal anonymization
- unlinkable retention of deleted users' public tiles
- historical replay of prior educational responses

## Related docs

- [ECG processing policy](ecg-processing-policy.md)
- [Data rights fulfillment](../architecture/data-rights-fulfillment.md)
- [ADR 0002](../adr/0002-consent-export-delete-lifecycle.md)
- [ADR 0005](../adr/0005-ephemeral-upload-workspace-and-destruction.md)
