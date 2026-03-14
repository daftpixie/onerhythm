# ADR 0005: Ephemeral Upload Workspace And Raw-Upload Destruction

## Status

Accepted

## Context

AGENTS requires that raw ECG uploads not be retained beyond the processing session.
The repository therefore needs a concrete implementation boundary for where raw uploads may exist, how cleanup is verified, and how failures are surfaced without overclaiming non-retention.

## Decision

- raw, sanitized, redacted, and transformed upload artifacts live only in a per-session temporary workspace
- cleanup runs after both successful and failed processing attempts
- successful cleanup records `raw_upload_destroyed_at` and an explicit non-retention audit event
- if cleanup cannot remove the workspace fully, the session moves to `cleanup_failed`
- `cleanup_failed` means the system must not claim verified non-retention for that session
- stale temporary workspaces may be removed opportunistically during later upload runs, but that does not replace explicit per-session cleanup

## Consequences

- raw-upload handling becomes concrete and auditable instead of aspirational
- cleanup failures remain visible to maintainers instead of being hidden behind a generic failed state
- launch documentation can honestly distinguish between verified cleanup and cleanup that still needs manual follow-up

## Current limitations

- the repository does not yet include a dedicated scheduled cleanup worker
- the repository does not yet include a separate operator UI for cleanup review

## Rejected alternatives

- treating process completion as proof of destruction without cleanup evidence:
  this would overclaim non-retention
- silently deleting best-effort temporary files without surfacing cleanup failures:
  this would weaken auditability and incident handling
