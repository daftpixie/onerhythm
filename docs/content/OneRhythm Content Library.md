# OneRhythm Mission and Narrative Content Library

## Executive summary

This Codex-ready content pack realigns OneRhythm’s UI/UX copy from **PRD-literal/spec language** to **mission-and-movement language**, using the authoritative copy rules from your *OneRhythm Web Content Strategy and Messaging Intent* (unity → visibility → belonging → action; “lantern, not weapon”; supportive-to-resolution; trauma-informed; non-diagnostic). fileciteturn6file0

The pack is designed to preserve the v3 backbone (synthetic-only participation, **0.75 m per verified rhythm**, one rhythm per person) while making the site feel like a global mission and a credible bridge to improved arrhythmia mental-health care pathways—anchored to peer-reviewed and authoritative sources including the 2025 entity["organization","European Society of Cardiology","medical society eu"] consensus statement (ACTIVE principles; Psycho-Cardio models). citeturn2search0

## Download and structure

[Download the Codex-ready markdown content pack](sandbox:/mnt/data/OneRhythm_Content_Pack_PRDv3.md)

Inside the pack you’ll find, in one markdown artifact:

- An executive mission narrative consistent with the movement ideology and the v3 product loop. fileciteturn6file0
- **12 SEO-targeted page templates** (Homepage, Join, Result, Mission, ResearchPulse, About/Founder, Clinician Brief, Resources/Crisis, Country Hub, Blog/Stories, Press/Media, FAQ) each containing:
  - meta title + meta description
  - 3–5 target keywords + suggested internal links
  - OG overlay text options + accessibility alt text
  - **300–700 words of H1/H2-only body copy per page**
- SEO keyword bank (20 high-intent phrases) + recommended global meta tags.
- schema.org **JSON-LD** snippets for Homepage and Result pages (Organization/WebSite + CreativeWork) aligned to Schema.org usage patterns. citeturn2search1turn2search5turn2search3
- **12 evidence-backed stat cards** with safe phrasing, “meaning + what helps,” short citation line, and “Read in ResearchPulse” link targets—anchored to:
  - arrhythmia clinic distress prevalence study citeturn1search0
  - ICD mood/PTSD meta-analysis citeturn0search1turn0search3
  - AF distress/suicidal ideation cohort citeturn1search2
  - UK Biobank social disconnection & AF outcomes citeturn0search2turn0search0
  - ESC 2025 consensus guidance citeturn2search0turn2search2
  - plus a privacy/compliance anchor to entity["organization","U.S. Department of Health & Human Services","hipaa regulator us"] de-identification guidance (Safe Harbor vs Expert Determination). citeturn3search43turn3search45
- 20 short share captions for result cards (dignified, invitational).
- 30 cross-platform social templates (X / IG Hook+Caption / LinkedIn / Reddit) with suggested hashtags + CTAs.
- An 8-week content calendar with cadence and milestone-driven hooks.
- Tone/style rules + mandatory safety copy (crisis resources + non-diagnostic boundaries).
- A Codex implementation checklist mapping copy modules to Next.js routes/components.

## Evidence and safety posture embedded in the copy system

The pack encodes three non-negotiables from your content strategy:

- **One hero stat per page** (except Press/Research reference lists), and every stat is paired with a “what helps” action so numbers function as justification for better pathways—not shock value. fileciteturn6file0
- **Non-diagnostic posture everywhere**, consistent with the platform boundary: education + solidarity, not interpretation. fileciteturn6file0
- **Crisis-safe phrasing:** any mention of suicidality or self-harm triggers mandatory crisis resource copy and non-therapeutic boundaries, consistent with safety best practice for public health messaging and the stance of respectful, solution-forward institutional partnership. fileciteturn6file0

The evidence anchors used throughout are intentionally high-signal and defensible:
- ESC 2025 consensus explicitly advocates integrated mental health assessment/management in routine CV care and provides ACTIVE implementation principles. citeturn2search0turn2search2
- Screening-based distress prevalence is explicitly framed as cohort-specific (arrhythmia clinic, n=222) and not generalized as universal truth. citeturn1search0
- ICD prevalence estimates and shock-associated odds are taken from a large systematic review/meta-analysis (39,954 patients). citeturn0search1turn0search3
- Social connection effects are cited from a large UK Biobank prospective multistate analysis (PubMed 40281650). citeturn0search2turn0search0
- Privacy/compliance anchoring references HHS OCR de-identification guidance describing Safe Harbor and Expert Determination methods. citeturn3search43turn3search45

## Codex implementation note

The pack includes a route/component checklist designed to fit your Phase 3–5 architecture (live homepage, /join, /result/[shareSlug], /mission Mission Control, ResearchPulse, and supporting content routes) while minimizing code churn:

- Keep the existing design system and components; replace strings via imported content modules.
- Prefer `apps/web/content/pages/*.mdx` + `apps/web/content/partials/*.mdx` to avoid scattering copy across TSX files.
- Parameterize HUD labels/tooltips and share panel microcopy (don’t hardcode).
- Do not alter v3 truth: **counting**, **uniqueness**, and **0.75 m** remain canonical.