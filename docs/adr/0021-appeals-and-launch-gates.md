# ADR 0021 — Appeals and launch gates

Status: Accepted — founder, 2026-10-29

Built from the approved moderation plan §4.5 and §8 (PR #6) and the founder's
answers of 2026-10-29 (Q3, Q9).
Date: 2026-10-29
Relates: PRD §6.2 (elected appeals panel); ADR 0017 (Tier 3 never votable);
ADR 0019 (data model); `.claude/rules/governance.md`; plan §4.5, §4.7, §8, §6
(T7, T8, T17).

## Context

Two founder decisions shape this:

- crisis response and review is a **launch gate whose definition is TBD**
  (decision 1);
- appeals are a **launch gate, with the interim panel TBD** (decision 3).

The risk is copy that promises what does not exist yet. For example, "A
reviewer will reply within 24 hours" when no reviewer has been recruited. For a
person in distress, a false promise is worse than an honest "not yet".

On 2026-10-29 the founder also decided:

- **Q3:** interim moderators are founder-appointed, named publicly, with end
  dates, and replaced by election. The founder does not sit on the interim
  appeals panel.
- **Q9:** a temporary ban before elections is allowed only for a safety-floor
  violation, by a G4 holder, with a floor item, a reason, an end date and a
  second look.

## Decision

1. **`launch_gates`** (public read; service writes only). Columns:
   - `key` (`G1`–`G9`);
   - `title`;
   - `status` (`unmet`, `met`);
   - `definition` (default "Not defined yet");
   - `defined_at`, `met_at`.

   It is seeded with all nine gates `unmet`, using the titles in plan §8.
   - CHECK: `status = 'met'` needs a definition other than the default, and a
     `met_at`.
   - Every change writes a `launch_gate_history` row: the old status, the new
     status, the definition and the time.

2. **Copy reads the gate.** Member-facing, console and policy-page copy that
   mentions review, a reviewer, a panel or a time reads its gate from
   `launch_gates`. With G1 or G2 unmet, the copy promises nothing. Its wording is
   in plan §4.5:
   - "Your request is saved."
   - "We haven't set up our review panel yet, so we can't say when."

   T8 pins this in two ways:
   - **Static scan:** no string in `app/` or `src/` promises a reply, a
     reviewer, a panel or a time.
   - **Database:** the gates are seeded unmet.

3. **Appeals.**
   - **Tier 1 actions** are appealable to a panel (PRD §6.2).
   - **Tier 3 actions are never put to a vote.** `submit_appeal()` raises for
     one. A Tier 3 "look again" goes to a trained human and is part of G1. A
     panel can never lower an item from Tier 3 (T7).
   - An appeal is never dropped silently. The member can withdraw it. Until G2
     is met, the member-facing state is "Your request is saved".
   - **One equal vote per panelist:** `unique(appeal_id, panelist_pseudonym)`,
     with no weight column. Quorum, panel size and the tie rule are set with G2.
   - Panelists see appellants by pseudonym (Q4).
   - A decision is rejected if it comes from the acting moderator, the
     appellant, or a panelist who wrote or reported the content (T17).
   - **The founder does not sit on the interim panel (Q3).** The panel
     functions cannot check this, because the founder has no special row. So
     it is an attestation instead: when G2 is defined, its published
     definition names the panelists and states, with a public reason, that the
     founder is not among them.
   - **G2's definition must state the panel size, the quorum and the tie
     rule.** `decide_appeal()` records each decision, but an outcome becomes
     final only when the published quorum of decisions exists.
   - **G2's definition must also meet plan §8:** at least 3 distinct people,
     each labelled "interim" with an end date, replaced by election. The gate
     cannot be marked `met` with a definition that leaves these out. People
     check this at review, and the definition is published with its history.

4. **Temporary bans before elections (Q9).** `moderate(..., 'temporary_ban',
   ...)` requires:
   - a safety-floor item (`floor_item_id` on the safety floor);
   - a reason;
   - an `ends_at` in the future (no maximum is set here; that is a founder
     value);
   - an `is_moderator()` caller. No grant can exist until G4 is `met` (ADR 0019
     §6), so this also means G4 was met;
   - a length within `max_ban_term`. While that value is NULL, every ban is
     rejected.

   The ban is a `member_bans` row keyed to the member (ADR 0019). It stays
   pending until `confirm_action()` by a different person (the second look;
   T18). Once confirmed, the `posts` and `comments` insert policies refuse that
   member until `ends_at`. Deleting the post does not clear it.

5. **Nothing is populated.** No grant, panelist or reviewer row is seeded. G1–G4
   stay unmet and undefined until the founder recruits and defines them. This
   ADR invents no person, hours or response time.

## Consequences

- With no panel, a Tier 1 appeal waits as "Your request is saved". That is
  honest, and it means member launch is blocked on G2, as plan §8 says.
- The policy page shows each gate in words, for example: "Crisis review by
  trained people: not in place yet. Definition: not decided yet."
- T7, T8 and T17 are committed failing in the same PR as this ADR, before any
  migration.
