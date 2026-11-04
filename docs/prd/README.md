# Specs index

## Authoritative (current direction — source of truth)
- `OneRhythm_PRD.md` — Product Requirements Document **v1.0**. Implementation
  source of truth.
- `OneRhythm_PRD_v1.0_Amendment_1.md` — architecture & compliance hardening;
  read alongside v1.0.
- `OneRhythm_PRD_v1.0_Amendment_2.md` — community media uploads (images/GIFs
  only, 5 MB, §7.9 defense-in-depth pipeline). BINDING GATE: ships at Phase
  2M, after the Phase 2 moderation core — nothing ships before that.
  Documents/PDFs/video stay blocked permanently. Journey pages are outside
  its scope.
- `OneRhythm_PRD_v1.0_Amendment_3.md` — **authoritative, implementing ADR 0017
  (accepted 2026-10-28).** Three layers (core, open standards, clinical care);
  the testable rule that replaces "nothing clinical, ever"; Visit Prep (§7.10);
  the Hub (§7.11); the AI additions to the safety floor; the privacy floor and
  the rule for changing a floor; the advisory group for AI; the share-link
  exception to Amendment 1. **Building any feature it describes still needs the
  legal review and safety case the amendment names**, and the rule-file changes
  ADR 0017 lists. Until those land, the stricter current rules win.
- `OneRhythm_Wireframes.md` — text wireframes (companion to v1.0).
- `OneRhythm_Wireframes_Addendum_A.md` — deletion, consent management, moderator
  console screens.
- `OneRhythm_Wireframes_Addendum_B.md` — Visit Prep, the crisis nudge, caregiver
  access, and Hub screens (companion to Amendment 3). Design targets for planned
  features, not built screens.
- `../brand/OneRhythm_Brand_Guidelines_v3.md` — **the authoritative brand
  document** (extended, not replaced, by the v3.1 addendum below). The VT Infinite house colour system: monochrome + one accent
  (Pulse Red `#E20A17`), 1R mark, semantic state colours retired. Typography
  (Atkinson Hyperlegible) and geometry (8px/12px radii) are unchanged from v2.
  Implemented by ADR 0010.
- `../brand/OneRhythm_Brand_Guidelines_v3.1_Addendum.md` — adds only what the
  vision introduces (AI-produced text, Visit Prep surfaces, consent screens with
  a data preview, Hub sessions, partner rooms and the name, numbers on public
  pages). No new colours or tokens. v3 stays authoritative for everything it
  already covers.

## Superseded — DO NOT use or reintroduce
- PRD v3 ("Mission to the Moon": Shared Rhythm Distance, 3D globe, AI-art mosaic,
  viral share engine) — retired direction. Not in this repo.
- Brand Guidelines v1 ("Bioluminescent Futurism", dark/neon) — retired.
- Brand Guidelines v2 (Heart Deep `#A4133C`, Mist/Slate greys, semantic state
  colours) — superseded by v3. The v2 document itself was never in this repo;
  v3 §0 records what changed. See ADR 0010.

## Known gap
- Research spec — "Technical Specification: An Open-Source Peer-Support Community
  for Cardiac Arrhythmia Patients & Caregivers." The v1.0 PRD defers to it for
  regulatory, stack, payments, and analytics detail. Not yet in-repo. Do NOT
  produce work that depends on it without flagging the gap first.
