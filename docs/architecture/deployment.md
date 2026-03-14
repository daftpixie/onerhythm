# Deployment

This document defines the current deployment path for the public MVP.

## Principles

- Keep deployment steps explicit and reviewable.
- Do not commit secrets or provider credentials.
- Use staging before production for every release candidate.
- Run database migrations before shifting API traffic.
- Preserve the educational-only, non-diagnostic boundary in every environment.

## Environments

### Local

- Web: `http://127.0.0.1:3001`
- API: `http://127.0.0.1:8000`
- Uses top-level [.env.example](../../.env.example)

### Staging

- Public smoke environment for pre-release validation
- Uses [.env.staging.example](../../.env.staging.example) as the template
- Must point the web app at the staging API base URL
- Should use production-like cookies and database settings

### Production

- Uses [.env.production.example](../../.env.production.example) as the template
- Requires `AUTH_COOKIE_SECURE=true`
- Requires a managed Postgres-compatible database
- Requires durable storage for export artifacts

## GitHub environments

Create two GitHub environments:

- `staging`
- `production`

Recommended protection rules:

- `staging`: optional reviewer gate
- `production`: required reviewer gate

## Secrets and variables matrix

Repository-level variables:

- `NODE_VERSION`
  Suggested value: `22`
- `PYTHON_VERSION`
  Suggested value: `3.11`

Environment secrets for `staging` and `production`:

- `NEXT_PUBLIC_ONERHYTHM_API_BASE_URL`
- `DATABASE_URL`
- `AUTH_ALLOWED_ORIGINS`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAMESITE`
- `EXPORT_ARTIFACT_DIR`

Environment variables for `staging` and `production`:

- `ONERHYTHM_ENV`
- `LOG_LEVEL`
- `AUTH_SESSION_DURATION_DAYS`
- `REQUEST_ID_HEADER`
- `ERROR_REPORTING_BACKEND`
- `MAX_UPLOAD_BYTES`
- `MAX_PROCESSING_SECONDS`
- `MAX_PIPELINE_ATTEMPTS`
- `MAX_WORKSPACE_AGE_SECONDS`
- `PUBLIC_RATE_LIMIT_REQUESTS`
- `PUBLIC_RATE_LIMIT_WINDOW_SECONDS`
- `AUTH_RATE_LIMIT_REQUESTS`
- `AUTH_RATE_LIMIT_WINDOW_SECONDS`
- `UPLOAD_RATE_LIMIT_REQUESTS`
- `UPLOAD_RATE_LIMIT_WINDOW_SECONDS`
- `EDUCATION_RATE_LIMIT_REQUESTS`
- `EDUCATION_RATE_LIMIT_WINDOW_SECONDS`

## Deployment flow

### Web

1. Run CI on the target commit.
2. Trigger `.github/workflows/deploy-web.yml`.
3. Choose `staging` or `production`.
4. Review the uploaded build artifact and workflow summary.
5. Deploy the built Next.js output with your hosting provider.
6. Run the smoke tests below.

### API

1. Run CI on the target commit.
2. Trigger `.github/workflows/deploy-api.yml`.
3. Choose `staging` or `production`.
4. Apply Alembic migrations against the target database.
5. Deploy the API revision.
6. Run the smoke tests below.

## Smoke tests

API:

```bash
curl -sSf https://api.example.onerhythm.dev/health
curl -sSf https://api.example.onerhythm.dev/ready
curl -sSf https://api.example.onerhythm.dev/v1/mosaic/stats
curl -I https://api.example.onerhythm.dev/v1/auth/session
```

Web:

```bash
curl -I https://example.onerhythm.dev/
curl -I https://example.onerhythm.dev/sign-in
curl -I https://example.onerhythm.dev/education
```

Header expectations to verify in staging or production:

- public routes return baseline headers such as `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`
- HTTPS environments return `Strict-Transport-Security`
- authenticated or personalized web routes return `X-OneRhythm-Release-Stage: experimental`
- authenticated or personalized web routes return `X-Robots-Tag: noindex, nofollow, noarchive`
- authenticated or personalized routes return `Cache-Control: private, no-store, max-age=0`
- authenticated or personalized API routes return `X-OneRhythm-Release-Stage: experimental`
- authenticated or personalized API routes return `Cache-Control: private, no-store, max-age=0`

End-to-end:

1. Sign up a fresh staging account.
2. Complete onboarding and consent.
3. Request educational content.
4. Start an upload session.
5. Request an export.
6. Verify audit visibility and request IDs in logs.
7. Verify the experimental routes still carry the expected no-store and stage headers after real sign-in redirects.

## Rollback notes

### Web rollback

- Re-deploy the previous known-good artifact or hosting-provider release.
- Re-run the web smoke tests.

### API rollback

- Re-deploy the previous known-good API revision.
- Only roll back database schema if the migration was explicitly designed to be reversible.
- If a schema rollback is unsafe, prefer a forward fix and keep the previous app revision off traffic.

### Data safety notes

- Do not roll back in a way that would bypass deletion or consent state already recorded.
- Do not reintroduce educational content behavior that weakens disclaimer or provenance requirements.
