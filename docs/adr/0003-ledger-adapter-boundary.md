# ADR 0003: Optional Ledger Adapter Boundary

## Status

Proposed

## Context

The PRD allows blockchain-backed transparency, but AGENTS requires that blockchain remain optional and isolated from core UX. The data backbone must not hard-wire ledger assumptions into the canonical model.

## Decision

- ledger functionality will live behind an internal adapter boundary
- core profile, consent, upload, mosaic, export, and delete workflows must succeed without ledger connectivity
- canonical entities will store adapter-facing event references only where needed, not chain-specific payloads everywhere

## Consequences

- MVP can ship without blockchain coupling
- ledger integration can be added or swapped later with less impact
- some transparency features will require explicit backfill or replay design

## Open questions

- event idempotency strategy for adapter retries
- whether consent events need synchronous or asynchronous ledger confirmation
- whether ledger event hashes belong in core tables or a separate adapter table
