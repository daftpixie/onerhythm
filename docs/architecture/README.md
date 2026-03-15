# Architecture

This directory holds the technical shape of the repository and its major boundaries.

## Focus areas

- Monorepo layout and package boundaries
- App responsibilities and integration points
- Optional subsystems that must remain isolated
- Development and deployment constraints

## Current direction

- `apps/web` for the Next.js frontend
- `apps/api` for the FastAPI backend
- `packages/*` for shared UI, config, and TypeScript-only contracts
- Blockchain-related code remains optional and isolated from core startup paths

Related docs:

- [Repository README](../../README.md)
- [Content operations](../content/README.md)
- [ADRs](../adr/README.md)
- [Product docs](../product/README.md)
- [Public PRD](../prd/README.md)
- [Brand system](../brand/README.md)
- [Data backbone plan](data-backbone.md)
- [API contract map](api-contract-map.md)
- [Upload processing](upload-processing.md)
- [ECG processing policy](../privacy/ecg-processing-policy.md)
- [De-identification and retention](../privacy/de-identification-and-retention.md)
- [Public Heart Mosaic](public-mosaic.md)
- [Analytics](analytics.md)
- [Educational guidance engine v1](educational-guidance-engine-v1.md)
- [Content architecture](content-architecture.md)
- [Evidence and provenance](evidence-provenance.md)
- [Approved source policy](../evidence/approved-source-policy.md)
- [Research Pulse review policy](../evidence/research-pulse-review-policy.md)
- [Community stories](community-stories.md)
- [Community UI audit](community-ui-audit.md)
- [Curated content ingestion](curated-content-ingestion.md)
- [Research Pulse](research-pulse.md)
- [Authentication](authentication.md)
- [Data rights fulfillment](data-rights-fulfillment.md)
- [Operations](operations.md)
- [Deployment](deployment.md)
- [Release checklist](release-checklist.md)
- [Trust readiness checklist](../launch/trust-readiness-checklist.md)
