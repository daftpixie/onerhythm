# Data Rights Fulfillment

This document defines the launch behavior for consent revocation, export, and delete.

## Scope

These flows apply to owned, off-chain data:

- self-reported profile data
- consent records
- upload-session metadata
- processing-job metadata
- export artifacts
- session records

They do not depend on blockchain availability.

## Export semantics

- A user can request export from their owned profile.
- The API creates an `export_request`, moves it through `requested -> processing -> completed`, and writes a machine-readable JSON bundle.
- Export includes:
  - user account metadata still retained for that user
  - self-reported profile data
  - consent records
  - upload-session metadata
  - processing-job metadata
  - derived mosaic-tile metadata tied to the user’s uploads
  - prior export/delete request history
- Export does not include:
  - raw uploads, because they are destroyed during processing
  - educational response history, because it is not persisted in the current MVP
- Export artifacts are local off-chain files and are deleted if the user later requests deletion.

## Consent revocation semantics

- Consent records are explicit and append-only in practice, with clear status values.
- Revoking `educational_profile` consent immediately blocks future educational generation for that profile.
- Revoking `mosaic_contribution` consent immediately blocks future upload-session creation for that profile.
- Revocation creates audit events.

## Delete semantics

Launch MVP behavior is privacy-first and conservative:

- delete revokes future educational generation for the profile
- delete revokes existing consent records that are still granted
- delete removes retained export artifacts
- delete removes owned upload-session metadata and related processing-job rows
- delete removes derived public mosaic tiles created from that user’s uploads
- delete clears user sessions
- delete scrubs and tombstones the user and profile rows so request/audit history can remain visible without retaining the original self-reported content

## Why public tiles are removed on delete

The current MVP does not yet implement a stronger unlink model for retaining anonymized public tiles after the source user deletes their account. Until that exists, delete removes the derived public tiles rather than keeping them in a way that could confuse consent expectations.

## Ledger / on-chain behavior

- MVP launch does not require blockchain.
- If a `ledger_adapter_ref` exists on a derived tile, delete records an audit event noting that an adapter-specific follow-up may be needed.
- Off-chain deletion still completes without waiting for any ledger system.

## Minimal retained footprint after delete

After delete completes, the platform retains only:

- the delete-request row and status metadata
- prior request metadata needed for auditability
- audit events
- scrubbed tombstone user/profile rows required to preserve those references

## User-visible behavior

- Users can review consent status, export status, and delete status from the Data controls UI.
- Export completion provides a downloadable artifact.
- Delete completion clears the current session and prevents further authenticated access with that account.

## Edge cases

- If export artifact generation fails, the request is marked `failed` with a retained failure reason.
- If delete sees adapter references, it records the reference in audit events and still completes off-chain deletion.
- If a profile is already deleted, owned-profile routes return `404`.
