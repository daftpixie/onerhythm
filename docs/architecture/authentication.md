# Authentication

OneRhythm uses simple email/password authentication with opaque database-backed sessions.

## Current assumptions

- provider choice is first-party and auditable
- password hashing uses Python `scrypt`
- sign-up enforces a bounded password policy and normalized email handling
- session tokens are random opaque values stored as SHA-256 hashes in `user_sessions`
- the browser stores the session token in an HTTP-only cookie named `onerhythm_session`
- cookies carry explicit expiry/max-age values
- authenticated and personalized flows currently emit `Cache-Control: private, no-store, max-age=0`
- active sessions are capped and the oldest sessions are revoked when the cap is exceeded
- authenticated users can list and revoke non-current sessions from the account controls UI
- state-changing API requests enforce an allowed browser `Origin` before cookie-authenticated actions run
- roles are intentionally minimal: `user`, `support`, `admin`
- sign-in, sign-up, onboarding, education, and account-management flows should still be treated as experimental until staged live-demo validation is complete

## Ownership model

- `profiles` are owned by `users.user_id`
- `upload_sessions` are owned directly by `users.user_id`
- consent, export, and delete records are reachable only through an owned profile
- public mosaic routes remain unauthenticated

## Protected API surface

- `/v1/profiles/*`
- `/v1/consents/*`
- `/v1/upload-sessions/*`
- `/v1/profiles/{profile_id}/educational-content`
- `/v1/profiles/{profile_id}/export-requests`
- `/v1/profiles/{profile_id}/delete-requests`

## Local development

Required env vars are listed in [.env.example](../../.env.example).

Local defaults assume:

- web at `http://127.0.0.1:3001`
- api at `http://127.0.0.1:8000`
- SQLite for development
- non-secure cookies for localhost only

## Future admin/support scope

The role column exists now to avoid a schema rewrite later, but no admin tooling is exposed yet.
Any support/admin UI should be added only with explicit route-level role checks and audit logging.
