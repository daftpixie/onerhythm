# Trust Readiness Checklist

Use this checklist before describing OneRhythm's trust layer as launch-ready.

This checklist is intentionally concrete. It separates implemented safeguards from partial implementations that must stay described as partial.

## Hard blockers

Do not describe the trust layer as launch-ready if any item below is false.

- Educational guidance or Research Pulse uses ECG-derived inputs.
- Public or internal copy implies diagnosis, ECG interpretation, or treatment advice.
- The persistent educational disclaimer is missing from educational surfaces or API contract expectations.
- The curated educational corpus is missing required launch sections, is stale, or includes non-external evidence in the API educational path.
- A public Research Pulse item lacks reviewer attribution, claim citations, external source typing, or adequate source grounding.
- Launch copy promises formal anonymization, unlinkable public-tile retention, or automatic export-expiry enforcement that the repository does not implement.

## Implemented safeguards to verify

- Upload processing is limited to metadata purge, OCR redaction, artistic transform, tile derivation, and cleanup.
- Raw uploads are retained only in temporary workspaces and successful runs record `raw_upload_destroyed_at` plus non-retention audit events.
- Upload failures still run cleanup, and cleanup failures surface as `cleanup_failed` rather than silent success.
- Educational guidance requires `educational_profile` consent and fails closed when approved source coverage is missing, incomplete, stale, or non-external.
- Research Pulse public routes exclude items whose integrity state drifts below the verified threshold.
- Export and delete requests execute against off-chain data without requiring blockchain availability.
- Delete removes current derived public tiles rather than keeping them under a weaker retention story.

## Partial implementations that must stay described as partial

- Temporary workspace sweeping is opportunistic during later upload runs. There is not yet a dedicated scheduled cleanup worker.
- Export requests record `download_expires_at`, but the repository does not yet enforce expiry automatically at download time or purge expired export artifacts automatically.
- Authenticated and personalized flows are still designated experimental until live-demo validation covers redirects, cookies, no-store behavior, and error recovery in a deployed environment.
- Research Pulse review is implemented through data, services, and tests, not through a maintainer UI.
- Educational response history is not retained as a separate audit log in the current MVP.
- The artistic transform is a practical privacy reduction step, not a formal anonymity proof.
- Repository linting is not fully scaffolded across the JavaScript packages yet. Current release confidence comes more from build, typecheck, API tests, and the web trust suite than from a complete lint gate.
- A strict Content Security Policy is not locked down yet. The repository ships baseline hardening headers, but CSP rollout still requires staged browser validation.

## Repository checks to run

- `pnpm lint`
- `pnpm --filter @onerhythm/api test`
- `pnpm --filter @onerhythm/web test`
- `pnpm typecheck`
- `pnpm build`

## Docs to review before launch copy is approved

- [ECG processing policy](../privacy/ecg-processing-policy.md)
- [De-identification and retention](../privacy/de-identification-and-retention.md)
- [Approved source policy](../evidence/approved-source-policy.md)
- [Research Pulse review policy](../evidence/research-pulse-review-policy.md)
- [Data rights fulfillment](../architecture/data-rights-fulfillment.md)
