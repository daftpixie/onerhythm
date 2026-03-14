# Contributing to OneRhythm

Thank you for wanting to contribute.

OneRhythm is built for people who may have spent years feeling isolated, dismissed, or frightened by their condition. Please keep that emotional reality in mind in both code and communication.

## Before you begin

Read these files first:

- `README.md`
- `AGENTS.md`
- `CODE_OF_CONDUCT.md`
- relevant docs in `docs/`

## Ground rules

- Keep changes small and reviewable.
- Prefer one coherent change per pull request.
- Do not add features that cross the educational/diagnostic boundary.
- Do not store secrets, production data, or identified health data in the repository.
- Document architectural changes in `docs/adr/` when appropriate.

## Development flow

1. Fork or create a branch from `main`
2. Make a focused change
3. Add or update tests/docs as needed
4. Run validation locally
5. Open a pull request using the template

## Commit guidance

Prefer clear commits such as:

- `feat(web): add persistent disclaimer component`
- `fix(api): reject unsupported upload types`
- `docs: add ADR for consent boundary`

## Pull request expectations

A good PR should include:

- what changed
- why it changed
- screenshots if UI changed
- validation performed
- follow-up work, if any

## Validation

Run what is relevant for your change:

```bash
pnpm lint
pnpm typecheck
pnpm test

Backend-specific commands will be documented as the repo is scaffolded.

Accessibility

Accessibility is a first-class requirement, not polish.

At minimum:

keyboard navigable

visible focus states

adequate contrast

screen-reader-friendly labels and announcements

reduced-motion support where appropriate

Medical and regulatory boundary

Do not submit changes that:

interpret ECGs clinically

derive educational outputs from waveform analysis

make medical recommendations

remove or weaken required disclaimers

If your change comes near those areas, call it out clearly in the PR.

Documentation

If you change behavior, architecture, setup, or contributor workflow, update docs in the same PR.

Questions

If something is unclear, open an issue describing:

the problem

the proposed direction

affected files or systems