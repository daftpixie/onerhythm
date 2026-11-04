---
name: governance-rules
description: Triggers on ballot, treasury, proposal, voting, moderation-tier, or floor work. Enforces three-tier governance and two-floor invariants.
---

# Governance Rules Checklist

Apply to any change touching ballots, proposals, treasury, voting, moderation
tiers, or community creation.

## One-equal-vote
- [ ] Every eligible member gets exactly one vote per proposal.
- [ ] Vote is NEVER weighted by reputation, donation amount, or tenure.
- [ ] `unique(proposal_id, voter_id)` constraint enforced at the DB level.
- [ ] CHECK constraints enforce valid ballot choices.

## Eligibility gate
- [ ] Anti-sybil: account age + minimum participation threshold required.
- [ ] Eligibility criteria are published and version-controlled.

## Quorum & transparency
- [ ] Published quorum threshold for each proposal type.
- [ ] Time-boxed voting cycles with clear start/end.
- [ ] Full public transparency on results.
- [ ] Conflict-of-interest declarations enforced at the DB level.

## Three tiers
- [ ] Tier 1 (Community-Binding): binding within safety floor.
- [ ] Tier 2 (Community-Directed, Entity-Executed): overrides are publicly logged with reason.
- [ ] Tier 3 (Safety Floor): NEVER routed to a community vote. Hard-coded.

## Two floors (ADR 0017 Decision 4; ADR 0018)
- [ ] The safety floor (incl. "the AI organizes and never interprets" and
      "crisis help is one tap away on every screen") and the privacy floor
      (10 items, `.claude/rules/governance.md`) are NEVER votable.
- [ ] Crisis routing to humans applies in community spaces only; nothing opens a
      private journal.
- [ ] Floor changes only via VT Infinite, Inc. (or a future steward): emergency
      tightening at once; otherwise announced with reason first; loosening needs
      a notice period, a new ADR and legal review, never a vote; loosened
      privacy items apply only to later data, with fresh opt-in.
- [ ] Feature ballots choose only among features that meet both floors.
- [ ] The AI advisory group is a safety check, not a second vote: no power over
      votes, budgets, rankings or elections. Seats proposed by the core
      founding team, chosen by one-equal-vote member election; stakes declared
      and checked; no seat ballot before the charter sets candidacy and terms;
      until member voting opens, a founder-chosen interim group under the same
      rules.
- [ ] Item 10: live sessions are never recorded — no audio, video or
      transcript kept by us or any processor.
- [ ] Money buys no vote, seat, veto or place on the roadmap.

## Architecture
- [ ] OFF-CHAIN only. No wallet/token/blockchain mechanics.
- [ ] All governance rows are deletable (no immutability that conflicts with deletion rights).
- [ ] Ballots meet WCAG 2.2 AA.

## Gate
- [ ] governance-reviewer subagent invoked and PASS confirmed.
