# OneRhythm — Product Requirements Document
### A community-governed peer-support platform for people living with cardiac arrhythmia, and the people who care for them

**Version:** 1.0 (Draft for build)
**Author:** Matthew J. Adams
**Status:** Historical v1.0 pre-build design baseline. Later ADRs, amendments, and `docs/PRODUCTION_READINESS.md` govern current implementation and launch status.
**Companion document:** *Technical Specification: An Open-Source Peer-Support Community for Cardiac Arrhythmia Patients & Caregivers* (the research spec). This PRD assumes that document for the regulatory, stack, accessibility, payments, and analytics detail, and does not repeat it in full.

> **Tone note for everyone who reads this repo:** This is a small, volunteer-rooted project built to help people who are carrying something heavy. The language here is plain on purpose. No hype. No hubris. If something in this document sounds grandiose, it's a bug — flag it.

**28 October 2026 status note:** [PRD Amendment 3](OneRhythm_PRD_v1.0_Amendment_3.md) implements ADR 0017 (accepted 2026-10-28). It replaces the §2.2 and §8 "nothing clinical, ever" wording with a testable rule, adds Visit Prep (§7.10), and adds the privacy floor and the advisory group for AI to §6. Read it alongside this document; the body below is unchanged.

**26 September 2026 status note:** The funding vocabulary, entity alternatives, roadmap, and treasury dashboard below record an original design proposal. They do not establish implementation, launch, legal classification, public financial reporting, or incorporation. VT Infinite's proposed PBC conversion is unfiled and this repository is private.

---

## 1. Why this exists

People living with different cardiac arrhythmias can experience psychological distress, and caregivers may have needs of their own. Prevalence varies by diagnosis, setting, treatment stage, and measure. The selected symptomatic AF study reporting suicidal ideation in 16 of 78 participants is not an estimate for all arrhythmia patients. See the VT Infinite OneRhythm heart–mind evidence dossier dated 21 September 2026 for population-specific sources and limits. The proposed OneRhythm service has not demonstrated a clinical effect.

OneRhythm is a place for those people to find each other. It is not a clinic, not a medical record, not a diagnosis engine, and not a substitute for care. It is a peer community: diagnosis-organized spaces where patients and caregivers can talk, share their journey, and feel less alone, with a positive-only feedback culture and a governance model that gives the community real say over how the platform grows and how its money is spent.

The founder has one of these conditions (ARVC, implanted defibrillator). This is built from inside the experience, not from above it.

---

## 2. Goals and non-goals

### 2.1 Goals
- Give arrhythmia patients and caregivers a safe, accessible, diagnosis-organized peer community.
- Treat the **psychological** burden as first-class, not an afterthought to the physical condition.
- Make **caregivers** full members, not spectators.
- Be radically accessible: usable by an older, less-tech-savvy demographic, fully WCAG 2.2 AA.
- Be **community-governed** in a way that is genuine but safe — members shape features, direct a meaningful portion of funds, and help moderate, within guardrails that protect vulnerable users.
- Be sustainable through transparent, user-funded donations — with public accounting of where the money goes.
- Be open source, documented humbly, and welcoming to contributors.
- Never sell, leak, or monetize members' health disclosures. Ever.

### 2.2 Non-goals (explicit, to prevent scope creep and legal drift)
- **Not** a provider of medical advice, diagnosis, or ECG interpretation.
- **Not** a store of clinical data, medical records, lab values, or ECG/device data — none of this is ever ingested or stored.
- **Not** a HIPAA-covered clinical system (see research spec §1; staying out of this category is a design constraint, not an accident).
- **Not** a crypto/token/DAO project. Governance is off-chain by deliberate decision (see §6.6).
- **Not** a telehealth or patient-provider messaging tool.
- **Not** an emergency service. Every surface must make clear: in a crisis, call emergency services.

---

## 3. Target users and personas

| Persona | Who they are | Primary needs | Design implications |
|---|---|---|---|
| **The newly diagnosed patient** ("Dana") | Just received an AFib/SVT/ARVC/long-QT diagnosis; frightened, googling at 2am | Reassurance, plain-language information, to hear from people who've lived it | Gentle onboarding, no jargon, crisis resources visible, no scary auto-content |
| **The long-haul patient** ("Marcus") | Years into the condition; has an ICD; manages anxiety alongside the physical reality | Community, a place to process, to help others, to feel useful | Journey pages, ability to mentor, moderator pathways |
| **The caregiver** ("Rosa") | Spouse/parent/child of a patient; carries fear and logistics nobody acknowledges | Recognition as a real stakeholder, caregiver-specific spaces | First-class caregiver role, caregiver-only communities |
| **The contributing professional** ("Dr. Lee") | A clinician who wants to share *general* education, not practice medicine on the platform | A safe, clearly-bounded way to give back | Verified badge, broadcast-only educational content, hard limits (no diagnosis, no ECG reading, no individualized advice) |
| **The community steward** ("Sam") | An experienced member who moderates and participates in governance | Tools, legitimacy, protection from burnout | Elected moderator role, clear policy backing, safety floor that isn't theirs to carry alone |

Accessibility baseline assumption: **assume the user may be 65+, on an older device, with reduced vision or dexterity, and low confidence with technology.** Every decision is tested against that user.

---

## 4. Success metrics

Because this is a care platform, vanity metrics are actively discouraged. Measure what reflects genuine help.

**Primary (health-of-community) metrics**
- 30-day member retention (returning to read or post).
- Proportion of members who post or comment at least once (participation, not lurking-only) — a connection signal.
- Caregiver share of membership (target: caregivers are a meaningful, not token, fraction).
- "Felt less alone" — a lightweight, optional, non-identifying in-app sentiment pulse.

**Governance-health metrics**
- Proposal participation rate (share of eligible members who vote in a cycle).
- Quorum-attainment rate (share of proposals that reach binding quorum).
- Transparency-report on-time publication (target: 100%).

**Sustainability metrics**
- Recurring donor count and net monthly recurring support.
- Infrastructure cost coverage ratio (donations ÷ infra cost).

**Safety metrics**
- Median time-to-action on safety-floor reports (dangerous medical misinformation, self-harm signals).
- False-removal rate (content removed then restored on appeal) — kept low to protect trust.

**Explicitly NOT optimized for:** time-on-app, daily-active-user maximization, engagement-at-all-costs. This is a health community for people in distress; dark-pattern engagement goals are off the table.

---

## 5. Guiding principles

1. **Safety over democracy over engagement.** When these conflict, that's the priority order. A popular but dangerous health claim still comes down.
2. **Access is the mission.** If a feature is powerful but excludes the older/low-tech/low-vision user, it loses.
3. **Data minimization is a feature, not a constraint.** The less we store, the less we can leak, the safer our members are.
4. **Positive-only feedback.** No downvotes anywhere in the social layer. "Upbeats" only.
5. **Transparency by default.** Money, moderation actions, and governance results are public.
6. **Humility in public.** Documentation, copy, and tone are plain and welcoming. No hubris.
7. **The founder is legally accountable; the community is genuinely empowered — and those two truths are reconciled by tiered governance, not pretended away.**

---

## 6. Community governance system *(the headline requirement)*

This is the part most platforms get wrong, so it gets the most care. The requirement is: members vote on **features**, **use of funds**, and **moderation**. The responsible way to deliver that is a **three-tier model**, because not all three of those can or should be governed the same way.

### 6.1 The core problem
- You (or the legal entity) remain **legally and fiduciarily responsible** for the platform no matter what a vote says. If incorporated as a 501(c)(3), the board has a fiduciary duty that cannot be handed to a popular vote.
- This is a **health** community. Pure democratic moderation is dangerous: an upvoted-but-false claim ("stop your anticoagulant, try this instead") can kill someone. Safety cannot be a popularity contest.
- Governance systems get **captured** (vocal minorities), **gamed** (sybil/throwaway accounts), and **plutocratic** (if votes are weighted by money or tokens).

The tiered model resolves all three.

### 6.2 Tier 1 — Community-Binding (genuine democracy)
Decisions the community genuinely controls, with results that are binding within the safety floor:
- **Feature prioritization** — members propose and rank roadmap items; the top-ranked, build-feasible items are committed to the roadmap.
- **Community guidelines & norms** — proposals to add/change community rules (subject to the Tier-3 safety floor).
- **Election of community moderators** — members nominate and elect stewards.
- **Creation/naming of new diagnosis communities** — members can petition to open a new space.
- **Content-appeal outcomes** for non-safety disputes (tone, relevance, off-topic) — an elected panel, not the founder, resolves these.

### 6.3 Tier 2 — Community-Directed, Entity-Executed (participatory budgeting)
**Use of funds**, handled honestly:
- The platform publishes a **transparent treasury dashboard**: donations in, infrastructure/operating costs out, and a clearly defined **community-directed budget** (the discretionary portion remaining after legally-required operating costs).
- Members **propose and vote on** how the community-directed budget is spent (e.g., fund a caregiver-resource translation, sponsor a moderator stipend, donate to arrhythmia research, build a specific feature).
- Results are **binding within guardrails**. The entity executes the community's decision **unless** it would be illegal, unsafe, fiscally reckless (e.g., defunding required operating costs), or a conflict of interest. Any override must be **publicly justified** in the transparency report.
- **Guardrails (non-votable):** funds cannot be directed to an individual member's personal benefit, cannot violate the entity's nonprofit purpose, cannot defund legal/security/operating necessities, cannot be used for anything illegal.

This is **participatory budgeting**, a well-established municipal practice — real power over a real, defined pool, inside fiduciary guardrails. It is honest about the difference between "the community decides" and "the community advises and the entity rubber-stamps." The community genuinely decides the discretionary pool; the entity retains a narrow, accountable, publicly-justified veto.

### 6.4 Tier 3 — Safety Floor (never subject to any vote)
A short, explicit list of things that are removed/handled by policy and trained moderators regardless of popularity:
- Dangerous medical misinformation (telling people to stop prescribed treatment, "cures," dosing advice, anything creating imminent physical risk).
- Content that interprets a specific person's ECG/diagnosis (the platform's hard line).
- Self-harm/suicide crisis content → routed to support resources and human review, never to a vote.
- Illegal content, harassment, doxxing, impersonation of a clinician, CSAM, spam, scams.

The safety floor is published, version-controlled, and explained. It is the one area the community does **not** govern, and the PRD is honest about why: it's how we protect the most vulnerable members and how we keep the founder out of legal jeopardy. Over time, a small **clinical advisory input** (volunteer clinicians) can help maintain the medical-misinformation policy — but this is policy maintenance, not case-by-case diagnosis.

### 6.5 Voting mechanics (applies to Tiers 1 and 2)
- **Eligibility, not vote-weighting, is the lever.** Every eligible member gets exactly **one equal vote**. We do **not** weight votes by reputation, donation size, or tenure — weighting creates plutocracy and is wrong for a care community.
- **Eligibility gate (anti-sybil):** to vote, an account must be ≥30 days old and have a minimum participation history (e.g., a few posts/comments/upbeats). This resists throwaway-account manipulation without disenfranchising real members. Thresholds are themselves Tier-1 adjustable.
- **Quorum:** a result is binding only if a minimum share of eligible members participates (prevents a tiny faction from capturing an empty vote). Quorum level is published and tunable.
- **Time-boxed cycles:** proposal → discussion period → voting window → published result. No perpetual open votes.
- **Full transparency:** proposals, discussion, tallies, and outcomes are public and permanently viewable. Any Tier-2 entity override is published with its reason.
- **Anti-manipulation:** rate limits, one-vote enforcement at the database level, anomaly detection on voting spikes, and a conflict-of-interest rule (you cannot vote on a funding proposal that benefits you personally).
- **Accessibility of voting itself:** ballots follow the same WCAG 2.2 AA standards as everything else; plain-language proposal summaries are required; large tap targets; no time pressure within the voting window.

### 6.6 Why governance is OFF-chain (a deliberate decision)
This needs to be stated plainly: **do not put governance on-chain or use token voting.** Reasons:
1. **Access:** wallets, keys, and tokens are an accessibility catastrophe for an older, low-tech, vulnerable demographic. It would betray the core mission.
2. **Anti-plutocracy:** token-weighted voting hands control to whoever holds the most tokens. Antithetical to a care community.
3. **Securities/legal risk:** tokens conferring governance or financial rights can be treated as securities and invite regulatory exposure the project cannot afford.
4. **The fatal contradiction:** members have a legal right to delete their data (MHMDA/CCPA/GDPR). Immutable ledgers **cannot honor deletion.** On-chain identity + health-adjacent participation is a privacy dead end.

Governance is implemented as ordinary, auditable, deletable database records with public transparency. Simple, accessible, lawful.

---

## 7. Functional requirements

(Feature detail and compliance basis are in the research spec; this is the build checklist.)

### 7.1 Identity, roles, and onboarding
- **Passwordless auth** (email magic link primary; passkey optional; one social login optional). No password to remember. (Research spec §3.)
- **Roles:** Patient, Caregiver, Professional (verified), Moderator (elected), Admin/Steward. Roles drive permissions via row-level security.
- **Health self-identification** (diagnosis tags, symptom tags — physical and psychological) is **opt-in, explicit, separate consent, unchecked by default**, with plain-language explanation of how it's used (to join relevant communities) and a promise it is never sold or shared.
- **Onboarding** is gentle, skippable, plain-language, shows crisis resources, and never forces health disclosure to participate.

### 7.2 Communities
- Diagnosis-organized communities (AFib, SVT, ARVC, long-QT, VT, PVCs, post-ablation, ICD-recipients, etc.) plus caregiver-specific communities and a general/welcome space.
- Self-ID tags suggest relevant communities but never lock a user out of general spaces.
- New communities can be created via Tier-1 governance.

### 7.3 Posts, threads, and the "upbeat" system
- Threaded posts and comments within communities.
- **Upbeats:** upvote-only positive feedback. Implemented as a presence/absence row — there is structurally **no downvote state** in the data model. Score = count of upbeats.
- Real-time upbeat/feed updates via Supabase Realtime **Broadcast** (research spec §4, §7).

### 7.4 Journey pages (profile blogs)
- Each member can publish a blog-style "my journey" page on their profile.
- Long-form, supportive, member-owned; fully deletable; never indexed in a way that exposes private health-gated content (research spec §8 SEO note).

### 7.5 Professional contributions
- Verified professionals may post **general educational content only**, clearly labeled, broadcast-only.
- Hard-blocked: diagnosis, ECG interpretation, individualized advice, private clinical messaging. Enforced by policy, contributor agreement, persistent disclaimers, and moderation (research spec §1).

### 7.6 Moderation tooling
- Report/flag on every post and comment → moderation queue.
- Automated pre-filters for spam/profanity and a maintained **dangerous-claims keyword list** that escalates to human review (label/contextualize before removing where borderline; remove immediately where safety-floor).
- Public moderation log (transparency).
- Elected-moderator tools: lock, remove, restore, escalate, temporary community ban.
- A **"Community-Notes"-style context** mechanism for borderline health claims (add context rather than silently delete) — research-backed middle path.

### 7.7 Governance features (build spec)
- **Proposal objects** with type (feature / funds / guideline / moderator-election / community-creation / appeal), plain-language summary, discussion thread, voting window, quorum, and published result.
- **Ballot system** enforcing one-equal-vote, eligibility gate, conflict-of-interest checks at the DB level.
- **Treasury transparency dashboard:** live donations-in, costs-out, community-directed budget, and history of funded proposals.
- **Transparency report generator:** scheduled, public, includes any Tier-2 overrides with rationale.

### 7.8 Notifications & crisis safety
- Gentle, opt-in notifications (replies, governance windows opening, moderator messages).
- A persistent, always-reachable crisis/help affordance (region-appropriate emergency + mental-health resources). This is a safety requirement, not a feature.

---

## 8. Privacy, compliance, and safety requirements
(Authoritative detail in research spec §1; summarized as build-blocking requirements.)

- **Data minimization:** store only account, role, self-ID tags, content, votes, journey pages. **Never** store ECG/clinical/records data. Block document/image uploads that could contain medical records.
- **FTC Health Breach Notification Rule** applies: never disclose health data to third parties (ad/analytics) — such disclosure is itself a reportable breach.
- **Washington My Health My Data Act:** standalone Consumer Health Data Privacy Policy; explicit opt-in consent for health-data collection; access/deletion/withdraw rights; no sale, ever.
- **CCPA/CPRA & GDPR:** sensitive/special-category handling, rights fulfillment, GPC honoring; consider geo-gating non-primary markets at launch.
- **Clinician program** bounded by contributor agreement + persistent disclaimers + Section 230-aware moderation.
- **Mandatory before launch:** healthcare/privacy attorney review of ToS, both privacy policies, disclaimers, and the clinician program. *Build-blocking.*

---

## 9. Accessibility requirements (WCAG 2.2 AA) — build-blocking
- White/near-white background; body text ≥16–18px; line-height ≥1.5; legible humanist sans (e.g., Inter / Atkinson Hyperlegible).
- Contrast: text ≥4.5:1; UI/focus ≥3:1.
- Touch targets ≥24px (WCAG 2.2 SC 2.5.8); target 44px for primary actions.
- New-in-2.2 criteria: Focus Not Obscured, Consistent Help, Redundant Entry, Accessible Authentication (magic links/passkeys satisfy this), Dragging Movements alternative.
- Plain language (~8th-grade target). No autoplay, no carousels, icon+text buttons.
- CI gate: automated `axe` check + manual keyboard/screen-reader passes before merge.

---

## 10. Funding & payments
- **Donations on the web only**, via **Stripe** (Checkout for one-time with preset tiers + custom amount; Billing for recurring; customer portal for self-management).
- **Mobile apps ship free with no in-app fundraising UI** to stay inside Apple/Google policy; link out to the web for support. Re-verify store policy at submission (research spec §6).
- If incorporated as 501(c)(3): pursue Stripe nonprofit rate and store nonprofit donation paths.
- **Stripe data is never joined to a member's health self-ID.**

---

## 11. Analytics — privacy-safe only
- **Cookieless, no-PII** analytics (Plausible or self-hosted Umami). **No Meta/Google ad pixels on any health/authenticated page** — this has produced multi-million-dollar settlements and FTC actions (research spec §8).
- Track only non-sensitive product events (signup, post created, donation completed) in aggregate; **never** tag events with diagnosis/symptom.
- Social attribution via UTM parameters, not ad pixels.

---

## 12. Technical architecture
(Full rationale in research spec §2, §7.)
- **Client:** one **Expo (React Native + RN Web)** codebase → iOS, Android, web.
- **Backend:** **Supabase** (Postgres + Auth + Realtime Broadcast + Storage + Edge Functions + Row-Level Security).
- **Web hosting:** **Cloudflare Pages** (free tier, commercial-OK, unmetered bandwidth).
  *Superseded for the web host by [ADR 0023](../adr/0023-railway-landing-only-web-host.md) (3 November 2026): Railway hosts the web landing page, and the public build is landing-only.*
- **Payments:** Stripe (web). **Analytics:** Plausible/Umami.
- **Cost path:** ~$0–$25/mo at launch → ~$25–$100/mo at 10–50k → ~$100–$700/mo toward 500k; self-hostable escape hatch (Supabase is open source).

### 12.1 Data model additions for governance
Extend the research-spec schema with:
- `proposals` (id, type, author_id, title, plain_summary, body, status, discussion_thread_id, voting_opens_at, voting_closes_at, quorum_required, result)
- `ballots` (proposal_id, voter_id, choice, created_at) — **unique(proposal_id, voter_id)** enforces one-vote; CHECK constraints enforce valid choices
- `voter_eligibility` (materialized/derived: account_age_ok, participation_ok) — recomputed, transparent
- `treasury_ledger` (entry_type [donation/cost/allocation], amount, category, description, created_at, related_proposal_id) — public
- `moderation_actions` (already in spec) — extended with `governed_by` (policy vs elected-panel vs safety-floor) for transparency
- `safety_floor_rules` (versioned, public)

All governance/treasury records are ordinary, **deletable-where-required**, auditable rows. No ledger immutability that conflicts with deletion rights.

---

## 13. Non-functional requirements
- **Scalability:** Broadcast for realtime; denormalized upbeat counts on `posts`; read replicas when feed reads saturate; CDN caching of public pages.
- **Performance:** sub-second feed and upbeat updates; fast cold start on older devices.
- **Security:** RLS on every table; secrets in env/secret stores, never committed; least-privilege; regular dependency audits; a published `SECURITY.md`.
- **Maintainability:** one codebase; conventional commits; protected `main` with CI; ADRs for significant decisions.
- **Reliability:** backups; tested account-deletion cascade; graceful degradation if realtime drops (fall back to fetch).

---

## 14. Building this with Claude Code — methodology
*(Second explicit requirement. Reflects current — April/May 2026 — Claude Code practice.)*

The research is unambiguous on one point: **the patterns around the tool matter more than the prompts you type.** Anthropic's own data showed unguided sessions succeed ~33% of the time; structure is what moves that number. Here's the structure for this build.

### 14.1 Repository & memory layout
```
/onerhythm
  CLAUDE.md                  # <200 lines, curated, @imports for depth
  CLAUDE.local.md            # personal WIP notes, gitignored
  .claude/
    rules/                   # @imported domain rules (git.md, db.md, a11y.md, privacy.md)
    skills/                  # project skills (SKILL.md dirs) — see 14.3
    agents/                  # subagents — see 14.4
    plans/                   # plan-mode artifacts, reviewed before execution
    commands/                # short workflow entry-points only
  docs/
    adr/                     # Architecture Decision Records
    prd/                     # this document
  /app  /supabase  /tests ...
```

**CLAUDE.md discipline (current best practice):**
- Run `/init` first to scaffold from the codebase, then **curate** — never hand-write from scratch.
- **Stay under ~200 lines.** Claude reliably attends to ~150 instructions; past that, instructions get ignored. For each line ask: *"If I remove this, will Claude make a mistake?"* If no, cut it. If it's task-specific, move it to a Skill.
- Use **@imports** (`@.claude/rules/privacy.md`) to keep the root file short and modular.
- Put the **non-negotiables** in CLAUDE.md: the safety floor, "never store clinical/ECG data," "no ad pixels on health pages," "WCAG 2.2 AA is build-blocking," "upbeats only — no downvote state."

### 14.2 Hooks for the things that must never slip
CLAUDE.md is advisory (~70% adherence). **Hooks are deterministic.** Wire hooks to enforce, on every relevant change:
- Lint + type-check.
- Test suite (see TDD below).
- An **`axe` accessibility check** (a11y is build-blocking, so enforce it mechanically).
- A **secrets/PII scan** (block commits that would leak keys or pass health fields to analytics).
- A **"no-downvote" guard** and a **"no third-party tag on health routes" guard** as custom checks — encode your hardest safety rules as hooks, not hopes.

### 14.3 Skills to author (SKILL.md, progressive-loading)
- `privacy-compliance` — encodes data-minimization, HBNR/MHMDA/CCPA/GDPR rules; triggers on data-model, analytics, or consent work.
- `accessibility-wcag22` — the §9 checklist as an auto-applied standard; triggers on UI work.
- `governance-rules` — the three-tier model invariants (one-equal-vote, eligibility gate, quorum, conflict-of-interest, safety-floor immutability); triggers on governance/ballot/treasury work.
- `supabase-rls` — row-level-security conventions so every new table is locked down by default.
- `humble-docs` — encoded-preference skill for the no-hubris public writing voice in README/docs/copy.

### 14.4 Subagents to define (.claude/agents/, feature-specific beats general)
Per current practice (Boris Cherny's rule), **specific subagents beat generic ones.** Define:
- `privacy-reviewer` (read-only: Read/Grep/Glob) — audits diffs for data-minimization and third-party-leak violations; runs after data or analytics changes.
- `a11y-reviewer` (read-only) — audits components against WCAG 2.2 AA.
- `governance-reviewer` (read-only) — checks ballot/treasury changes against the three-tier invariants.
- `test-writer` (targets your test framework) — writes tests first, no mocks where real assertions are possible.
Each runs in its **own context window** and returns a compressed summary, keeping your main session clean.

### 14.5 Plan-mode + spec-driven workflow
- Use **`/plan`** (or "think hard"/"ultrathink") for any non-trivial feature: Claude explores **read-only**, produces a written plan in `.claude/plans/`, you **approve it**, then it executes. This human-approval gate is where quality is won.
- For features that must outlast a session or be read by non-developers, keep the spec in `docs/` (Spec-Kit-style). This PRD is the top-level spec; each feature gets its own sub-spec.
- Record significant choices as **ADRs** in `docs/adr/`.

### 14.6 Test-driven development (the single strongest pattern)
Anthropic's recommended loop, applied here:
1. **Write tests first** ("write tests for the upbeat service; TDD; no mock implementations").
2. **Confirm they fail.**
3. **Commit the failing tests** as a checkpoint.
4. **Implement until green** — *"do not modify the tests; keep going until all pass."* (Committing tests first means if Claude alters them, the diff shows it.)
Highest-value TDD targets here: the **no-downvote invariant**, **one-equal-vote enforcement**, **eligibility gate**, **RLS policies**, **consent gating of health data**, and **deletion cascade** (prove "delete my data" actually deletes).

### 14.7 Context hygiene
- Keep sessions under ~60% of the context window; quality degrades past that and auto-compaction (~83.5%) is lossy.
- **`/clear` between unrelated tasks.** Don't run a kitchen-sink session across six features.
- Before clearing a long session, **dump plan + progress to a markdown file**, then resume fresh from it.
- Spawn a **research subagent** for heavy exploration so 20 file-reads don't pollute your planning context.

### 14.8 Permissions & safety
- Use the **permissions allowlist** (`/permissions`) to pre-approve routine commands (lint, test, commit) without granting blanket access.
- Use **`/sandbox`** when running anything untrusted.

### 14.9 Your own metacognitive frameworks, applied
This build is exactly where the frameworks you've been cataloguing pay off:
- **Frame-setting** → CLAUDE.md + this PRD are the opening turn for every session.
- **Principle-anchored checkpointing** → the safety floor and a11y/privacy invariants, referenced at every decision point (and enforced by hooks).
- **Structured validation before build** → `/plan` + the deep-research gate before committing architecture.
- **The 15-minute rule** → if an obstacle won't yield, route around it (devnet-vs-local instinct).
- **Affect/architecture separation** → builder-voice in sessions, cool documentor-voice in the public repo (the `humble-docs` skill enforces it).
- **Protective holdback** → don't ship the donations flow or health-data features until the attorney review and the deletion-cascade tests are green.

---

## 15. Phased roadmap

**Phase 0 — Legal & foundation (build-blocking).** Entity decision (501(c)(3)?); attorney review of ToS, both privacy policies, disclaimers, clinician agreement. Repo, CLAUDE.md, skills, subagents, hooks, CI scaffolded.

**Phase 1 — Web MVP (free infra).** Magic-link auth; roles; opt-in health self-ID; communities; threads; upbeats; journey pages; crisis affordance; cookieless analytics; WCAG 2.2 AA throughout. No payments yet, no governance yet. Ship web first.

**Phase 2 — Moderation & safety.** Reporting, queue, dangerous-claims escalation, public mod log, Community-Notes-style context, elected-moderator tooling, the published safety floor.

**Phase 3 — Governance.** Tier-1 (feature/guideline/moderator/community votes), then Tier-2 (treasury dashboard + participatory budgeting), with eligibility gate, quorum, transparency, anti-manipulation. Tier-3 safety floor already live from Phase 2.

**Phase 4 — Funding.** Stripe web donations (one-time + recurring + portal); transparency-report generator; first public transparency report.

**Phase 5 — Mobile apps.** Expo → iOS + Android via EAS, payment-free, link-out for support. Apple Developer ($99/yr) + Google Play ($25).

**Phase 6 — Scale & sustainability.** Realtime/Broadcast tuning, read replicas as needed, volunteer moderator program, optional clinical advisory input for safety-floor maintenance, GDPR posture before EU marketing.

---

## 16. Risks, open questions, and legal flags

- **Legal review is mandatory and build-blocking.** MHMDA's private right of action, HBNR's breach definition, and the Meta-Pixel litigation wave make this a genuine, high-dollar risk area.
- **The clinician educational program is the subtlest risk** — the line between "general education" and "individualized advice" is exactly where liability and possible regulatory reclassification live. Keep it broadcast-only and heavily disclaimed.
- **Tier-2 governance vs. fiduciary duty** — confirm the participatory-budgeting structure with counsel, especially if incorporated; the entity's veto must be real and documented.
- **App-store payment policy is in flux** (2025 Google injunction, evolving Apple external-link rules, US-only). Re-verify at submission.
- **Community moderation of health misinformation is hard and imperfect.** Favor labeling/context over silent removal for borderline claims; reserve removal for the safety floor. Expect to tune this continuously.
- **Open question:** entity structure (501(c)(3) unlocks Stripe nonprofit rate + store donation paths but adds governance/board overhead — which interacts with the Tier-2 model).
- **Open question:** initial set of diagnosis communities and the exact eligibility thresholds/quorum levels for governance (these are themselves Tier-1 tunable once live).

---

## 17. The one-paragraph version
OneRhythm is an accessible, open-source, community-governed peer-support platform for people with cardiac arrhythmia and their caregivers, built on Expo + Supabase, funded transparently by its members, and governed in three tiers: the community genuinely controls features and a real discretionary budget, helps moderate, and elects its own stewards — while a published, non-votable safety floor protects vulnerable members from dangerous health misinformation, and the founder honors the legal and fiduciary duties that no vote can transfer. It stores no clinical data, leaks nothing to advertisers, treats the psychological burden of arrhythmia as first-class, and is built with Claude Code under a disciplined, test-first, plan-driven, accessibility-and-privacy-enforced workflow.

---

*This is a living document. It will be wrong in places and incomplete in others. Flag it, propose changes, and — once governance is live — vote on them.*
