# OneRhythm Repository Instructions

OneRhythm is a community-powered platform for people living with arrhythmias.
This repository is MIT-licensed open source software and must remain clean,
auditable, contributor-friendly, and safe to reuse.

## Mission and tone

- Build with warmth, honesty, dignity, and emotional intelligence.
- Speak to people with lived experience, not to “patients” as abstract records.
- The product voice is a knowledgeable companion: never a doctor, never clinical, never alarmist.
- Favor clarity over hype. Favor trust over novelty.

## Hard product boundaries

These rules are mandatory and override convenience:

- OneRhythm is an educational resource and community platform.
- It is not a medical device.
- It must never diagnose, interpret, characterize, score, risk-rank, or otherwise analyze ECG waveforms for clinical or diagnostic purposes.
- ECG uploads may only be used for de-identification, artistic tile generation, contribution accounting, and transparency workflows.
- All educational output must be derived from the user’s self-reported profile and curated retrieval sources, never from computed analysis of the ECG image.
- Do not introduce copy such as “your ECG shows,” “we detected,” “we found signs,” or treatment recommendations.
- Every educational surface must include the persistent non-dismissible medical disclaimer.

## Privacy, consent, and compliance rules

- Treat all uploaded ECGs as sensitive.
- Never persist raw uploads beyond the processing session.
- Strip metadata and redact OCR-detected identifiers before any downstream use.
- Keep self-reported profile data logically separate from anonymized ECG tile data.
- Support explicit, granular, revocable consent.
- Preserve deletion/export pathways in architecture decisions.
- Default to data minimization.
- Do not implement features that would weaken deletion, portability, or consent revocation.
- Flag any feature with regulatory implications before implementation.

## Accessibility requirements

- WCAG 2.1 AA minimum. Prefer AAA for educational content where practical.
- Full keyboard navigation.
- Visible focus states.
- Screen-reader-accessible alternatives for the mosaic.
- aria-live support for validation and relevant dynamic updates.
- High-contrast mode support.
- Minimum 44x44 touch targets on mobile.
- The educational disclaimer must be accessible on every educational screen.

## Design system requirements

- Use the OneRhythm dark-first palette and token system.
- Respect approved typography and token names.
- Prefer calm, luminous, humane interfaces over flashy or clinical aesthetics.
- Respect prefers-reduced-motion.
- Any generative visuals are artistic, not diagnostic.

## Architecture expectations

Preferred monorepo layout:

- apps/web      → Next.js 14+ app router, TypeScript, Tailwind, Three.js
- apps/api      → FastAPI app for upload/profile/guidance APIs
- packages/ui   → shared design-system components and tokens
- packages/types → shared contracts/schemas/types
- packages/config → shared lint/format/ts config
- docs/         → architecture, ADRs, contributor docs

Guiding principles:

- Keep strict API boundaries between frontend, profile/guidance services, ECG processing, and ledger/transparency logic.
- Prefer typed contracts and schema validation at every boundary.
- Keep the blockchain layer optional at runtime and isolated from core UX.
- Build the platform so the MVP can ship without overcoupling to blockchain complexity.

## OSS repository standards

- Keep a top-level README with project overview, status, architecture, setup, and local development commands.
- Include LICENSE (MIT), CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, CHANGELOG.md, and .env.example.
- Use issue and pull request templates.
- Add CODEOWNERS once maintainers are clear.
- Add ADRs in docs/adr for major decisions.
- Document public interfaces and workflows.
- Keep commits small and reviewable.
- Do not add secrets, credentials, production data, or proprietary assets.
- Prefer reproducible local setup and deterministic scripts.

## Engineering standards

- Use TypeScript strict mode in frontend/shared packages.
- Validate inputs and outputs with schemas.
- Prefer pnpm for JS package management.
- Prefer explicit scripts over tribal knowledge.
- Add tests for critical behavior.
- Add linting and formatting before opening PRs.
- Do not introduce large dependencies without clear justification.
- Prefer simple designs that can be audited by open-source contributors.
- Keep comments factual and durable.

## Safety rules for content and AI features

- Educational generation must only use self-reported profile fields plus approved retrieval sources.
- Never claim certainty for medical information.
- Do not output treatment plans or clinical recommendations.
- Always preserve disclaimer visibility.
- Any prompt, retrieval, or content change affecting medical-adjacent text should be treated as high review sensitivity.
- Flag “future/regulatory review required” for anything near diagnosis, triage, trial matching, or wearable streaming.

## Default working process for agents

For non-trivial tasks:

1. Read the relevant files first.
2. Summarize the goal, constraints, and files to change.
3. Make the smallest coherent change that moves the task forward.
4. Run relevant validation.
5. Report exactly what changed, what was validated, and what remains.

When editing:

- Do not refactor unrelated areas unless necessary.
- Preserve naming consistency and token usage.
- Prefer additive ADRs/docs for major decisions.
- Call out assumptions explicitly.

## Done criteria

A task is not done unless:

- code is consistent with product boundaries above
- relevant tests/lint/type checks pass, or failures are explained
- docs are updated when behavior or architecture changes
- no sensitive/regulatory boundary was crossed
- the result is reviewable by an open-source maintainer without hidden context

## Initial repo commands

- Install deps: `pnpm install`
- Web dev: `pnpm --filter @onerhythm/web dev`
- API dev: `pnpm --filter @onerhythm/api dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`

## Directory-specific guidance

If a subdirectory needs tighter rules, add nested `AGENTS.md` files close to that code.
Keep root instructions concise and stable. Put specialized workflow details closer to the relevant package.
