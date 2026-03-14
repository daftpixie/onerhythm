# ADR 0001: Profile And Mosaic Separation

## Status

Proposed

## Context

OneRhythm must keep self-reported profile data logically separate from anonymized mosaic tile data. The current shared contracts already hint at that boundary, but the persistence and route plan needs an explicit repository-level decision.

## Decision

- `profiles` and `mosaic_tiles` will be separate entities with separate write paths
- `mosaic_tiles` will never store `profile_id`
- `upload_sessions` may reference `profile_id` only during processing and audit workflows
- public mosaic responses will expose only anonymized tile metadata

## Consequences

- deletion and export flows remain easier to reason about
- accidental joins between educational data and public tile data are easier to prevent
- some contributor workflows will require explicit cross-context orchestration instead of implicit joins

## Open questions

- whether any non-public internal lookup between upload sessions and tiles needs separate indirection
- how long upload-session metadata may be retained after raw upload destruction
