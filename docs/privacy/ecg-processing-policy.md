# ECG Processing Policy

This document describes the ECG upload boundary that is implemented in the repository today.
It is a repository policy, not a marketing promise.

## Non-diagnostic boundary

OneRhythm is an educational resource and community platform. It is not a medical device.

Current repository rules and API boundaries require all of the following:

- ECG uploads are accepted only for de-identification, artistic tile generation, contribution accounting, and audit or transparency workflows.
- ECG uploads are not used to diagnose, interpret, characterize, score, risk-rank, or otherwise analyze waveforms for clinical purposes.
- Educational guidance and Research Pulse remain derived from self-reported profile data plus approved external sources. They do not consume upload-session data, OCR output, redaction summaries, transformed artifacts, or any ECG-derived features.

## Implemented now

The current upload pipeline is implemented in `apps/api` and exercised by API tests.

Current behavior:

- Upload processing starts from an authenticated upload session.
- Profile-linked uploads require granted `mosaic_contribution` consent before the session can start.
- Supported file types are `JPEG`, `PNG`, and single-page `PDF`.
- The pipeline validates size, signature, decodability, and single-page PDF constraints before later stages run.
- The source file is written only into a per-session temporary workspace.
- Processing then runs in this order:
  1. metadata purge
  2. OCR-based visible-text redaction
  3. destructive artistic transform
  4. tile visual derivation
  5. workspace cleanup
- Tile metadata is derived from the transformed artifact only, not from the raw upload or the merely redacted upload.
- The public mosaic exposes tile metadata only. The transformed artifact is not published.

## Raw-upload destruction semantics

Raw-upload destruction is implemented as a cleanup requirement, not as a best-effort note.

Current behavior:

- Raw, sanitized, redacted, and transformed files live only inside the temporary workspace.
- Cleanup runs in a `finally` path after both success and failure.
- On successful cleanup, the API records:
  - `raw_upload_retained = false`
  - `raw_upload_destroyed_at`
  - cleanup job metadata
  - audit events including `upload_session.cleaned_up` and `upload_session.non_retention_verified`
- If cleanup cannot fully remove the workspace, the upload session moves to `cleanup_failed`.
- A `cleanup_failed` session must not be described as a verified non-retention success.
- Stale temporary workspaces are swept opportunistically during later pipeline runs. There is not yet a separate scheduled cleanup worker.

## De-identification controls implemented now

The launch implementation uses layered reduction rather than a single privacy claim.

Implemented controls:

- source metadata is removed before later stages
- OCR-detected visible text overlays are redacted conservatively before downstream use
- recognized text is used only in memory for redaction decisions and is not persisted as recognized text output
- the post-redaction artistic transform intentionally destroys waveform fidelity before tile derivation
- transformed artifacts are retained only inside the temporary workspace and destroyed during cleanup

## What this policy does not claim yet

The current implementation is intentionally narrower than a formal privacy certification.

Do not claim any of the following from the current codebase:

- formal anonymization or re-identification-proof guarantees
- clinical waveform interpretation
- diagnostic or treatment outputs from uploads
- durable storage of raw, redacted, or transformed upload artifacts
- a dedicated operator UI or scheduled background job system for upload processing

## Related docs

- [Upload processing](../architecture/upload-processing.md)
- [De-identification and retention](de-identification-and-retention.md)
- [ADR 0004](../adr/0004-artistic-transform-handoff.md)
- [ADR 0005](../adr/0005-ephemeral-upload-workspace-and-destruction.md)
