# OneRhythm — PRD v1.0, Amendment 3
## Three layers, Visit Prep, and the two floors

**Status:** Authoritative addendum to OneRhythm PRD v1.0. Read alongside PRD
v1.0 and Amendments 1 and 2. It implements
[ADR 0017](../adr/0017-open-by-design-layered-architecture.md), accepted by the
founder on 28 October 2026, including the floor-change rules in its Decision 4.
**Origin:** ADR 0017's Decisions and Consequences, and the vision document
([`docs/vision/OneRhythm_Vision.md`](../vision/OneRhythm_Vision.md), v0.1). Where
this amendment and ADR 0017 differ, ADR 0017 governs and this amendment is the
bug.
**How to read this:** each block names the PRD section it changes. "Add" means
insert. "Replace" means the named text no longer applies. These are drop-in
blocks, not redlines.
**Companion:** [Wireframes Addendum B](OneRhythm_Wireframes_Addendum_B.md)
(Visit Prep, the crisis nudge, caregiver access, the Hub).

---

## Summary of what changes — stated honestly

PRD v1.0 promised that nothing clinical is ever stored. That was true while the
only health data was opt-in self-ID tags. Visit Prep is a private journal where a
member writes about their health in their own words. A journal like that will
sometimes hold clinical detail, however carefully it is designed. So the old
sentence cannot stand next to it.

This amendment replaces that sentence with a rule that can be tested: no
structured clinical fields, no inbound clinical integration, and every word a
member writes in the journal treated as consumer health data. The core stays
non-clinical. It still does not diagnose, read ECGs, give individual medical
advice, act as telehealth, keep a clinical record, or act as an emergency
service.

It also writes two floors into the PRD that no vote can change — the safety
floor, with two AI rules added, and a new privacy floor — and an advisory group
for AI that checks features against them.

**Nothing in this amendment is built.** No code, schema, RLS, test or guard
changes come with it.

### Binding gates (nothing below ships before these)

Visit Prep is a health-data feature under CLAUDE.md non-negotiable #7. Before
any part of it is built or shipped:

1. **The rule files change first, each as its own reviewed change.** Until then,
   `CLAUDE.md`, `.claude/rules/privacy.md`, `.claude/rules/db.md`,
   `.claude/rules/governance.md`, the guards, and the skills and reviewer agents
   stay in force as written. **Where they are stricter than this amendment, they
   win.** ADR 0017's Consequences list every file and statement that must
   change. They are to be updated carefully, not loosened.
2. **Separate ADRs** for the action record, caregiver delegated access, share
   links, and the Hub — each with its own consent purpose.
3. **A data-inventory and purpose-binding entry** for every new field
   (Amendment 1 §8.x).
4. **Legal review** of the scope in §16 below.
5. **A written safety case** for Visit Prep, with a hazard log.

And before any AI help is switched on, in addition:

6. **A published AI test suite and red-team results**, run before every
   release.
7. **A signed processor contract** for any hosted AI provider (§7.10.9).
8. **The advisory group's published check** (§6.8).

Visit Prep ships without AI first (vision §14, Stage 2).

---

## §2 — ADD "2.3 Three layers"

OneRhythm has three layers. Each has its own owner, its own duties, and its own
limits on what it may claim.

| | Layer 1: The core | Layer 2: Open standards | Layer 3: Clinical care |
|---|---|---|---|
| **What** | Community; safety floor and moderation; journey pages; Visit Prep; crisis help | An arrhythmia peer coach and session facilitator standard; live group sessions (the Hub); member-initiated handoff of notes to a clinician | Therapy; health-record integration; clinical follow-up loops; anything that infers a person's state |
| **Who builds and runs it** | This project, in the open | This project writes the standard; partners carry it out | Licensed partners only, under their own licenses, privacy agreements and laws |
| **Holds clinical records?** | No — and no deployment of the core may | No | Only in the partner's own systems, never in the core's database |
| **May claim** | Connection, access, preparation for visits | The above, plus trained support | Effects on symptoms, use of care and cost — once shown in partner-scale studies |

**Claims attach to layers (ADR 0017 Decision 6).** Claims about emergency
visits, hospital use, cost or QALYs belong to Layer 3. They must be shown in
partner-scale studies that also measure missed diagnoses and harm. Hypotheses
H1–H6 (vision §9.2) define what will be tested. Results are published, including
null results. The core and Layer 2 never make those claims.

**Inference stays out of the core (Decision 7).** Any software that infers a
person's state, flags distress, scores risk, or attributes symptoms to the heart
or the mind is Layer 3. It is built by a regulated manufacturer, with
device-classification review, patient input that can change or stop the
product, and response pathways in place before anything is detected. Those are
the manufacturer's duties, separate from OneRhythm's advisory group.

**Where the safety floor applies (Decision 2).** The safety floor governs the
OneRhythm community space. Clinical care that a licensed partner offers sits
outside it, under that partner's professional rules.

**Peer coaches (Decision 8).** The coach credential builds on SAMHSA's National
Model Standards for Peer Support Certification and existing certifications, with
arrhythmia and device modules written with clinicians and people with lived
experience, held by an independent credentialing body. No one-to-one or group
coaching starts before the credential exists and a partner is ready to supervise.
Elected moderators may take the training; it is never a condition for standing.

---

## §2.2 — REPLACE the second non-goal

Replace "**Not** a store of clinical data, medical records, lab values, or
ECG/device data — none of this is ever ingested or stored" with:

- **Not** a clinical record. The testable rule (ADR 0017 Decision 3):
  1. **No structured clinical fields.** No field anywhere in the core for a
     diagnosis, medication, lab value or ECG. The AI never fills structured
     clinical sections such as problems or medications.
  2. **No inbound clinical integration.** No FHIR reads, no device or record
     import, and no uploads into Visit Prep. (Amendment 2's community image
     pipeline is unchanged, including its permanent ban on medical imagery and
     on documents, PDFs and video.)
  3. **Member-authored free text is consumer health data.** It may incidentally
     contain clinical detail. The whole Visit Prep journal is treated as health
     data. Text that looks like a pasted record triggers a warning and is
     excluded from AI requests.

Health self-ID tags (§7.1) are unchanged: opt-in labels for finding communities,
under their own consent. They are not clinical records.

Every other non-goal in §2.2 stands as written: not medical advice, diagnosis or
ECG interpretation; not a HIPAA-covered clinical system; not crypto, token or
DAO; not telehealth or patient–provider messaging; not an emergency service.

---

## §8 — REPLACE the data-minimization and FTC HBNR bullets

Replace "**Data minimization:** store only account, role, self-ID tags, content,
votes, journey pages. **Never** store ECG/clinical/records data …" with:

- **Data minimization.** Store only account, role, self-ID tags, content, votes,
  journey pages, and — only under its own consent — the Visit Prep journal
  (§7.10). Every field has a data-inventory and purpose-binding entry before it
  exists. The §2.2 rule applies everywhere: no structured clinical fields, no
  inbound clinical integration. Amendment 2's upload rules are unchanged.

Replace the FTC Health Breach Notification Rule bullet with:

- **FTC Health Breach Notification Rule.** Never disclose health data to third
  parties for their own purposes — advertising, analytics or anything else. Such
  a disclosure is itself a reportable breach. The one exception is a
  **processor**: a company that works only for us, with no use of its own, under
  a written contract (§7.10.9). A processor receives health data only for a
  consented, member-initiated request. Counsel confirms the reporting duties
  (§16).

ADD to §8:

- **"Health data" now means all of it.** "Never sold or shared" and "Stripe data
  is never joined" extend from health self-ID to all health data: self-ID tags,
  the Visit Prep journal and anything made from it, the action record, and
  consent state. The only sharing is the member's own action (§7.10.7), a
  processor under contract, or a valid legal order or reporting duty (privacy
  floor item 4).
- **Washington MHMDA.** Consent to collect is separate from consent to share.
  Each Visit Prep sharing path is the member's own action, made for that one
  share.
- **No third-party analytics on Visit Prep, Hub, caregiver-access or
  share-link viewer routes**, of any kind, cookieless or not (§11).
- **Search never indexes journals.**

## Amendment 1 §8.x — REPLACE two bullets

- Replace "Even though OneRhythm stores no clinical/ECG data, the opt-in
  diagnosis and symptom tags **are** 'consumer health data'" with: "The opt-in
  diagnosis and symptom tags **are** consumer health data under Washington MHMDA
  (and special-category data under GDPR). So is the Visit Prep journal (§7.10).
  Every obligation below applies to both."
- Replace "**No new sharing surface.** OneRhythm does not sell or share health
  data; 'sharing consent' is therefore moot by design" with: "**Sharing only at
  the member's action.** OneRhythm never sells health data. It shares health
  data only when the member acts to share it (print, PDF, a share link, a
  caregiver grant), with a processor under contract, or under a valid legal
  order or reporting duty. Each sharing path is recorded in the consent ledger
  and the privacy notice."

---

## §7 — ADD "7.10 Visit Prep"

A private journal that belongs to the member. They write in their own words —
about their body, their mind, their sleep, their days. When a visit is coming,
Visit Prep helps them turn their notes into a short summary and a list of
questions to bring. Layer 1. Status: *Planned*.

### 7.10.1 Two consents

- **`visit_prep_journal`** turns the journal on. It is unchecked by default and
  never required to belong.
- **`visit_prep_ai`** turns AI help on. It is a second, separate purpose, also
  unchecked by default. It can be granted only while `visit_prep_journal` is
  current.
- Both are rows in the consent ledger (Amendment 1 §12.1). Both are checked in
  RLS and in the AI gateway, not only in the UI.
- **Withdrawing `visit_prep_journal`** stops new entries at once, offers an
  export, and then — once the member confirms — deletes the journal. It also
  withdraws `visit_prep_ai`, ends caregiver grants, and turns off share links.
  Until the member confirms, the withdrawn journal stays owner-only and
  read-only. **Open for the build ADR and counsel, and must be bounded before
  build:** how long a withdrawn, unconfirmed journal is held before the member
  is reminded or it is deleted.
- **Withdrawing `visit_prep_ai`** stops any further AI request at once.
- The `visit_prep_ai` consent records which provider it was given for, and the
  version of that provider's recorded terms. A change of provider, of its
  retention terms, or of the privacy policy asks the member to consent again
  before the next request.

### 7.10.2 Works fully without AI

Simple prompts and a printable template are always there. No step of Visit Prep
needs AI. A member who never turns AI on loses nothing but the AI.

### 7.10.3 Who can read a journal

- Journal rows are readable only where the owner is `auth.uid()`, or through a
  delegation the member has granted, stored as its own grant (its own ADR).
- There is **no** moderator, admin, professional or coach policy on these tables.
  No screen or role lets a coach, moderator, other member or staff member open a
  journal.
- The AI gateway reads only the entries a consented, member-initiated request
  names, under the member's own session. Unwrapping the member's key is a
  key-service permission scoped to that request.
- **`service_role` access is break-glass.** Each use logs operator, time, table
  and row count. Short-retention access logs (period set in the data inventory)
  let affected members be identified for a breach notice. Audit and provenance
  logs otherwise carry no member identifiers.
- **Encryption at rest** with a separate data key for each member, wrapped by a
  key in a key service the operator runs. Timestamps and entry counts are not
  encrypted.
- **Vault mode** (optional): the key stays with the member, and operators cannot
  decrypt entries. Vault mode turns off AI help, share links we create, and
  caregiver access. A lost key cannot be recovered, and the screen says so
  plainly at the moment of choice.

### 7.10.4 Data model

- Journals live in their own owner-only tables with **no publish column** —
  never in `journey_entries`, where one `is_published` flip would expose them.
- The §2.2 rule: no structured clinical fields, no inbound clinical integration,
  no uploads. Members are asked not to paste records in.
- New tables repeat the `authenticated` REVOKE (`docs/PRODUCTION_READINESS.md`
  §1.6), enter the authorization matrix (Amendment 1 §13), and join the export
  and deletion-cascade tests. The deletion-cascade tests also cover the AI
  processor (§7.10.8).

### 7.10.5 What the AI does and never does

- **It organizes the member's own words** into a summary and suggests ways to
  phrase questions.
- **It never** diagnoses; attributes symptoms to the heart or the mind; scores
  anything; infers anything from missing entries; gives medical advice; or acts
  as a therapist or companion.
- **Every AI output is labeled:** written by the member, organized by AI at their
  request, not reviewed by a clinician. The exact label strings are in Brand
  v3.1 Addendum §1.1.
- **The member sees what will be sent before it goes**, and picks which entries.
  Nothing is sent until they press a button. The preview is made by our own
  gateway, never by the provider or any other third party, and shows the text
  after name removal and the length cap, including entry dates if they are
  sent. The example on the AI consent screen, shown before `visit_prep_ai`
  exists, is made on the member's device with no gateway call. A test asserts that the preview and the outbound request are
  identical, byte for byte.
- Retrieval, if any, is from vetted patient-education sources only, never from
  journals.
- **Best-effort measures, tested rather than floored.** Before sending, the
  gateway strips names and contact details, caps length, and drops text that
  looks like a pasted record. These are heuristics that can miss. They are
  published and tested under vision §8 rule 7, not placed on a floor.
- **Model-agnostic gateway.** Each deployment chooses its provider, including
  on-device or self-hosted models. The first adapter is for Anthropic's Claude.

### 7.10.6 Crisis words

> If you are struggling right now: in the US, call or text **988**. In an
> emergency, call your local emergency number.

- **The persistent help affordance (🆘) is the safety control.** It stays on
  every Visit Prep screen whether or not the nudge below appears.
- **The in-journal crisis nudge** matches words and phrases on a published list.
  When one appears, it shows crisis resources straight away.
- It is **best-effort.** It runs on the device, or transiently in memory on the
  server.
- It **shows resources only.** It is never logged, scored or escalated. It tells
  no one: no alert, no review, no analytics event. When it runs on the server,
  that path writes no content to logs, traces or error reports, and its
  requests are kept out of request, CDN and firewall logs, so nothing records
  that a nudge was shown. The member-facing wording ("We kept no record of
  this") is tested against that. It does not
  counsel.
- **Nobody reviews private journals for crisis words**, and no moderator or
  coach role can open a journal.
- Counsel confirms that showing fixed resources on listed words is not
  inference (vision §7.4; §16 below).

### 7.10.7 Sharing — only at the member's action

- **Print or save a PDF.** Always available.
- **Share link or QR code** (Planned; its own ADR). An expiring link a clinic can
  open, under the compensating controls in the Amendment 1 exception below.
- **Caregiver access** (Planned; its own ADR; invitations never mention Visit
  Prep or health). Read-only, specific items only,
  ends unless renewed, shown to the member each time it is used, ended in one
  step, recorded in the consent ledger. A caregiver can never change consents,
  turn on AI, share for the member, delete anything, or vote for the member. Not
  available in vault mode.
- **Handoff to a clinician** is a Layer 2 open standard. It sends only what the
  member chooses, only when they choose. OneRhythm receives nothing back.
- Nothing is sent to anyone automatically.

### 7.10.8 Deletion and backups

- A member can delete any entry, or the whole journal, at any time. It leaves the
  live service **at once**.
- **Backups age out on a published backup window.** That window is not set yet;
  a written, tested position on it is a Stage 1 gate (vision §14).
- **Per-member key destruction at deletion** (crypto-shredding) is the intended
  way to make backup copies unreadable, provided each member's key is held
  outside the database backups. **Until a restore drill proves it, the published
  backup window is the promise.**
- **Deletion reaches the AI processor.** Where AI help was used, deletion
  follows the processor's executed terms: with zero data retention there is
  nothing held to delete; otherwise the deletion is passed to the processor, or
  its stated retention period runs out. The delete screen names the provider and
  says what it may still hold, and for how long.
- Anything the member printed, saved or shared is outside our reach, and the
  delete screen says so.
- Deletion of the account cascades to journal tables, summaries, share-link
  payloads, the action record and delegation grants, and the deletion-cascade
  tests assert it.
- `.claude/rules/privacy.md` says deletion must cascade to backups, replicas
  and subprocessors. The backup window and the processor's stated retention
  above are weaker than that. Until the rule-file change records them, with
  counsel's review, the stricter rule wins (binding gate 1).

### 7.10.9 The AI provider is a processor

From ADR 0017 Decision 4:

- **The AI provider is a processor under a written contract**, not a recipient
  for its own purposes.
- **The reference gateway will not enable a hosted provider** until the operator
  records that its executed terms prohibit training and state its retention.
  That is an operator attestation, since code cannot read a contract. On-device
  and self-hosted models are exempt.
- Before the first call: a subprocessor inventory entry, a privacy-policy version
  bump, and a DPIA.
- **Disclosure only for a consented, member-initiated request.**
- The gateway keeps **no memory or embeddings** of journals, and keeps content
  out of logs, traces and error reports. Provenance records model, version and
  time bucket only — no member identifier, no content.
- We contract for zero data retention where a provider offers it, and list what
  each provider keeps (vision §8 rule 5).
- The consent screen names the company that runs the AI and what it keeps.

### 7.10.10 Export and what we measure

- Journal entries and AI-organized summaries are in the member's data export.
- Shared summaries use plain narrative headings ("What I noticed", "Questions I
  want to ask"). The planned interoperable format is a FHIR R4
  QuestionnaireResponse with free-text answers in the member's own words, no
  derived scores, and a Provenance record stating "patient-authored; organized
  by AI at the member's request; not clinically reviewed" (vision Appendix A.3).
- **What we measure** is hypothesis H2: whether members take part more in their
  care and rate their visits better, whether clinicians find summaries useful,
  and whether visits get longer. **Visit Prep makes no claim about emergency
  visits.** On its own, it has no responder.

## §7 — ADD "7.11 The Hub — live group sessions"

Layer 2. Status: *Planned*. Needs its own ADR and consent purpose before build,
and does not launch before trained facilitators and a supervising partner exist
(Decision 8). From vision §6.2:

- A shared schedule of regular sessions led by trained facilitators. **Two
  trained facilitators in every session**, with a written crisis plan.
- **Captions on every session**, by a speech service under contract (no
  training, no transcript kept) or by software the deployment hosts. Members are
  told how captions work before they join.
- **A phone dial-in and an audio-only option.** OneRhythm does not store dial-in
  phone numbers. The telephone provider, a contracted processor, sees the
  caller's number, as with any phone call.
- Times shown in each member's own time zone. **Reminders never name a condition
  or topic** — just "Your session starts in 15 minutes." Email and push
  providers are processors; subject lines and bodies stay generic.
- **Saved seats are health data.** A seat in "Living with a device" says
  something about a member's health. Seats fall under the Hub's own consent
  purpose, are never joined to Stripe, and never reach analytics.
- **Captions and consent.** Captions are on by default, because access ranks
  above privacy. Member speech still reaches a caption processor unless the
  deployment hosts captions itself. The Hub ADR must record how that is
  consented to — for example, the told-before-joining screen plus "Join" as the
  recorded consent — or prefer self-hosted captions. It is not decided here.
  "Keeps no transcript" must come from the caption service's signed terms,
  under the same operator-attestation rule as the AI provider (§7.10.9).
- **For the Hub ADR, so that timing cannot name a topic:** reminder send times,
  the dial-in number and meeting codes, and the sender name should not reveal
  which session a member saved; push services (Apple, Google) are reviewed as
  processors against privacy floor item 4.
- Screen-sharing and file-sharing are off for members.
- Open-source video software, hosted by the deployment or the partner, never as a
  third-party embed.
- **Sessions are never recorded** — no audio, video or transcript is kept by us
  or any processor. Decided by the founder on 2026-10-28 and added to the
  privacy floor as item 10, a tightening ([ADR 0018](../adr/0018-founder-decisions-2026-10-28.md)).
- Group therapy is not peer support. It belongs to Layer 3.

---

## §6.4 — ADD to the safety floor

Add to the Tier 3 list:

- **The AI organizes and never interprets** (vision §8 rule 2). No diagnosis, no
  attribution of causes, no scores, no medical advice; not therapy; not a
  companion.
- **Crisis help is one tap away on every screen** (vision §8 rule 3).

Replace "Self-harm/suicide crisis content → routed to support resources and human
review, never to a vote" with:

- **In community spaces**, self-harm and crisis posts go to trained humans and
  crisis resources, never to a vote. Routing a post with crisis language to a
  trained human is moderation, not inference. **Nobody reviews private journals
  for crisis words, and no moderator or coach role can open one; there, the help
  button is the safety control.**

ADD after the list:

- The safety floor governs the OneRhythm community space. Clinical care a
  licensed partner offers sits outside it, under that partner's professional
  rules.
- The volunteer clinical advisory input described above is policy maintenance
  for the medical-misinformation rules. It is not feature-by-feature AI review.
  That is the advisory group's job (§6.8).
- The safety floor changes only under §6.7's rule for changing a floor.

---

## §6 — ADD "6.7 The privacy floor (never subject to any vote)"

A privacy floor sits beside the safety floor. It is published, versioned, and
never votable. This list is copied word for word from ADR 0017 Decision 4, which
is canonical:

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

**Two kinds of floor.** The safety floor governs content and product behavior;
moderators and the release process enforce it. The privacy floor binds the
operator; database rules, guards and, for provider contracts, operator
attestations enforce it.

**When they collide.** Where the two floors ever pull against each other in a
community space, the priority order (safety, then access, then privacy) decides
that case, and the decision is published with its reason. Such a ruling covers
only that case. It can never authorize opening a private journal or vault entry.
Any lasting change goes through the rule for changing a floor. Collision
rulings, like the advisory group's findings and pause decisions (§6.8), are
ordinary, deletable-where-required governance records that carry no member
data.

**Changing a floor** (ADR 0017 Decision 4, accepted with it). This applies to
both floors:

- Floors change only through VT Infinite, Inc., or a future steward under the
  same rule.
- In an emergency, a floor can be tightened at once.
- Otherwise every change is announced with its reason first.
- Loosening waits a published notice period, needs a new ADR and legal review,
  and is never put to a vote. (ADR 0017 does not set the period's length. The
  governance charter or the rule-file change sets it.)
- A loosened privacy item applies only to data collected afterward, with fresh
  opt-in recorded in the consent ledger.
- Each item states the harm or legal basis behind it, and any member can ask for
  that basis to be re-examined in public.

## §6.2 — ADD to Tier 1

- **Feature prioritization chooses only among features that meet both floors.**
  Members vote on which AI features to build and in what order. Who screens
  proposals against the floors before a ballot — with public reasons and a way to
  redraft — is set in the governance charter. **No feature ballot opens until the
  charter names the screener.**

---

## §6 — ADD "6.8 The advisory group for AI — a safety check, not a second vote"

- **What it does.** It reports, against published tests, whether each AI feature
  meets both floors, with reasons. Counsel checks the legal parts of the privacy
  floor.
- **Who decides.** VT Infinite, Inc. decides whether a feature ships. It may not
  ship a feature it finds breaks a floor. If it ever ships one against the
  group's finding, it says why, in public.
- **One re-review.** Whoever proposed the feature may ask for one re-review.
- **After release.** The group may request a time-boxed, publicly reasoned pause.
  VT Infinite, Inc. decides what happens next and says why, in public. (Still
  open, vision §15.8: how long a pause lasts, and how members ask the group to
  look at a feature.)
- **Precedence:**
  1. the floors;
  2. Tier 1 votes — priority among features that meet the floors;
  3. the group's pause requests, which the entity decides.
- **No access.** The group has no access to journals or to AI inputs and
  outputs. It works from published test results, synthetic transcripts, and
  reports members choose to send. Any excerpt in a report is the member's choice
  each time, minimized, and deleted after review.
- **No other power.** None over votes, budgets, rankings or elections.
- **Seats.** Seats count equally. They cannot be bought or sponsored, and are not
  held by anyone with a financial or institutional stake in what is reviewed;
  stakes are declared and checked. Members include people living with these
  conditions and people who care for them, with clinicians advising. No one has
  to share a diagnosis to serve.
- **Selection.** Seats are proposed by the core founding team and chosen by
  member vote, one equal vote each (founder decision, 2026-10-28;
  [ADR 0018](../adr/0018-founder-decisions-2026-10-28.md)). How candidates are
  proposed, eligibility to stand, and terms are set in the governance charter.
- **The interim group.** Until member voting opens, the first group is
  founder-chosen and works under the same rules, including the duty to give
  public reasons. It is replaced once members can choose how seats are filled.
- **The charter also says** who writes the published tests and how the group adds
  cases.
- **Order.** This section is the PRD §6 amendment that ADR 0017 requires before
  any group is seated. It needs governance-reviewer before it takes effect.

---

## Amendment 1 §13 — ADD an exception to "no reliance on unguessable IDs"

Amendment 1 says no fetch path may rely on unguessable IDs for security. **Share
links are the one exception.** A share link is a bearer link: whoever holds it
(and the passcode) can read the summary until it expires. The exception exists
because a clinic must be able to open a summary without an account.

It is allowed only with all of these compensating controls (vision Appendix
A.3):

- The payload is **encrypted on the member's device**, with the key carried in
  the link itself.
- A **passcode is on by default.**
- The **default expiry is short.** The member picks how long it lasts.
- The member can **revoke it at any time. Revoking deletes the payload.**
- Requests are **rate-limited.**
- The viewer page **sends nothing to third parties.**
- **No view log is tied to the member.**
- Share links are **only ever made by the member's action**, and are not
  available in vault mode for links we create. Each one is recorded in the
  consent ledger, and the member sees a list of exactly what it includes before
  making it.

- The screen tells the member plainly: anyone with the link and the passcode can
  read it until it expires, so share it the way you would hand over paper.

For the share-link ADR to confirm, as ways of meeting those controls:

- the key sits in the URL fragment, so it never reaches our server;
- the QR code is made on the member's device, with no network call — the link
  is never sent to a QR service;
- the viewer sends no referrer, and shows no member name;
- an expired link's payload is deleted, as a revoked one is;
- passcode attempts are rate-limited, with the passcode length set to resist
  guessing;
- rate-limit counters are kept briefly and never linked to the member.

The exception covers only the share-link viewer. Every other path stays bound by
Amendment 1. The share-link ADR must record these controls and add the viewer to
the authorization matrix before anything is built.

---

## §10 — REPLACE "Funding & payments" with "Member support and funding"

- **Vocabulary.** Say "member support" and "contributions", never "donations",
  in product copy. OneRhythm is an initiative of VT Infinite, Inc. It is not a
  501(c)(3) and not a charity. **Contributions are not tax-deductible.** Any
  change needs counsel's advice and a new ADR that supersedes ADR 0007.
- **Web only, via Stripe** (unchanged). Mobile apps ship with no in-app
  fundraising UI and link out (unchanged; see Amendment 1).
- Replace "If incorporated as 501(c)(3): pursue Stripe nonprofit rate and store
  nonprofit donation paths" with: "Nonprofit rates and store fundraising paths
  are not available to OneRhythm as it stands (Amendment 1)."
- **Money buys no power** (ADR 0017 Decision 9). No vote, seat, veto, or place on
  the roadmap. Funding buys no access to member data, no influence over content,
  no say in what members vote on, and no seat on the advisory group or with
  whoever keeps the floors.
- **Funders are named.** Organizations that fund the work are published by name.
  ADR 0017 Decision 9 also says "with amounts and conditions". **The founder has
  listed publishing amounts as an open decision; this amendment records ADR
  0017's wording and does not settle it.** Naming organizations needs its own
  ledger section, because ADR 0008's ledger records member support as counts
  only. That section holds organization names only — never individuals and
  never health data — and is deletable where required (`.claude/rules/db.md`).
- **Organizations are named only with their recorded agreement.** A sole
  proprietor or a fund named after a family is treated as an individual. The
  funder list is never joined to members' Stripe records.
- **Individuals are counted, never named.** Badges, if any, are recognition only
  (ADR 0007 §6).
- **Stripe data is never joined to any health data** (§8 above), including the
  journal and the action record.
- The action record is never used to ask for contributions.
- **Earmarked funding** — whether money tied to specific work is ever accepted —
  is an open founder decision.

## §4, §6.3, §7.7, §15 — vocabulary

Read "donations" as "member support" and "donor" as "member who contributes"
throughout. The meaning of each requirement is unchanged.

## §11 — ADD to analytics

- **No third-party analytics on Visit Prep, Hub, caregiver-access or share-link
  viewer routes**, of any kind — including analytics a host can inject on its
  own (for example, a web-analytics beacon added by the hosting platform). The
  host itself is a processor and is listed in the subprocessor inventory.
- **No analytics event ever records** journal content, a crisis-nudge display,
  an AI request tied to a member, or the action record.
- Analytics events are never tagged with any health data (extends "never tag
  events with diagnosis/symptom").

---

## §15 — ADD "Gated stages, alongside the phases"

The vision's stages (vision §14) sit **alongside** the phases below. They do not
replace them. Stages have gates, not dates.

| Vision stage | Gate | PRD phases it draws on |
|---|---|---|
| **Done** | — | Phase 1 (web MVP) |
| **Stage 1 — Open the door.** Correct public copy on the company's legal status, then publish the code; landing page live (no member data); moderation core and the published safety floor; manual screen-reader review; engage a healthcare-privacy attorney; first vision §11 artifacts | Attorney review complete; a standalone consumer health data privacy policy published; a written, tested position on how long backups keep deleted data; a decision on which countries to open in; moderation core live; screen-reader review passed | Phase 0 (legal), Phase 2 (moderation and safety) |
| **Stage 2 — The interval.** Open the member platform; member voting; amend PRD §6 (this amendment) and seat the first advisory group; Visit Prep without AI, then opt-in AI after its gates; draft the peer-coach standard and pilot Hub sessions; a first evaluation with partner clinics (H1–H3) | Member voting live; safety case accepted; advisory group seated; evaluation protocol registered before anyone enrolls | Phase 3 (governance — scheduled here so members, not the founder, set priorities before the platform grows), plus §7.10 |
| **Stage 3 — The bridge.** Licensed partners run therapy, clinical response loops, clinician handoff and health-record links; partners run the H4–H6 studies | For each partner: licensure, privacy agreements and clinical governance in place, and a medical-device review for anything that infers a person's state | None — Layer 3 is outside the core's phases |

Phases 2M (media), 4 (funding), 5 (mobile) and 6 (scale) are not placed in a
stage by the vision. Their own gates are unchanged.

---

## §16 — ADD legal-review scope (the attorney checklist grows)

From ADR 0017 and the vision's regulatory map (Appendix B), for counsel to
confirm. This is our understanding, not legal advice.

- **Visit Prep, with or without AI.**
  - That it stays on the non-device side of FDA's policy on software that helps
    patients organize their health information and communicate with providers.
  - The FTC Health Breach Notification Rule; Washington MHMDA and similar state
    laws (consent to collect, separate consent to share, processor contracts);
    CCPA/CPRA sensitive personal information; GDPR Article 9 where deployed.
  - State laws on AI in mental health care (for example, Illinois). Visit Prep is
    designed as neither therapy nor treatment.
  - That the crisis-word nudge (fixed resources on listed words, nothing stored)
    and routing community crisis posts to a trained human are not inference.
  - Whether Section 230 extends to text our own AI generates.
  - The backup window and the deletion promise (§7.10.8).
- **The AI processor.**
  - Processor contract terms: no training, stated retention, zero data retention
    where offered, and what the provider may still keep by law or for abuse
    investigation.
  - The subprocessor entry, the privacy-policy version bump, and the DPIA.
  - A lawful transfer mechanism for any provider outside the EU, and EU AI Act
    Article 50 disclosure, where deployed.
  - The operator attestation the gateway relies on.
- **Share links.**
  - The bearer-link exception to Amendment 1 and its compensating controls.
  - Whether a share link is "sharing" under MHMDA and similar laws, and what
    consent it needs.
  - What the member is told before making one.
- **Age.**
  - The adults-only age policy is an **open founder decision**. Counsel to advise
    on children's data laws and on how young people living with arrhythmia, and
    their families, could be served.
- **Legal demands for member data.**
  - What must be produced under a subpoena or court order, and how members are
    told.
  - How privacy floor items 4, 8 and 9 apply, and what the public report can
    count.
- **Also in scope:**
  - caregiver delegated access;
  - Hub caption, video and dial-in vendors as processors;
  - the trademark and name-use policy (ADR 0017 Decision 10);
  - naming funding organizations.

---

## Deliberately unchanged (recorded so no one "helpfully" drifts them)

- No diagnosis, ECG interpretation or individualized medical advice anywhere, by
  anyone, including by AI.
- Not telehealth, not an emergency service, not a HIPAA-covered clinical system.
- No documents, PDFs, office files, archives or video — ever. No medical
  imagery — ever. Amendment 2 is unchanged.
- Health self-ID stays opt-in, unchecked by default, and never required.
- Upbeats only; no downvote state anywhere.
- One equal vote per eligible member; the eligibility gate; quorum;
  conflict-of-interest rules; governance off-chain.
- No advertising or tracking code on health or signed-in pages.
- Stripe on the web only; nothing is ever gated by payment.
- The safety floor's existing items.
- `CLAUDE.md`, the rule files, guards, skills and reviewer agents — until each is
  changed by its own reviewed change. Where they are stricter, they win.
- PRD §1, including the line naming the founder's diagnosis.
- The open founder decisions: earmarked funding; MIT or Apache-2.0; the
  long-term steward; the adults-only age policy; whether funders are named with
  amounts. (How advisory seats are filled, and that sessions are never recorded,
  were decided on 2026-10-28 — ADR 0018.)

*Tradeoff order unchanged: safety > access > privacy > genuine governance >
sustainability > polish.*
