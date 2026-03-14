# Product Requirements

This document is the public, repository-safe product brief for OneRhythm. It replaces confidential planning language with contributor-usable requirements and boundaries.

## Product summary

OneRhythm is a community-powered platform for people living with arrhythmias. People contribute de-identified ECG images to a collective heart mosaic and receive educational content based on their self-reported profile.

OneRhythm is not a medical device. It does not diagnose, treat, or interpret ECGs.

## Product goals

- Reduce isolation through a shared visual artifact
- Provide educational, profile-based guidance
- Preserve privacy and consent by default
- Keep the experience accessible, warm, and trustworthy

## Core users

- People living with arrhythmias
- Caregivers and family members
- Advocates, researchers, and nonprofit partners working with aggregated de-identified data

## Core product boundaries

- ECG uploads contribute to the mosaic only.
- Educational output must come from self-reported profile data and approved retrieval sources.
- The platform must never diagnose, interpret, characterize, score, or risk-rank ECG waveforms.
- Raw uploads must not be retained beyond the processing session.
- Educational screens must include a persistent, non-dismissible medical disclaimer.

## Initial feature areas

### ECG contribution

- Accept ECG images or exports for contribution to the mosaic
- Remove metadata and redact visible identifiers before downstream use
- Do not keep the original upload after processing
- Confirm contribution without exposing identifying information

### Self-reported profile

- Collect diagnosis, symptom history, treatment history, and lived-experience context
- Keep self-reported profile data logically separate from anonymized ECG tile data
- Allow people to view, edit, export, and delete their own data

### Educational guidance

- Provide general educational content for the user’s self-reported condition
- Suggest questions someone may want to bring to their clinician
- Surface relevant research and support resources
- Keep all medical-adjacent language measured, non-diagnostic, and disclaimer-safe

### Heart mosaic

- Use anonymized ECG-derived artistic tiles to form a collective heart mosaic
- Make the mosaic publicly viewable without exposing identity
- Provide accessible alternatives to the visual mosaic experience

### Transparency layer

- Keep blockchain optional and isolated from the core user experience
- Preserve deletion and consent revocation pathways even if transparency features are added
- Design the MVP so it can ship without blockchain coupling

## Privacy and compliance expectations

- Treat ECG uploads as sensitive
- Default to data minimization
- Support explicit, granular, revocable consent
- Preserve deletion and export workflows in architecture decisions
- Flag features with regulatory implications before implementation

## Accessibility expectations

- WCAG 2.1 AA minimum, with AAA preferred for educational content where practical
- Full keyboard navigation
- Visible focus states
- High-contrast support
- Screen-reader-accessible alternatives for the mosaic
- Minimum 44x44 touch targets on mobile

## Out of scope for v1

- AI-powered ECG interpretation or waveform analysis
- EHR integrations
- Telemedicine or provider communication features
- Real-time wearable streaming
- Clinical trial matching

Related docs:

- [Repository README](../../README.md)
- [Product docs](../product/README.md)
- [Brand system](../brand/README.md)
- [Architecture docs](../architecture/README.md)
