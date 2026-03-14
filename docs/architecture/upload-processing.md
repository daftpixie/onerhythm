# Upload Processing

This document defines the current ECG contribution lifecycle from upload to tile creation.

## Supported formats

- `JPEG`
- `PNG`
- single-page `PDF`

Validation is strict:

- file signature must match a supported type
- declared content type and filename extension must agree with the detected type when present
- raster uploads must decode successfully
- PDF uploads must contain exactly one page
- uploads larger than the configured size limit are rejected

## Current limits

- `MAX_UPLOAD_BYTES`
- `MAX_PROCESSING_SECONDS`
- `MAX_PIPELINE_ATTEMPTS`
- `MAX_WORKSPACE_AGE_SECONDS`

These are environment-configurable and listed in [.env.example](../../.env.example).

## Processing stages

`upload_sessions.processing_status` uses explicit states:

- `initiated`
- `validating`
- `received`
- `sanitizing`
- `redacting`
- `transforming`
- `tile_generating`
- `cleaning_up`
- `completed`
- `failed`
- `cleanup_failed`

`processing_jobs` records stage-level attempts for:

- `pipeline_attempt`
- `intake_validation`
- `metadata_purge`
- `ocr_redaction`
- `artistic_transform`
- `tile_artifact_generation`
- `cleanup`

The pipeline attempt record also stores a structured `stage_reports` map so a
maintainer can inspect one durable job payload and see which stages ran, what
completed, and where cleanup or failure occurred.

## Lifecycle

1. Create an upload session.
2. Write the source file into a per-session temporary workspace.
3. Validate size, signature, extension/content type, and file decodability.
4. Strip source metadata.
5. Run the explicit OCR/redaction hook.
6. Run a destructive artistic transform on the redacted artifact.
7. Derive visual tile metadata from the transformed artifact only.
8. Destroy the temporary workspace.
9. Persist only upload-session metadata, processing-job metadata, audit events, and derived tile metadata.

## Privacy boundary

Sensitive source handling is limited to the active temporary workspace.

- raw uploads are never written to durable product storage
- original filenames are not persisted as retained product metadata
- `raw_upload_retained` must remain `false`
- `raw_upload_destroyed_at` records when the workspace source was destroyed
- cleanup records verify whether the raw upload existed before teardown and
  whether it remained afterward

HIPAA-style identifier stripping currently occurs in the `metadata_purge` stage:

- image uploads are re-encoded without metadata
- PDF uploads are rewritten without document metadata

Visible text redaction now occurs in the `ocr_redaction` stage:

- JPEG and PNG uploads are scanned locally for visible text overlays
- single-page PDFs are rasterized locally, scanned, and written back as a single-page redacted PDF
- all OCR-detected visible text overlays above the configured confidence threshold are treated as sensitive and redacted conservatively before downstream use
- recognized text is used only in memory for redaction decisions and signal classification; it is not persisted in `upload_sessions.redaction_summary`
- `redaction_summary.ocr_redaction` records whether OCR ran, whether text was detected, whether redaction occurred, and which stage failed if the OCR pass does not complete

Post-redaction anonymization now occurs in the `artistic_transform` stage:

- the redacted ECG artifact is converted into a low-fidelity abstract luminance field before tile derivation
- the transform is intentionally destructive: grayscale projection, square normalization, blur, coarse downsampling, mirror blending, quantization, and nearest-neighbor upscale
- the transformed artifact is designed for artistic metadata derivation only and does not support clinical waveform interpretation
- the transformed artifact is written only inside the temporary workspace and is destroyed during cleanup
- `anonymization_summary.artistic_transform` records the transform method, output dimensions, checksum, and destructive-step list
- `anonymization_summary.raw_to_derived_handoff` records that tile derivation reads the transformed artifact, not the raw or merely redacted upload

Tile visual derivation now occurs from the transformed artifact only:

- the stored `visual_style` is mapped from abstract artifact statistics such as luminance, contrast, gradient energy, and symmetry
- the mapping is deterministic and versioned, with explicit rule IDs for color,
  texture, glow, and opacity selection
- `mosaic_tiles.render_version` identifies the transform-based renderer version used to derive the tile metadata
- `mosaic_tiles.tile_version` identifies the public metadata contract version for the tile record
- the public mosaic continues to expose metadata only; no transformed image artifact is published

## Failure behavior

Failures are fail-closed:

- the upload session moves to `failed` or `cleanup_failed`
- a `failure` processing job is recorded
- an audit event is recorded
- cleanup still runs in `finally`
- if OCR fails, the stage report is still persisted with `status: failed` and a `failure_stage`, but the upload is not allowed to proceed to later artifact use
- if the artistic transform fails, tile derivation does not run and the upload is not allowed to proceed to later artifact use
- if cleanup fails, the session moves to `cleanup_failed`, the prior failure
  reason is preserved in cleanup metadata, and raw-upload non-retention is not
  declared as verified

Recoverable failures return structured guidance in the upload-session response:

- `retryable`
- `status_detail`
- `user_message`
- `recommended_action`

The same upload session may be retried only while under the configured pipeline attempt limit.

## Cleanup guarantees

- cleanup runs after success and after failure
- stale workspaces are swept on future pipeline runs
- if cleanup cannot fully remove the workspace, the session becomes `cleanup_failed`
- cleanup failure is auditable and should block silent retries
- cleanup metadata records tracked artifact labels and raw-upload presence before
  and after teardown
- the next upload run records a preflight stale-workspace cleanup report to
  provide a feasible crash-recovery proof point for orphaned workspaces

## Observability

The pipeline emits:

- `processing_jobs` rows
- `processing_jobs.job_payload.stage_reports`
- `audit_events` rows
- structured application logs for success, failure, and cleanup issues

Stage audit events include:

- intake validation
- metadata purge
- OCR redaction
- artistic transform
- tile artifact generation
- cleanup
- explicit non-retention verification after successful cleanup

## Out of scope

- any clinical ECG interpretation
- waveform analysis
- background job orchestration
