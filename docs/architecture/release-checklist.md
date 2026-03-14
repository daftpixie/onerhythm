# Release Checklist

## Before staging

- `pnpm install`
- `pnpm setup:api`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- remember that current JavaScript-package lint coverage is still partial; treat `pnpm build`, `pnpm typecheck`, and the web/API test suites as the stronger gates until dedicated lint configs land
- remember that the repository now declares MIT consistently, but there is not yet an automated third-party dependency license inventory gate; review dependency additions manually
- verify [docs/architecture/deployment.md](deployment.md) still matches the real environment
- verify curated educational content is current for the intended launch scope

## Staging release

- deploy web through `.github/workflows/deploy-web.yml`
- deploy API through `.github/workflows/deploy-api.yml`
- run all staging smoke tests
- verify sign up, onboarding, educational fetch, upload session, export, and delete flows
- verify request IDs and audit events appear in logs for sensitive actions
- verify public mosaic renders `ready`, `empty`, and `degraded` states as expected

## Production release

- confirm staging passed without unresolved blockers
- confirm production environment secrets and variables are set
- confirm database backup or managed restore point exists
- apply API migration plan
- deploy API
- deploy web
- run production smoke tests
- monitor logs for rate limiting, readiness failures, and request error spikes

## After release

- record the deployed commit SHA
- note any follow-up fixes in [CHANGELOG.md](../../CHANGELOG.md)
- if needed, follow the rollback notes in [docs/architecture/deployment.md](deployment.md)
