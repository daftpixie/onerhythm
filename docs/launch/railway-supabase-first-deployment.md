# Railway + Supabase First Deployment

This document is the deployment path for the first real OneRhythm stack:

- Web hosting: Railway
- API hosting: Railway
- Database: Supabase Postgres
- Primary domain: `onerhythm.org`
- API domain: `api.onerhythm.org`
- Access model: closed beta / invite-only

## Topology

Use two Railway services.

### Web service

- Root directory: repository root `/`
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @onerhythm/web build`
- Start command: `pnpm --filter @onerhythm/web start`
- Healthcheck path: `/health`
- Custom domains:
  - `onerhythm.org`
  - `www.onerhythm.org`

Why root-level for web:

- `apps/web` depends on workspace packages in `packages/ui` and `packages/types`
- a service rooted at `apps/web` would lose direct workspace resolution
- root-level build keeps the existing pnpm workspace and lockfile intact

### API service

- Root directory: `apps/api`
- Builder: `Dockerfile`
- Build command: leave blank
- Start command: leave blank
- Healthcheck path: `/ready`
- Liveness path: `/health`
- Custom domain:
  - `api.onerhythm.org`

Why `apps/api` root-level for API:

- the FastAPI app is self-contained inside `apps/api`
- it does not need the pnpm workspace to run
- Railway can keep the Python build isolated from the Node web build
- the OCR dependency stack is currently supported on Python `3.12`, and the API `Dockerfile` pins that runtime explicitly
- this avoids Railway/Railpack Python-version drift during GitHub-connected deploys

Important for GitHub-connected Railway services:

- do not leave the API service on Railway autodetect defaults
- Railway may detect `package.json` and try to run `pnpm dev` if the service is misconfigured
- that fails in this repo because `dev` expects a prebuilt `.venv` at `apps/api/.venv`
- set the API service `Root Directory` to `apps/api`
- let Railway use the `Dockerfile` that now lives in `apps/api`
- if the service currently has custom build/start commands from earlier attempts, clear them so the Docker image is authoritative

### Why not Dockerfiles right now

The current repository can deploy cleanly without Docker:

- web already has a deterministic pnpm lockfile
- API already has a Python package definition plus Alembic
- two different Railway root directories are enough to keep the services separate

Dockerfiles would add maintenance cost without solving a repo-specific blocker today.

## Supabase database path

Use Supabase as managed Postgres only.

- Use direct Postgres connections from the API via SQLAlchemy.
- Do not introduce the Supabase JS SDK for waitlist writes or auth in this stack.
- Do not expose a Supabase `service_role` key to the client.

Connection rules:

- `DATABASE_URL` must be a Postgres URL with `sslmode=require`
- `DATABASE_MIGRATION_URL` should point at the same direct Postgres database for now
- Alembic now reads `DATABASE_MIGRATION_URL` first, then `DATABASE_URL`
- do not wrap either value in quotes in Railway
- do not leave placeholder text like `<region>` or `<password>` in the saved value
- if the database password contains reserved URL characters, URL-encode it before saving the URL

For the first closed beta, keep both URLs on the direct connection unless Supabase connection limits force a change later.

## Closed beta behavior

Set `BETA_MODE=invite_only` on both services.

What stays public:

- `/`
- `/about`
- `/mission`
- `/community`
- `/stories`
- `/mosaic`
- `/evidence`
- `/research`
- `/research/pulse`
- `/sign-in`
- `/sign-up`

What is gated:

- `/onboarding`
- `/education`
- `/account`
- `/contribute`
- `/research/pulse/for-you`

Invite-only rules:

- public visitors can join the waitlist from `/`
- account creation is blocked unless the email exists in `beta_allowlist`
- existing signed-in users who are not allowlisted are redirected to `/beta-access-pending`
- allowlisted users continue into onboarding or account flows

## Waitlist schema

Alembic migration `0011_beta_access_waitlist` adds:

- `beta_waitlist_signups`
- `beta_allowlist`

The waitlist stays separate from user/profile/auth data by design.

## Env matrix

### Web

- `NEXT_PUBLIC_ONERHYTHM_API_BASE_URL`
- `NEXT_PUBLIC_ONERHYTHM_SITE_URL`
- `BETA_MODE`

### API

- `ONERHYTHM_ENV`
- `LOG_LEVEL`
- `BETA_MODE`
- `DATABASE_URL`
- `DATABASE_MIGRATION_URL`
- `AUTH_ALLOWED_ORIGINS`
- `AUTH_SESSION_DURATION_DAYS`
- `AUTH_MAX_ACTIVE_SESSIONS`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_DOMAIN`
- `AUTH_COOKIE_SAMESITE`
- `REQUEST_ID_HEADER`
- `ERROR_REPORTING_BACKEND`
- `EXPORT_ARTIFACT_DIR`
- `MAX_UPLOAD_BYTES`
- `MAX_PROCESSING_SECONDS`
- `MAX_PDF_PROCESSING_SECONDS`
- `MAX_PIPELINE_ATTEMPTS`
- `MAX_WORKSPACE_AGE_SECONDS`
- `PUBLIC_RATE_LIMIT_REQUESTS`
- `PUBLIC_RATE_LIMIT_WINDOW_SECONDS`
- `AUTH_RATE_LIMIT_REQUESTS`
- `AUTH_RATE_LIMIT_WINDOW_SECONDS`
- `WAITLIST_RATE_LIMIT_REQUESTS`
- `WAITLIST_RATE_LIMIT_WINDOW_SECONDS`
- `UPLOAD_RATE_LIMIT_REQUESTS`
- `UPLOAD_RATE_LIMIT_WINDOW_SECONDS`
- `EDUCATION_RATE_LIMIT_REQUESTS`
- `EDUCATION_RATE_LIMIT_WINDOW_SECONDS`

## Domain and cookie rules

Required production values:

- `NEXT_PUBLIC_ONERHYTHM_SITE_URL=https://onerhythm.org`
- `NEXT_PUBLIC_ONERHYTHM_API_BASE_URL=https://api.onerhythm.org`
- `AUTH_ALLOWED_ORIGINS=https://onerhythm.org,https://www.onerhythm.org,https://api.onerhythm.org`
- `AUTH_COOKIE_DOMAIN=onerhythm.org`
- `AUTH_COOKIE_SECURE=true`

Why `AUTH_COOKIE_DOMAIN` matters:

- the API sets the `onerhythm_session` cookie
- the web app middleware reads that cookie on `onerhythm.org`
- without a shared cookie domain, localhost works but subdomain production breaks

## Migration and deploy order

1. Create the Supabase project and obtain the direct Postgres connection string.
2. Set API env vars in Railway, including `DATABASE_URL`, `DATABASE_MIGRATION_URL`, and `AUTH_COOKIE_DOMAIN`.
3. Configure the API service to use `apps/api` as its root directory and the checked-in `Dockerfile`.
4. Deploy the API service.
5. Run Alembic against Supabase:
   - `cd apps/api && ./.venv/bin/alembic upgrade head`
6. Manually seed `beta_allowlist` with the first invited emails.
7. Set the web env vars in Railway.
8. Deploy the web service.
9. Attach domains:
  - `onerhythm.org` -> web
  - `www.onerhythm.org` -> web
  - `api.onerhythm.org` -> API
10. Smoke test:
  - `GET /health` on web
  - `GET /health` and `GET /ready` on API
  - waitlist submit on `/`
  - invite-only sign-up with a non-allowlisted email
  - sign-in with an allowlisted email

## Manual follow-ups

- Seed `beta_allowlist` outside the application flow.
- Decide whether staging uses `staging.onerhythm.org` or a Railway preview domain.
- If Railway scales the API horizontally, replace the in-memory rate limiter with shared infrastructure.
- Add a durable artifact strategy for export files before treating export flows as production-ready.
