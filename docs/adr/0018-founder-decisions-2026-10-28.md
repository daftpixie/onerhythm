# ADR 0018 — Sessions are never recorded; how advisory seats are filled

Status: Accepted — founder, 2026-10-28
Date: 2026-10-28
Relates: ADR 0017 (Decision 4, the floors and the rule for changing a floor;
Decision 5, the advisory group for AI); PRD Amendment 3 (§6.7, §6.8, §7.11);
`.claude/rules/governance.md`; `.claude/rules/privacy.md`.

## Context

PRD Amendment 3 recorded two questions as open founder decisions:

- whether "Sessions are never recorded" (vision §6.2) is a commitment;
- whether advisory-group seats are filled by lot or by election.

On 28 October 2026 the founder decided both.

## Decision

1. **Live sessions are never recorded.** Vulnerable conversations happen in
   them. This is added to the privacy floor as item 10:

   > 10. Live sessions are never recorded.

   It means no audio, video or transcript of a live session is kept by
   OneRhythm or by any processor. Captions are made live and not stored; a
   caption service under contract must keep no transcript, recorded by operator
   attestation from its signed terms (Amendment 3 §7.11).

   **This is a tightening** under ADR 0017 Decision 4. ADR 0017 requires a new
   ADR and a notice period only for loosening; a non-emergency tightening is
   announced with its reason first. This ADR, published before the change takes
   effect, and the `docs/SESSION_LOG.md` entry of 2026-10-28 are that
   announcement; the published floor page will carry it once it exists.
   Undoing it would be a loosening: a published notice period, a new ADR, legal
   review, never a vote.

2. **Advisory seats are proposed by the core founding team and chosen by member
   vote — one equal vote per eligible member.** Seats still count equally,
   cannot be bought or sponsored, and are not held by anyone with a financial
   or institutional stake in what is reviewed. Until member voting opens, the
   first group is founder-chosen and works under the same rules (ADR 0017
   Decision 5); it is replaced once members can vote.

## Consequences

- `.claude/rules/governance.md` lists item 10 after ADR 0017's nine canonical
  items, labelled as a 2026-10-28 tightening. ADR 0017's list is not edited: it
  is the record of what was accepted that day.
- `.claude/rules/privacy.md` states the rule; PRD Amendment 3 §7.11 and §6.8,
  Wireframes Addendum B (B25) and the Brand v3.1 addendum (§4) point here
  instead of calling these decisions open.
- How the core founding team proposes candidates, eligibility to stand, terms,
  and the ballot itself are set in the governance charter and pass
  governance-reviewer. Member voting does not exist yet (PRD Phase 3).
- No code, schema, RLS or test changes come with this ADR.
