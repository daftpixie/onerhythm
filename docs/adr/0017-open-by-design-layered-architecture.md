# ADR 0017 — Open by design: three layers, Visit Prep's scope, and where claims live

Status: Accepted — founder, 2026-10-28 (including the floor-change rules in Decision 4)
Date: 2026-10-27
Depends on: the status-reconciliation PR (#1, opened 26 September 2026), which
corrects the entity wording elsewhere in the repository. It should merge first.
Relates: PRD §2 (goals and non-goals), §6 (governance), §7 (functional
requirements), §15 (roadmap); ADR 0003 (MVP data model); ADR 0007 (entity and
transparency posture); ADR 0016 (statistics discipline);
`.claude/rules/privacy.md`; `.claude/rules/governance.md`;
`docs/vision/OneRhythm_Vision.md`.

## Context

On 27 October 2026 the founder set the direction for what comes after the
Phase 1 MVP:

- **Open by design.** The project will be published as open source. The
  distribution strategy is a credible, well-founded vision plus working code,
  so that organizations with the capacity — health systems, payers, patient
  organizations, international health services — can deploy and carry it,
  across borders. The founder keeps building.
- **The broader ambition** is a platform that consolidates support that is
  currently split by diagnosis, adds trained peer coaches and moderated live
  sessions, offers therapist-delivered CBT, connects to health records, and helps
  people observe how they are doing across body and mind between appointments.
- **Visit Prep** was chosen as the near-term form of that observation: a private,
  member-owned journal, with optional AI help, for preparing for appointments.
- **Members — patients and caregivers — steer direction**, within floors that
  no vote can change, as the technology changes.

Much of that ambition cannot be delivered safely or lawfully by a non-clinical,
volunteer-rooted core: therapy needs licensed clinicians and HIPAA obligations;
health-record integration needs a covered entity or its business associate;
inferring a person's state is medical-device territory. A research brief
(October 2026) also found that the strongest evidence for fewer emergency visits
and hospital stays comes from programs with a clinical response loop, while peer
and online-community interventions have weak evidence on hard outcomes and
screening without a care pathway has not helped.

## Decision

1. **Three layers, each with an owner, obligations and permitted claims.**
   - *Layer 1, the core* — built by this project, open source: community, safety
     floor and moderation, journey pages, Visit Prep, crisis help.
   - *Layer 2, open standards* — written by this project, carried out by
     partners: an arrhythmia peer coach and session facilitator standard, live
     group sessions (the Hub), and member-initiated handoff of notes to a
     clinician.
   - *Layer 3, clinical care* — built and run only by licensed partners under
     their own licenses, privacy agreements and laws: therapy, health-record
     integration, clinical follow-up loops, and anything that infers state.
2. **The core's non-goals stay** (PRD §2.2): not telehealth, not a clinical
   record, no diagnosis or individualized medical advice, not an emergency
   service. One sentence there — that no clinical data is ever stored — must be
   amended to describe the private journal honestly (see Consequences). The
   safety floor governs the OneRhythm community space; clinical care a licensed
   partner offers sits outside it, under that partner's professional rules.
3. **Visit Prep's scope**, stated as testable properties:
   - *Two consents.* The journal is off until the member grants its own consent
     purpose (`visit_prep_journal`), unchecked by default and never required. AI
     help is a second purpose (`visit_prep_ai`). Both are checked in RLS and in
     the gateway, not only in the UI. Withdrawing the journal purpose stops new
     entries at once, offers an export, then — once the member confirms — deletes
     the journal.
   - *Access.* Journal rows are readable only where the owner is `auth.uid()`,
     or through a delegation the member has granted, stored as its own grant
     (separate ADR) — no moderator, admin, professional or coach policy. The AI
     gateway reads only the entries a consented, member-initiated request names,
     under the member's own session; unwrapping their key is a key-service
     permission scoped to that request. `service_role` access to these tables is
     break-glass: each use logs operator, time, table and row count, and
     short-retention access logs let affected members be identified for a breach
     notice. Vault-mode entries cannot be decrypted by operators.
   - *Data model.* No structured clinical fields (no diagnosis, medication, lab
     or ECG fields) and no inbound clinical integration (no FHIR reads, no device
     or record import, no uploads). Member-authored free text is consumer health
     data that may incidentally contain clinical detail; record-like pasted text
     triggers a warning and is excluded from AI requests. The AI never fills
     structured clinical sections.
   - *AI behavior.* The AI organizes the member's own words and never diagnoses,
     attributes symptoms to heart or mind, scores, infers anything from missing
     entries, gives medical advice, or acts as a therapist or companion. Every AI
     output is labeled.
   - *Crisis words.* The persistent help affordance is the safety control. The
     in-journal crisis nudge matches words and phrases on a published list, is
     best-effort, runs on the device or transiently in memory, shows resources
     only, and is never logged, scored or escalated.
   - *Sharing and deletion.* Sharing only by the member's explicit action.
     Deletion from the live service at once, with a published backup window.
     Per-member key destruction at deletion (crypto-shredding) is the intended
     way to make backup copies unreadable, provided each member's key is held
     outside the database backups; until a restore drill proves it, the
     published backup window is the promise.
4. **AI rules and the two floors.** Opt-in per purpose; disclosed, including
   which company runs the AI and what it keeps, with a preview of what will be
   sent; model-agnostic gateway (first adapter: Anthropic's Claude); published
   evals and red-team suite run before every release.
   - *Processor posture.* The AI provider is a processor under a written
     contract, not a recipient for its own purposes. The reference gateway will
     not enable a hosted provider until the operator records that its executed
     terms prohibit training and state its retention — an operator attestation,
     since code cannot read a contract; on-device and self-hosted models are
     exempt. A subprocessor inventory entry, a privacy-policy version bump and a
     DPIA come before the first call. Disclosure is permitted only for a
     consented, member-initiated request. The gateway keeps no memory or
     embeddings of journals and keeps content out of logs, traces and error
     reports; provenance records model, version and time bucket only.
   - *Best-effort measures, tested rather than floored.* The gateway strips names
     and contact details, caps length, and drops text that looks like a pasted
     record; Visit Prep shows crisis resources when listed words or phrases
     appear. These are heuristics that can miss, so they are published and
     tested under vision §8 rule 7 instead of being placed on a floor.
   - *A privacy floor beside the safety floor* — published, versioned, never
     votable. This list is canonical; the vision copies it word for word.
     Items 2, 5 and 7 carry the firm parts of vision §8 rules 1, 4 and 5.

     1. Consent comes before any health data is used.
     2. AI is optional and always disclosed.
     3. No sale of health data.
     4. No sharing of health data, except at the member's own request;
        with a processor that works only for us, with no use of its own,
        under contract; or where a valid legal order or reporting duty
        requires it.
     5. Journal text goes to an AI provider only on a request the member
        starts.
     6. No advertising or tracking code on health or signed-in pages.
     7. No training on member content, no member content in logs or AI
        memory, and no hosted AI without a contract that says so.
     8. The right to delete, except where a valid legal order or
        reporting duty requires data to be kept.
     9. Disclosures and holds under legal orders or reporting duties are
        counted in a public report, as far as the law allows.

   - *Additions to the safety floor:* the AI organizes and never interprets
     (rule 2); crisis help is one tap away on every screen (rule 3). In
     community spaces, self-harm and crisis posts go to trained humans and
     crisis resources, never to a vote. Nobody reviews private journals for
     crisis words, and no moderator or coach role can open one; there, the help
     button is the safety control.
   - *Two kinds of floor.* The safety floor governs content and product
     behavior; moderators and the release process enforce it. The privacy floor
     binds the operator; database rules, guards and, for provider contracts,
     operator attestations enforce it. Where they ever pull against each other
     in a community space, the priority order (safety, then access, then
     privacy) decides that case, and the decision is published with its reason.
     Such a ruling covers only that case, can never authorize opening a private
     journal or vault entry, and any lasting change goes through *Changing a
     floor*.
   - *Changing a floor.* Floors change only through VT Infinite, Inc., or a
     future steward under the same rule. In an emergency a floor can be
     tightened at once; otherwise every change is announced with its reason
     first. Loosening waits a published notice period, needs a new ADR and
     legal review, and is never put to a vote; a loosened privacy item applies
     only to data collected afterward, with fresh opt-in recorded in the
     consent ledger. Each item states the harm or legal basis behind it, and
     any member can ask for that basis to be re-examined in public.
5. **An advisory group for AI is a safety check, not a second vote.** It
   reports, against published tests, whether each AI feature meets both floors,
   with reasons; counsel checks the legal parts of the privacy floor. VT
   Infinite, Inc. decides whether a feature ships, may not ship one it finds
   breaks a floor, and says why in public if it ever ships against the group's
   finding. Whoever proposed the feature may ask for one re-review. After
   release the group may request a time-boxed, publicly reasoned pause; VT
   Infinite, Inc. decides what happens next and says why, in public. The group
   has no access to journals or AI inputs and outputs. It works from published
   test results, synthetic transcripts and reports members choose to send; any
   excerpt in a report is the member's choice each time, minimized, and deleted
   after review. It has no
   power over votes, budgets, rankings or elections. Precedence: the floors
   first, then Tier 1 votes (priority among features that meet the floors),
   then the group's pause requests, which the entity decides. Seats count
   equally, cannot be bought or sponsored, and are not held by anyone with a
   financial or institutional stake in what is reviewed; stakes are declared
   and checked. Selection (by lot or by equal-vote election) and terms are set
   in the governance charter. Until member voting opens, the first group is
   founder-chosen and works under the same rules, including the duty to give
   public reasons; it is replaced once members can choose how seats are filled.
   The charter also says who writes the published tests and how the group adds
   cases, and who screens proposals against the floors before a ballot, with
   public reasons and a way to redraft.
6. **Claims attach to layers.** The core may claim connection, access and
   preparation for visits. Claims about emergency visits, hospital use, cost or
   QALYs belong to Layer 3 and must be shown in partner-scale studies that also
   measure missed diagnoses and harm. Hypotheses H1–H6 in the vision document
   define what will be tested; results are published, including null results.
7. **Inference stays out of the core.** Any software that infers a person's
   state, flags distress, scores risk or attributes symptoms to heart or mind is
   Layer 3, built by a regulated manufacturer, with device-classification review,
   patient input that can change or stop the product, and response pathways in
   place before anything is detected. Those are the manufacturer's duties,
   separate from OneRhythm's advisory group.
8. **Peer coach credential.** Built on SAMHSA's National Model Standards for
   Peer Support Certification and existing certifications, with arrhythmia and
   device modules written with clinicians and people with lived experience, held
   by an independent credentialing body. No one-to-one or group coaching before
   the credential exists and a partner is ready to supervise. Elected community
   moderators may take the training, but it is never a condition for standing.
9. **Money buys no power.** No vote, seat, veto, or place on the roadmap.
   Organizations that fund the work are published by name, with amounts and
   conditions; individuals are counted, never named; badges, if any, are
   recognition only (ADR 0007 §6).
10. **The name.** A trademark policy, to be written with counsel, ties use of
    the OneRhythm name to keeping both floors and the adopter commitments in
    vision §11, under published criteria, with reasons, never dependent on
    payment.

## Consequences

- **"Nothing clinical, ever" cannot stand unchanged beside a free-text health
  journal.** Before Visit Prep is built, each of these changes, each as its own
  reviewed change:
  1. **PRD Amendment 3**, the repo's mechanism for scope changes. PRD §2.2 and
     §8 and Amendment 1 (no sharing of health data; no reliance on unguessable
     IDs) are authoritative today and conflict with Visit Prep and share links.
     Each new field needs a data-inventory and purpose-binding entry.
  2. **Statements and screens that would become false or incomplete:**
     CLAUDE.md non-negotiables #1 and #5; `README.md`; `SECURITY.md` ("no
     clinical dataset here to exfiltrate"); `src/lib/rights/export.ts`; the
     consent screens and Wireframes Addendum A; the delete-account panel copy
     and its tests; the Tier 2 list in `docs/PRODUCTION_READINESS.md`; the
     privacy-compliance skill and the privacy-reviewer agent, which must be
     updated carefully, not loosened.
  3. **`.claude/rules/privacy.md`:** replace "nothing clinical" with the testable
     rule in Decision 3; extend "never sold or shared" and "Stripe never joined"
     from health self-ID to all health data (journal, action record, consent
     state); add the processor exception to the HBNR bullet, with its
     conditions; bar third-party analytics on Visit Prep routes; bar inbound
     clinical integration.
  4. **`.claude/rules/db.md`:** new consent purposes, with
     `has_current_health_consent` taking a purpose; audit and provenance logs
     carry no member identifiers, while break-glass logs record operator, time,
     table and row count and short-retention access logs (period set in the data
     inventory) let affected members be identified for a breach notice; new tables repeat the `authenticated` REVOKE
     (see `docs/PRODUCTION_READINESS.md` §1.6); journal tables enter the
     authorization matrix; new tables join the export and deletion-cascade
     tests.
  5. **Guards:** `no-anon-policy-on-sensitive.sh` learns the new tables;
     `no-thirdparty-on-health.sh` also scans `supabase/functions/`, with AI,
     caption and video-provider domains allowed only from the gateway and Hub
     modules; `secrets-pii-scan.sh` learns AI-provider key shapes.
  6. **Schema:** journals in separate, owner-only tables with no publish column —
     never `journey_entries`, where one `is_published` flip would expose them.
  7. **`.claude/rules/governance.md`:** add the privacy floor and the
     safety-floor additions (Decision 4) as never votable, with the rule for
     changing a floor. The same change reaches PRD §6.4, CLAUDE.md
     non-negotiable #6 and the governance-rules skill, through
     governance-reviewer.
  8. **Separate ADRs** before build for the action record, caregiver delegated
     access, share links (including the compensating controls that justify an
     exception to Amendment 1's rule on unguessable IDs), and the Hub — each with
     its own consent purpose.
- **Visit Prep is a health-data feature** under CLAUDE.md non-negotiable #7.
  Legal review is build-blocking before it ships. It also needs a written
  safety case, a published AI test suite, and a signed processor contract.
- **PRD §6 must be amended before an advisory group is seated.** PRD §6.4 allows
  clinical input for safety-floor policy maintenance, not feature-by-feature
  review, and the floor additions in Decision 4 are new floor content. Both go
  through governance-reviewer.
- **Vision §14's stages sit alongside PRD §15's phases; they do not replace
  them.** Member voting (PRD Phase 3) is scheduled in Stage 2 so that members,
  not the founder, set priorities before the platform grows further.
- **Naming funders needs a ledger change.** ADR 0008's ledger records member
  support as counts only. Publishing funding organizations by name, with amounts
  and conditions, needs its own ledger section.
- **The pre-publication artifact list** in the vision document (§11) becomes the
  working definition of "ready for adopters."
- **Not decided here:** a license change (MIT vs Apache-2.0); the long-term
  steward; public journey pages; first jurisdictions; how advisory seats are
  filled; whether any earmarked funding is ever accepted; how OneRhythm responds
  to legal demands for member data (counsel to advise). All are recorded as
  open questions in the vision document (§15). Whoever the steward is, member
  contributions stay not tax-deductible unless counsel advises otherwise and a
  new ADR supersedes ADR 0007.
- **No code, schema, RLS, test or guard changes** come with this ADR.

## Alternatives considered

- **One global hosted service run by VT Infinite, Inc.** Rejected: it
  concentrates breach, legal and moderation risk on one operator and one
  maintainer, and it cannot meet different countries' laws from one deployment.
- **Building clinical services in-house.** Rejected: licensure, HIPAA, telehealth
  and malpractice obligations are beyond a non-clinical, volunteer-rooted
  project, and would pull the core across every line in PRD §2.2.
- **AI that infers members' state inside the core.** Rejected: it is diagnosis;
  it would likely be regulated as a medical device; group-level patterns do not
  reliably describe individuals; and noticing distress without a responder
  creates a duty the core cannot meet.
- **An AI advisory body with an open-ended veto.** Rejected in review: it would
  be a fourth authority outside the three governance tiers. The group is a
  safety check that can request a public, time-boxed pause.
- **No external AI in the core; on-device or self-hosted open-weight models as
  the default.** Considered seriously, since privacy ranks above sustainability
  and polish. Not adopted as the only path: the founder chose Anthropic's Claude
  as the first adapter, and the gateway keeps every deployment free to choose an
  on-device or self-hosted model instead. Hosted AI stays opt-in, behind its own
  consent and a processor contract, and Visit Prep works fully without it.
- **Keeping the vision private until funded.** Rejected by founder decision.

## Notes from source checking and review (27–28 October 2026)

- The vision's load-bearing figures were checked against publisher, journal,
  regulator or vendor sources before use. Its references section lists them.
- **The landing page's AF figures need a source.** `app/index.tsx` and ADR 0016
  record "anxiety 25.2% and depression 20.1% in AF: pooled prevalence" without
  naming the study, and the source could not be traced. The vision instead cites
  a 2024 meta-analysis of 26 studies (depression 22.0%, anxiety 13.0%, with very
  high heterogeneity and evidence of publication bias). Reconciling the landing
  copy is a separate change.
- **Entity wording that PR #1 does not cover.** These still describe VT
  Infinite, Inc. as a public benefit corporation. The privacy notice ships with
  the Tier 1 landing page and is legally operative text, so it must be fixed
  before the landing page deploys; the others before the repository is public:
  - `app/privacy-notice.tsx:126`;
  - `SECURITY.md:75`, which also says "donation-funded";
  - the confirmation-email footer,
    `supabase/functions/send-confirmation-email/index.ts:145`.
  PR #1 corrects `README.md`, `CLAUDE.md`, `app/index.tsx`,
  `docs/PRODUCTION_READINESS.md` and ADRs 0007, 0008 and 0016. Historical
  records that should carry a status note too: ADR 0010 (line 10, "PBC, d/b/a
  OneRhythm"), `.claude/plans/landing-page.md:235` and
  `.claude/plans/phase-1t-transparency.md:7, 79–80`. The vision document
  describes the company only as "VT Infinite, Inc., a Delaware corporation."
- **Review.** privacy-reviewer and governance-reviewer both failed the first
  draft (7 blocking findings and 1). Their re-checks on 28 October found one
  stale sentence left in Decision 4 (blocking for privacy-reviewer), a privacy
  floor whose wording would have banned the member's own sharing, and a
  collision between the safety floor and private journals; all were fixed in
  `3ad6c94`. A final pass against `3ad6c94` returned **PASS from both**, with
  wording items this version also applies:
  - no absolute claim that journals are "read by no one";
  - one canonical privacy-floor list, with an exception for legal orders and
    reporting duties, counted publicly;
  - the tie-break limited to community spaces, and unable to open a journal;
  - notice periods for floor changes;
  - loosened privacy items covering only data collected afterward, with fresh
    opt-in;
  - opt-in, minimized excerpts for the advisory group.
