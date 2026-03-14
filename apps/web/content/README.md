# Web Content Layer

This directory holds the launch content layer for OneRhythm's public editorial surfaces.

## Current model

- `authors.ts` defines reusable author metadata.
- `sources.ts` defines the evidence registry for founder narrative, institutional references, and future peer-reviewed or guideline sources.
- `entries.ts` defines reviewed content entries for:
  - essays
  - research translations
  - condition education modules
  - support resource pages
  - campaign landing pages

The content layer is intentionally file-based for launch. It is designed for SSR, SEO, and contributor-friendly review without introducing a CMS.

## Add or update content

1. Add or update author records in [authors.ts](authors.ts) if needed.
2. Add or update source records in [sources.ts](sources.ts).
3. Add or update entries in [entries.ts](entries.ts).
4. Keep `review_state` accurate.
5. Set `disclaimer_required` to `true` for educational surfaces.
6. Link content entries to source records through `source_links`.
7. Keep citation metadata factual; do not invent studies, DOIs, or guideline references.
8. Distinguish clearly between `peer_reviewed_study`, `clinical_guideline`, `institutional_reference`, and `founder_narrative`.
9. For `research_translation` entries, populate `research_translation.key_finding`, `plain_language_meaning`, `questions_for_doctor`, and `stat_highlights`.
10. Keep research translations careful: plain-language, non-diagnostic, and explicit about uncertainty.
11. Run `pnpm --filter @onerhythm/types run typecheck` and `pnpm --filter @onerhythm/web run typecheck`.

## Boundaries

- Educational content must remain non-diagnostic.
- Educational surfaces must keep the persistent disclaimer.
- Editorial content and personalized API-generated education are separate systems.
- The static content layer may cite approved source material, but it must not consume ECG-derived inputs.
