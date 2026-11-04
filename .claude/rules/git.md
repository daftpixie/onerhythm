# Git & commit rules

- Conventional commits. Protected main. CI green before merge.
- Reference an ADR or spec section for significant changes.
- Never commit secrets, .env, service_role keys, or any real PHI/PII.
- Tests for an invariant are committed FIRST (failing), then the implementation.
- Pre-commit guards (.githooks/pre-commit) run the no-downvote, no-third-party-
  on-health, and secrets/PII scans. Do not bypass with --no-verify.
