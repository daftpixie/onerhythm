# Governance rules — three tiers, two floors, off-chain

Sources: PRD §6 as amended by Amendment 3 (§6.4, §6.7, §6.8); ADR 0017
(accepted 2026-10-28); ADR 0018 (founder decisions of 2026-10-28).

- Tier 1 (Community-Binding): feature prioritization, guidelines, moderator
  elections, new community creation, non-safety appeals. Binding within both
  floors. Feature ballots choose only among features that meet both floors; no
  feature ballot opens until the governance charter names who screens proposals
  against the floors (public reasons, a way to redraft).
- Tier 2 (Community-Directed, Entity-Executed): participatory budgeting over the
  discretionary community-directed budget on a transparent treasury dashboard.
  Binding within guardrails; entity executes unless illegal/unsafe/fiscally
  reckless/conflict-of-interest, and any override is PUBLICLY justified.
- Tier 3 (Safety Floor, NEVER votable): dangerous medical misinformation,
  ECG/diagnosis interpretation, self-harm/crisis, illegal content, harassment,
  doxxing, clinician impersonation, CSAM, spam, scams — plus, from ADR 0017:
  - the AI organizes and never interprets;
  - crisis help is one tap away on every screen.

  **In community spaces**, self-harm and crisis posts go to trained humans and
  crisis resources, never to a vote. Nobody reviews private journals for crisis
  words, and no moderator or coach role can open one; there, the help button is
  the safety control. The safety floor governs the OneRhythm community space;
  clinical care a licensed partner offers sits outside it. Published,
  version-controlled, explained.
- **The privacy floor (NEVER votable).** Items 1–9 are ADR 0017 Decision 4's
  canonical list, word for word. Item 10 was added on 2026-10-28 as a
  tightening (ADR 0018).
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
  10. Live sessions are never recorded. (No audio, video or transcript is kept
      by OneRhythm or any processor; captions are live and not stored, and a
      caption service's no-transcript term is recorded by operator attestation.)
- **Two kinds of floor.** The safety floor governs content and product behavior;
  moderators and the release process enforce it. The privacy floor binds the
  operator; database rules, guards and, for provider contracts, operator
  attestations enforce it. Where they pull against each other in a community
  space, safety, then access, then privacy decides that case, published with its
  reason. Such a ruling covers only that case, can never authorize opening a
  private journal or vault entry, and any lasting change goes through the rule
  below. Collision rulings, advisory findings and pause decisions are ordinary
  governance records, deletable where required, with no member data.
- **Changing a floor** (ADR 0017 Decision 4). Only VT Infinite, Inc., or a
  future steward under the same rule. In an emergency a floor can be tightened at
  once; otherwise every change is announced with its reason first. Loosening
  waits a published notice period (ADR 0017 does not set its length; the
  governance charter or a rule-file change does), needs
  a new ADR and legal review, and is NEVER put to a vote. A loosened privacy item
  applies only to data collected afterward, with fresh opt-in recorded in the
  consent ledger. Each item states the harm or legal basis behind it; any member
  can ask for that basis to be re-examined in public.
- **The advisory group for AI is a safety check, not a second vote** (Amendment
  3 §6.8). It reports against published tests whether each AI feature meets both
  floors; counsel checks the legal parts of the privacy floor. VT Infinite, Inc.
  decides, may not ship a feature it finds breaks a
  floor, and says why in public if it ships against the group's finding. One
  re-review. Time-boxed, publicly reasoned pause requests. No access to journals
  or AI inputs and outputs; it works from published tests, synthetic transcripts
  and reports members choose to send, with any excerpt the member's choice each
  time, minimized, and deleted after review. No power over votes, budgets, rankings or elections.
  Precedence: the floors, then Tier 1 votes, then pause requests. **Seats** are
  proposed by the core founding team and chosen by member vote, one equal vote
  each (ADR 0018); they count equally, cannot be bought or sponsored, and are not
  held by anyone with a financial or institutional stake in what is reviewed;
  stakes are declared and checked. No seat ballot opens until the governance
  charter sets how candidates are proposed, eligibility to stand, and terms.
  Until member voting opens, the first group is founder-chosen under the same
  rules and is replaced once members vote.
- **Money buys no power:** no vote, seat, veto or place on the roadmap.
- Voting: ONE EQUAL VOTE per eligible member (never weighted by reputation,
  member support, or tenure). Anti-sybil eligibility gate (account age + min
  participation). Published quorum. Time-boxed cycles. Full public transparency.
  Conflict-of-interest enforced at the DB level. Ballots meet WCAG 2.2 AA.
- OFF-CHAIN by deliberate decision: wallets/tokens are an accessibility
  catastrophe here; token weighting is plutocratic; tokens invite securities
  risk; immutable ledgers cannot honor the legal right to deletion. Governance
  is ordinary, auditable, DELETABLE database records.
