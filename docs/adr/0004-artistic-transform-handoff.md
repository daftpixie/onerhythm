# ADR 0004: Artistic Transform Handoff For Mosaic Tiles

## Status

Accepted

## Context

OneRhythm must treat uploaded ECGs as sensitive and must not let public mosaic
generation depend on raw waveform fidelity. The MVP currently accepts ECG image
exports for the mosaic only, not for diagnosis or clinical analysis. A stronger
future privacy approach may use a more formal anonymization method, but the
repository needs a practical launch-safe boundary now.

## Decision

- the upload pipeline will require a post-redaction `artistic_transform` stage
- the transform will convert the redacted ECG artifact into a destructive,
  low-fidelity abstract luminance field inside the temporary workspace
- tile visual metadata will be derived from the transformed artifact only
- the transformed artifact will not be published or durably retained
- upload-session metadata will record the transform method, checksum, and
  explicit raw-to-derived handoff metadata for auditability
- this MVP implementation is documented as an artistic privacy-preserving
  substitute, not as a formal biometric anonymization guarantee
- tile derivation will remain deterministic and versioned so maintainers can
  inspect which render and derivation rules produced a given public tile record

## Consequences

- the public mosaic no longer depends on raw or redacted ECG imagery after the
  allowed preprocessing stages
- contributors and reviewers can audit a concrete destructive transform instead
  of a placeholder `not_run` summary
- the current implementation reduces biometric fidelity aggressively, but it is
  still an MVP safeguard rather than a mathematically formal privacy claim
- a future stronger approach can replace the transform behind the internal
  service boundary without changing the public mosaic contract
- transform failure now fails closed before tile derivation rather than falling
  through to later artifact use

## Rejected alternatives

- continue using placeholder tile scaffolding:
  this leaves the privacy boundary implicit and makes tile derivation unrelated
  to the processed upload
- derive public tile metadata directly from the redacted upload:
  this keeps too much source fidelity in the downstream handoff
- claim formal waveform anonymization without implementing it:
  this would overstate the real guarantees and weaken trust
