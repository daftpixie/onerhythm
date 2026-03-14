# ADR 0002: Consent, Export, And Delete Lifecycle

## Status

Accepted

## Context

The product and repository rules require explicit, granular, revocable consent plus GDPR-style export and delete workflows. These are not optional operational details; they are part of the data model.

## Decision

- consent will be modeled as append-only records with explicit status transitions
- export and delete will be modeled as first-class request entities, not implicit side effects
- revocation must immediately affect future educational generation and future upload usage
- export and delete must work without blockchain availability

## Consequences

- route design stays auditable and predictable
- policy versioning and consent history remain visible
- implementation complexity moves into workflow orchestration rather than hidden ad hoc logic

## Launch semantics

- the launch MVP keeps a minimal retained audit footprint by scrubbing and tombstoning user/profile rows rather than hard-deleting every referenced row
- delete removes derived public mosaic tiles for now, because a stronger unlinkable-retention model is not yet implemented
- export and delete complete synchronously in the launch MVP and record explicit request statuses plus audit events
