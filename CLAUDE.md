# OneRhythm — Claude Code Project Memory

Accessible, open-source, community-governed peer-support platform for people
living with cardiac arrhythmia and their caregivers. Built from inside the
experience. Plain on purpose — if something sounds grandiose, it's a bug.

Entity status (2026-09-26): OneRhythm is an initiative of VT Infinite, Inc.
The proposed Delaware PBC conversion is drafted and NOT FILED (see ADR 0007).
OneRhythm is not a separate 501(c)(3). Confirm trade-name and contribution copy
with counsel before launch. Use "member support" / "contributions" in product
copy. Open books remain an intended, not yet public, trust mechanism.

## What this is / is NOT

- IS: peer community, diagnosis-organized spaces, positive-only feedback,
  community-governed within a safety floor, planned member support, Apache-2.0 licensed (ADR 0024).
- IS NOT: medical advice / diagnosis / ECG interpretation; a clinical record
  (no structured clinical fields, no inbound clinical integration — see #1);
  crypto/token/DAO; telehealth; an emergency service.

## Non-negotiables (enforced by hooks + DB constraints, not good intentions)

1. NO clinical records, ever (ADR 0017 Decision 3; PRD Amendment 3 §2.2). No
   structured clinical fields anywhere (no diagnosis, medication, lab or ECG
   fields). No inbound clinical integration (no FHIR reads, no device or record
   import). Store only: account, role, self-ID tags, content, votes, journey
   pages, and — only under its own consent, once built — the Visit Prep journal.
   Member-authored free text there is consumer health data: treat all of it as
   health data.
   Uploads: documents/PDFs/video are blocked PERMANENTLY; images/GIFs are
   permitted ONLY through the PRD Amendment 2 §7.9 pipeline, which ships at
   Phase 2M (after the Phase 2 moderation core) — nothing ships before that.
   No medical imagery, ever (ECG strips, monitor photos, labs, med labels).
2. NO diagnosis or individualized medical advice anywhere — including verified
   professionals (general, broadcast-only education + persistent disclaimers).
   Interpreting any specific person's ECG/diagnosis is the hard line.
3. WCAG 2.2 AA is BUILD-BLOCKING. A feature that excludes the 65+ / low-vision /
   low-tech user loses. Details: @.claude/rules/a11y.md
4. UPBEATS ONLY — there is structurally NO downvote. Presence/absence row; no
   downvote state in the data model or UI. (Guarded by hook.)
5. NO ad/tracking pixels on any health or authenticated page. Analytics are
   cookieless, PII-free, never tagged with any health data. Health data is never
   sold, and never disclosed to a third party EXCEPT: at the member's own
   request; to a processor (two paths, below); or under a valid legal order or
   reporting duty. Infrastructure processors (hosting, database, email,
   captions, telephony) need a written contract, no use of their own, no
   training on member content, stated retention, and a subprocessor-inventory
   entry (a caption processor also keeps no transcript — floor item 10). AI
   providers need all of that PLUS a consented, member-initiated request, and
   everything ADR 0017 Decision 4 requires. Any other disclosure is a
   reportable breach; counsel determines reporting duties. AI-provider hosts
   only in the AI gateway module. (Guarded.)
6. Governance is OFF-CHAIN, one equal vote, with TWO non-votable floors — the
   safety floor and the privacy floor — that change only under ADR 0017's
   floor-change rule. Details: @.claude/rules/governance.md
7. Legal review is build-blocking before launching member support or any health-data
   feature. Do not ship those without it.

## Who it's for — test every decision against this user

65+, older device, reduced vision/dexterity, low confidence with tech.
Personas: newly diagnosed; long-haul (ICD, anxiety); caregiver (first-class,
never a spectator); bounded contributing professional; elected steward.

## Tradeoff priority (when they conflict)

safety > access > privacy/data-minimization > genuine governance >
sustainability/humility > polish.

## Stack (do not substitute)

- Client: one Expo (React Native + RN Web) codebase -> iOS, Android, web
- Backend: Supabase (Postgres + Auth + Realtime Broadcast + Storage + Edge
  Functions + Row-Level Security). RLS on EVERY table by default.
- Web host: Railway (ADR 0023; was Cloudflare Pages). The public web build is
  LANDING-ONLY (`EXPO_PUBLIC_SITE_MODE=landing`) until the launch gates are met.
- Payments: Stripe (WEB ONLY; no in-app donation UI on mobile — link out)
- Analytics: Plausible / self-hosted Umami (cookieless, no PII)
- Auth: passwordless (email magic link primary; passkey optional; one social ok)

DB/RLS conventions: @.claude/rules/db.md and the supabase-rls skill.

## Brand (v3 — ADR 0010)

Authoritative: docs/brand/OneRhythm_Brand_Guidelines_v3.md. The VT Infinite
house colour system: Paper/Ink with hierarchy by OPACITY (no greys) plus exactly
one accent, Pulse Red #E20A17. Semantic state colours are RETIRED — a state is
carried by icon + text + weight. Depth is 1px hairlines, never shadows. The mark
is 1R; "Rhythm" in the wordmark is the accent.

Every colour lives in src/theme/tokens.ts — nowhere else. Guard #7 blocks colour
literals in src/ and app/; tests/unit/contrast.test.ts computes WCAG ratios from
those tokens, so a token edit fails the suite. Pulse Red is 4.90:1 on Paper but
only 4.29:1 on Ink: fine for the mark's heart, NEVER for text on Ink.

Unchanged and not up for revision: Atkinson Hyperlegible everywhere (v3 §10.1,
pinned by tests/unit/typeface.test.tsx) and the 8px/12px radii.

## Voice

Plain ~8th-grade, warm, humble, honest. No hype, no hubris, no urgency, no
growth-hacking. Never rank suffering ("pain is not a competition"). Educational
framing only; medical judgment stays with the member and their clinician.

Anchor phrases, used sparingly and sincerely: "invisible bears," "nobody should
fight an invisible bear alone," "pain is not a competition," "Ad Astra Per
Aspera." Enforced by the humble-docs skill.

## Scope (never cross it)

OneRhythm is general-wellness, non-clinical and patient-facing. It never
contains clinical-software features, diagnostic models or regulated-device
claims. Work of that kind belongs in a separate project and never in this
repository — not in code, copy, or comments.

## Workflow (patterns matter more than prompts)

- Plan-mode for any non-trivial feature: explore read-only -> write plan to
  .claude/plans/ -> get human approval -> execute.
- TDD is the strongest pattern: write tests first, confirm they fail, COMMIT the
  failing tests, implement until green WITHOUT modifying the tests. Highest-value
  invariants: no-downvote, one-equal-vote, eligibility gate, RLS policies,
  consent-gating of health data, deletion cascade.
- Record significant choices as ADRs in docs/adr/.
- Context hygiene: keep sessions < ~60% context; /clear between unrelated tasks;
  dump plan+progress to markdown before clearing.

## Reviewer subagents (read-only; each in its own context)

privacy-reviewer - a11y-reviewer - governance-reviewer - test-writer.
Invoke the relevant reviewer after any change in its domain.

## Known gaps

The research spec ("Technical Specification: An Open-Source Peer-Support
Community for Cardiac Arrhythmia Patients & Caregivers") is not yet in-repo.
Do NOT produce regulatory/stack/payments work that depends on it without
flagging the gap first.

## Session protocol

Start: read this file + docs/SESSION_LOG.md.
End: append to docs/SESSION_LOG.md — what changed, key decisions, next step.
