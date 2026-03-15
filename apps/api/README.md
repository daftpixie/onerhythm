# `apps/api`

FastAPI application workspace.

## Commands

```bash
pnpm --filter @onerhythm/api run setup
pnpm --filter @onerhythm/api run dev
pnpm --filter @onerhythm/api run migrate
pnpm --filter @onerhythm/api run ingest:curated
```

The service exposes:

- `GET /health` for liveness
- `GET /ready` for readiness

Auth and sessions:

- sign up: `POST /v1/auth/sign-up`
- sign in: `POST /v1/auth/sign-in`
- sign out: `POST /v1/auth/sign-out`
- current session: `GET /v1/auth/session`
- beta waitlist join: `POST /v1/beta/waitlist`
- list active sessions: `GET /v1/auth/sessions`
- revoke a specific non-current session: `POST /v1/auth/sessions/{session_id}/revoke`
- revoke other sessions: `POST /v1/auth/sessions/revoke-others`
- protected routes use the `onerhythm_session` HTTP-only cookie
- state-changing `/v1/*` requests must come from an allowed browser origin
- auth, upload, educational, and public mosaic routes have basic rate limits

Data rights:

- create consent: `POST /v1/consents`
- revoke consent: `POST /v1/consents/{consent_record_id}/revoke`
- list profile consents: `GET /v1/profiles/{profile_id}/consents`
- create and list export requests under `/v1/profiles/{profile_id}/export-requests`
- create and list delete requests under `/v1/profiles/{profile_id}/delete-requests`
- completed exports are served as JSON download artifacts
- completed deletes scrub user/profile data, revoke consent, remove upload-session metadata, remove derived public tiles, and preserve only minimal audit/request metadata

Upload processing lifecycle:

- create an upload session first
- process a JPEG, PNG, or single-page PDF against that session
- enforce file signature, extension/content-type consistency, size limits, and single-page PDF validation
- keep original files only in temporary session storage
- destroy temporary upload artifacts after processing or failure
- clean stale temporary workspaces on future runs and fail closed if cleanup does not complete
- persist only status, audit metadata, and anonymized tile handoff data
- never persist the original client filename in durable upload-processing metadata
- strip source metadata before the redaction hook runs
- run OCR/redaction through an internal provider interface backed by a local server-side implementation
- redact all detected visible text overlays conservatively and do not persist recognized text
- transform the redacted artifact into a destructive low-fidelity abstract field before tile derivation
- derive tile visual metadata from the transformed artifact only, never from the raw upload
- record stage-level processing reports, audit events, and non-retention verification metadata for cleanup
- surface recoverable failure messaging and retryability in upload-session responses

Curated educational content:

- approved local source entries live in `app/content/approved_sources.json`
- ingest them with `pnpm --filter @onerhythm/api run ingest:curated`
- retrieval prefers stored approved entries and falls back to the stub provider when the table is empty

Research Pulse:

- reviewed launch entries live in `app/content/research_pulse_seed.json`
- ingest them with `pnpm --filter @onerhythm/api run ingest:research-pulse`
- discover connector-sourced candidates with `pnpm --filter @onerhythm/api run discover:research-pulse`
- generate review-ready summaries with `pnpm --filter @onerhythm/api run summarize:research-pulse`
- public feed: `GET /v1/research-pulse`
- latest feed: `GET /v1/research-pulse/latest`
- topic feed: `GET /v1/research-pulse/topics/{theme_key}`
- signed-in personalized feed: `GET /v1/research-pulse/for-you`
- public detail: `GET /v1/research-pulse/{slug}`
- launch publication is review-first and provenance-first
- connector ingestion stores normalized publications plus raw source provenance from PubMed, Europe PMC, Crossref, and optional PMC OA XML when reuse is allowed
- maintainer operating policy lives in `docs/content/research-pulse-editorial-workflow.md`

Operational safeguards:

- structured JSON logs include request IDs
- startup validates environment configuration early
- unhandled errors are reported through the log-based error-reporting hook
- sensitive actions create audit events with request correlation metadata

Environment modes:

- local: relaxed cookie security for localhost
- staging: production-like behavior with staging origins
- production: requires secure cookies
- `BETA_MODE=invite_only` enables allowlist-gated account creation plus the public waitlist

## Database

The MVP schema uses SQLAlchemy plus Alembic. Local development defaults to
SQLite at `apps/api/dev.db` unless `DATABASE_URL` is set.

Seed/dev data strategy:

- run migrations first
- keep local seed data minimal and disposable
- prefer small hand-authored fixtures or SQL inserts during early development
- do not store real health data in local development databases
