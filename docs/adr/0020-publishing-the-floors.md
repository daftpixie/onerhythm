# ADR 0020 — Publishing the floors

Status: Accepted — founder, 2026-10-29

Built from the approved moderation plan §2 (PR #6).
Date: 2026-10-29
Relates: ADR 0017 Decision 4 (the two floors and the rule for changing a floor);
ADR 0018 (privacy floor item 10, a tightening); ADR 0019 (data model);
`.claude/rules/governance.md`; plan §2, §6 (T10).

## Context

There are two floors, the safety floor and the privacy floor. Both sit outside
every vote. ADR 0017 sets the rule for changing one:

- only VT Infinite, Inc., or a future steward under the same rule, can change
  a floor;
- a floor may be tightened at once in an emergency;
- otherwise every change is announced with its reason first;
- loosening waits a published notice period, needs a new ADR and legal review,
  and is never put to a vote;
- a loosened privacy item applies only to data collected afterward, with fresh
  opt-in.

Today the floors exist only as text in rule files and ADRs. Moderation actions
need a real reference ("item N of version V"), and members need to see the
version they are held to. A rule that lives only in prose can also be broken
quietly. The database should refuse an improper change.

## Decision

1. **Where the text lives.**
   - `docs/policy/safety-floor.md` and `docs/policy/privacy-floor.md`, each with
     a version header, an effective date and a changelog that gives the reason
     for every change.
   - Each item states the harm or legal basis behind it.
   - The privacy floor's text is ADR 0017's nine items plus item 10 (ADR 0018).
   - The safety floor includes ADR 0017's two additions: the AI organizes and
     never interprets, and crisis help is one tap away on every screen.
   - The safety floor includes the misinformation boundary in plan §2.1. What
     counts as *dangerous* is removed; what is *borderline* is left up with a
     context note. A note is never a way to leave dangerous content up.
   - A public page renders the same text and shows that its hash matches the
     repository.

2. **`floor_versions`.** Public read for anon and authenticated, and no member
   data. Columns:
   - `floor` (`safety`, `privacy`);
   - `version`, unique per floor;
   - `content_sha256`;
   - `change_kind` (`initial`, `tighten`, `tighten_emergency`, `loosen`);
   - `reason`, non-empty (CHECK);
   - `announced_at`, `effective_at`;
   - `notice_ends_at`, `adr_ref`, `legal_review_ref`;
   - `applies_from`, `requires_fresh_optin`, `policy_version`.

3. **`floor_items`.** Columns `floor`, `version`, `item_number` and `text`. The
   foreign key is (`floor`, `version`) → `floor_versions`. Moderation actions
   point here.

4. **The rule, enforced** (CHECKs where a CHECK can, a trigger where it needs
   `now()` or the config row):
   - `tighten`: `announced_at < effective_at`. It is announced with its reason
     first (ADR 0017).
   - `tighten_emergency` is the only kind that may take effect at
     announcement (`announced_at = effective_at` is allowed). Its reason is
     required like any other.
   - `loosen` needs `adr_ref`, `legal_review_ref` and `notice_ends_at`, with
     `effective_at >= notice_ends_at` and
     `notice_ends_at >= announced_at + minimum_notice`.
   - **While `governance_config.minimum_notice` is NULL, a trigger rejects every
     `loosen`.** `minimum_notice` is set by the governance charter or a
     rule-file change (Amendment 3 §6.7), not here. It is NULL until then.
   - A privacy `loosen` also needs `applies_from`,
     `requires_fresh_optin = true` and a `policy_version`.
   - **A `tighten` must actually tighten.** A trigger rejects a `tighten` or
     `tighten_emergency` row whose items drop or rewrite an item of the
     previous version. Changing an item's text, or removing an item, has to be
     recorded as `loosen`. Adding an item is allowed.
   - **`initial` only once.** A row with `change_kind = initial` is accepted
     only when that floor has no earlier version. A later change cannot be
     labelled `initial` to skip the checks.
   - The "must tighten" comparison runs in a **deferred constraint trigger**,
     because the version row is inserted before its items. It checks the
     finished set at commit.
   - Every change, and each `tighten_emergency` in particular, is written to
     the public log history (`moderation_log_public`, kind `floor_change`). The
     log row carries the floor and version, and points at the public
     `floor_versions.reason`. It has no count and no free text of its own.
   - A floor's first version must be `initial`; every version has at least
     one item; items cannot be added to a version that has taken effect;
     `version` is the previous version plus one.
   - Any wording change, even one that tightens, goes through `loosen`. That
     is heavy on purpose.
   - **Published rows are never rewritten.** Triggers reject UPDATE and DELETE
     on `floor_versions` and `floor_items`, for every role including
     `service_role`, and TRUNCATE is revoked. A genuine error, or a correction
     an order requires, is made by an owner-run migration with its own ADR.
     `launch_gate_history` follows the same rule. A change is always a new version. Floor text is not member
     data, so this does not conflict with deletion rights.
   - `adr_ref` and `legal_review_ref` are free text. The database can only
     require them to be non-empty. That the ADR and the legal review exist is
     checked by people, in review, not by the database.
   - **Only `service_role` writes.** `authenticated` and `anon` have no INSERT,
     UPDATE or DELETE. No column refers to proposals or ballots, so no vote can
     change a floor.

5. **Re-examination requests** (plan §2.3).
   - Any member can ask, through a published form, for the stated basis of an
     item to be re-examined. It is a public re-examination, never a vote.
   - A request is published only after a human review, through a view with no
     member identifier.
   - Showing a name is an unchecked opt-in, recorded in the consent ledger as
     purpose `reexam_show_name` (ADR 0019). There is no boolean column.
   - The published answer lives in `floor_reexamination_answers`, with a
     summary written by the reviewer. It never holds the member's own text.
   - The form says "Please don't include health details".
   - Deleting the account deletes the request. A published answer may stay,
     with nothing that identifies the requester.

## Consequences

- G5 ("published floors v1") needs both texts in `docs/policy/`, a
  `floor_versions` row for each, and `minimum_notice` set in the charter.
  Writing the two texts is the founder's call with counsel (G6). This ADR does
  not write them.
- T10 (`supabase/tests/16_floor_change_rules_test.sql`) pins every rule in
  point 4. It is committed failing in the same PR as this ADR, before any
  migration.
- A future loosening has to pass all of point 4. It also needs the steps that
  live outside the database: the new ADR, legal review, the published notice
  and fresh opt-in in the consent ledger.
