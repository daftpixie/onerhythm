# Operations

This document defines the lean production safeguards currently built into the
API runtime.

## Runtime safeguards

- structured JSON logging to stdout
- request IDs on every response
- generic error reporting hook that logs unhandled exceptions with request
  context
- startup environment validation
- `GET /health` for liveness
- `GET /ready` for readiness against the database and shared schema load
- in-memory rate limiting for public mosaic, auth, upload, and educational
  endpoints

## Auditability

Sensitive actions must write audit events. Current launch coverage includes:

- sign up, sign in, sign out
- profile create, update, delete
- consent create, update, revoke
- export request and fulfillment
- delete request and fulfillment
- upload-session creation and processing lifecycle
- educational content fetch

Audit events carry the current request ID in their payload so operational traces
can be correlated without exposing raw request bodies.

## Environment behavior

### Local

- `ONERHYTHM_ENV=local`
- cookies may be non-secure for localhost
- rate limiting still applies, but uses simple in-memory storage

### Staging

- `ONERHYTHM_ENV=staging`
- cookie and origin settings should match the staging domain
- request IDs and JSON logs should be collected centrally by the platform

### Production

- `ONERHYTHM_ENV=production`
- `AUTH_COOKIE_SECURE=true` is required
- readiness should be used by the platform before routing traffic
- the current error reporting backend is log-based, so production log shipping
  is part of the deployment requirement

## Deliberate limits

- rate limiting is process-local and intentionally simple for the current MVP
- error reporting is provider-neutral and currently log-only
- no heavyweight tracing or metrics stack is introduced yet
