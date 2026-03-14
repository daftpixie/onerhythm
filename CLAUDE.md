# CLAUDE.md — OneRhythm

This file is a secondary agent guide for the repository. `AGENTS.md` is the
canonical instruction set. If this file conflicts with `AGENTS.md`, follow
`AGENTS.md`.

## Mission

OneRhythm is a community-powered platform for people living with arrhythmias.
It aims to reduce isolation through a collective mosaic, profile-based
education, and transparent data handling.

## Hard Boundaries

- OneRhythm is educational only. It is not a medical device.
- Do not diagnose, interpret ECGs, characterize waveforms clinically, or make
  treatment recommendations.
- ECG uploads are used only for de-identification, artistic tile generation,
  contribution accounting, and trust or audit workflows.
- Educational output must come from self-reported profile data plus approved
  external sources, never from upload-derived analysis.
- Educational surfaces must keep the persistent non-dismissible medical
  disclaimer visible and accessible.

## Current Repository State

- `apps/web` contains the current Next.js app-router frontend.
- `apps/api` contains the FastAPI backend and the upload, consent, educational,
  Research Pulse, export, and delete flows.
- `packages/ui` and `packages/types` hold shared UI primitives, contracts, and
  schemas.
- The upload pipeline currently performs metadata purge, OCR-based visible-text
  redaction, destructive artistic transform, tile derivation, and workspace
  cleanup.
- Research Pulse is provenance-first and review-first in data and service
  design.
- Export and delete flows exist, but export-expiry enforcement and scheduled
  stale-workspace cleanup are still future work.

## Do Not Claim

Do not describe the current repository as implementing any of the following:

- ECG interpretation, diagnosis, triage, or treatment advice
- formal anonymization proof or waveform-level privacy guarantees
- GAN-based anonymization, LLM-backed diagnosis, EHR integrations, wearable
  streaming, or clinical trial matching
- blockchain-required runtime paths for core user flows
- one-click deployment automation
- complete JavaScript-package lint coverage

## Working Expectations

- Keep changes small, reviewable, and explicit.
- Prefer backend, schema, test, pipeline, and documentation work over visual UI
  changes unless trust-critical plumbing requires otherwise.
- Update docs when behavior, architecture, or repo workflow changes.
- Run the relevant checks before closing a task:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Primary Docs

- [Repository README](README.md)
- [AGENTS.md](AGENTS.md)
- [Public PRD](docs/prd/README.md)
- [ECG processing policy](docs/privacy/ecg-processing-policy.md)
- [Approved source policy](docs/evidence/approved-source-policy.md)
- [Trust readiness checklist](docs/launch/trust-readiness-checklist.md)
