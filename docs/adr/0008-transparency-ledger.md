# ADR 0008 — The repo IS the ledger: append-only open books + /transparency

Status: **Superseded in part by ADR 0016 (2026-08-09).** The in-repo ledger and
the append-only guard stand unchanged and remain in force. What was withdrawn is
the rendering half — the `/transparency` page, the runway meter, the generated
bundle and its drift test — removed before launch as premature: a published cost
table of well under a dollar a month, against zero member support, for a platform
that has not opened. **Restoring the page is a named Phase 4 prerequisite,
alongside Stripe**, and it comes back with its generator and drift test or not at
all. Read the sections below on rendering as history, not as current state. As of
2026-09-26 the repository is private; references below to a publicly auditable
ledger and a public repository describe the intended release, not current access.

Date: 2026-07-08
Relates: ADR 0007 (PBC, not-tax-deductible, vocabulary); PRD §5.5, §10;
Wireframe B10 (this is its repo-file precursor); plan
.claude/plans/phase-1t-transparency.md (approved with founder figures).

## Decision: the ledger lives in the open-source repo

Costs and member support are recorded as plain YAML in `transparency/`, and
`/transparency` renders ONLY those files, bundled at build time. Rationale:

- **Git history is the audit trail.** Every change to the books is recorded
  permanently and publicly; tampering is visible by construction. No database
  row can offer that to an outside auditor.
- **Zero data surface.** No DB reads, no auth, no PII, no grant/RLS
  implications — the page is anon-visible because it's static content.
- **The commitment is mechanical, not aspirational:** a pre-commit guard, a
  render SLI, math tests, and a drift test enforce it (below).

## Structure

- `costs.yml`, two sections (founder decision 2026-07-08):
  - `platform:` — what member support is asked to cover; the ONLY coverage
    denominator. $0 free-tier lines are shown, not hidden.
  - `founder_contributed:` — disclosed, excluded from the math ($400/mo dev
    tooling; DE franchise tax + registered agent, figure recorded at next
    filing). Personal hardware/ISP is not ledgered; the page covers it with
    one sentence ("The founder currently contributes his own development
    tools and time; member support is asked to cover platform operating
    costs only.").
- `support/YYYY-MM.yml` — one per CLOSED month: totals + contributor COUNT
  only, never names; `source: founder-attested` until Stripe. Seeded:
  2026-05 and 2026-06 at $0 / 0 contributors. `attested_on` being later than
  the month IS the honest record that early months were attested
  retroactively when this page shipped (privacy-reviewer advisory, accepted
  as-is — closed files are never edited, even for nits).

## The enforcement set

1. **Tamper guard** `.claude/hooks/ledger-append-only.sh` (pre-commit guard
   #6): blocks modify/delete of any support month before the current
   calendar month, and any deletion of a `- name:` entry from costs.yml.
   Corrections are NEW entries with a note; the mistake stays visible.
   Proven: closed-month edit BLOCKED, closed-month delete BLOCKED, new
   current-month file PASSES, costs entry deletion BLOCKED, costs entry
   addition PASSES.
2. **Render SLI** (`tests/screens/transparency-screen.test.tsx`): the page is
   a monitored surface like the crisis affordance — meter (progressbar role +
   value + words), cost table incl. $0 lines, the verbatim not-tax-deductible
   sentence, the never-do block, and a NO-"donation"-vocabulary assertion.
3. **Math tests**: coverage = month support / month PLATFORM costs; explicit
   display cases — $0/$0 → "our costs are currently $0 a month — member
   support builds the reserve" (no percent; a percent of zero is noise);
   support over $0 costs → full meter, all to the reserve; 0% shown honestly;
   >100% → bar caps at 100 while the words carry the REAL percent and the
   surplus-to-reserve statement. `accessibilityValue.text` carries the real
   percent so screen readers never announce a capped number.
4. **Parse + drift safety**: the parser THROWS (`TransparencyLedgerError`) on
   malformed/missing/negative data — wrong numbers never render silently.
   The app bundles the YAML via a generated module (`npm run gen:ledger` →
   `src/lib/transparency/ledger.generated.ts`); a drift test fails the build
   unless the generated module byte-matches `transparency/`, so a forgotten
   regeneration or an unbundled new month cannot ship stale books.

## Interim mechanism: founder-attested

Until Phase 4, support figures are attested by the founder and the page says
so in plain words — honesty about the mechanism is the mechanism.

**Phase 4 Stripe handoff contract:** when checkout lands, (a) closed months
switch to `source: stripe` with totals taken from payment records; (b)
existing founder-attested months are NOT rewritten — the mechanism change is
itself visible in the ledger; (c) re-run the privacy review against the
"Stripe data never joined to health self-ID" rule (the SupportMonth schema
has no join surface, keep it that way); (d) vocabulary stays "member
support"/"contributions" (ADR 0007).

## Phase 3 relationship

The governance treasury dashboard (wireframe B10: community-directed budget,
funded-proposal history, entity overrides) is a DIFFERENT, DB-backed surface
with its own deletable-where-required rules (.claude/rules/db.md). This repo
ledger stays the canonical money-in/money-out record; Phase 3 renders
governance flows, not the books. Do not merge the two.

## TODO (near-term critical path)

- **Publish the public repository.** The page ships the honest placeholder
  ("This ledger will link to the public repository when it opens"). Opening
  the repo is now a prerequisite for the audit promise AND for GitHub
  Sponsors / Open Collective / cloud-credit applications (founder note,
  2026-07-08).

## Verification (2026-07-08)

Jest 96/96 (85 rn + 11 db; 41 new), pgTAP 34/34 untouched, lint/typecheck
clean, six guards green, web export bundles the page copy with zero
"donation" occurrences. a11y-reviewer PASS (advisories applied: real-percent
accessibilityValue.text; 1.5 heading line-height). privacy-reviewer PASS 7/7.
