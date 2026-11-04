# Phase 1T plan — the open books: in-repo ledger · /transparency · runway meter

Status: APPROVED 2026-07-08 (founder figures supplied) — EXECUTED; see ADR 0008

Status note (2026-10-28): references here to VT Infinite, Inc. as a public benefit
corporation (PBC) reflect what was believed when this was written. The PBC
conversion is drafted and has not been filed; see ADR 0007 as corrected on
2026-09-26. Left unchanged below as the historical record.
Date: 2026-07-08
Basis: PRD §5.5 (transparency by default), §10 (funding posture); Wireframes
B10 (this is its repo-file precursor, NOT the Phase 3 governance dashboard);
Brand v2 §8/§9; ADR 0007 (PBC, not-tax-deductible, "member support" vocabulary).
Standing rule honored: ZERO schema/RLS/policy/grant changes — the page renders
from repo files bundled at build time; no DB read at all, so anon visibility
has no grant implication.

## 1. Ledger format (in-repo, human-readable, machine-parseable)

```
transparency/
  README.md            how to audit via git history; append-only rule;
                       corrections = new correcting entry, never an edit
  costs.yml            recurring: [{name, amount_usd_month, since, note}]
                       one_time:  [{name, amount_usd, date, note}]
                       upcoming:  [{name, note}]   ← known-coming, not billed
  support/
    YYYY-MM.yml        one per CLOSED month:
                       {month, total_usd, contributor_count, source,
                        attested_by, attested_on, note?}
```

- $0 lines are SHOWN, not hidden — free-tier honesty is part of the story.
- `contributor_count` only — never names, never any PII.
- `source: founder-attested` until Stripe (Phase 4) makes it
  `source: stripe`; the page states the attestation mechanism plainly —
  honesty about the mechanism is the mechanism.
- Corrections to a closed month: a NEW file entry field `corrections:` list in
  a LATER month's file (or a new dated correcting file) with a note — the
  original is never edited; the tamper guard enforces this.

### Seed data — REAL FIGURES NEEDED FROM MATT (do not invent)
- Q1: Domain name(s) actually registered — which, at what $/yr, since when?
- Q2: Any other currently billing lines? (Expo/EAS, GitHub, email/SMTP,
  AI/dev tooling…) And the policy call: include founder-personal tooling as
  cost lines, or exclude as founder-contributed (stated either way)?
- Q3: Ledger start month (the project began 2026-05); confirm every closed
  month so far is $0 support / 0 contributors, and the attested_by string
  (e.g. "Matthew Adams, founder").
- Q4: Public repo URL for the "audit the ledger" link (no git remote is
  configured locally) — or ship "the public repository link lands here when
  the repo goes public" placeholder copy?
Known lines needing no answer: Supabase $0 (free/local), Cloudflare Pages $0
(free), upcoming: Apple Developer $99/yr (Phase 5), legal review (quote
pending, launch-blocking).

## 2. Bundling: YAML into the app without a server

- `js-yaml` (+types) for parsing; `babel-plugin-inline-import` (dev dep) so
  `import costsYml from "../../transparency/costs.yml"` inlines the RAW TEXT
  at build time for metro AND jest (both read babel.config.js). TS ambient
  declaration for `*.yml` as string. Single source of truth, no codegen.
- Fallback if the plugin fights jest-expo/metro: tiny `gen:ledger` script
  emitting a generated TS module + a test that fails loudly on drift. (Plan A
  preferred; fallback documented so approval covers both.)
- Parser `src/lib/transparency/`: `parseCosts(yamlText)`,
  `parseSupport(yamlText)`, `computeCoverage(supportUsd, recurringUsdMonth)`,
  `monthlyRecurringTotal(costs)` — pure, typed, THROW on malformed/missing
  fields (parse safety: CI fails loudly, wrong numbers never render silently).

## 3. The page — app/transparency.tsx (public, inside AppShell)

Sections, in Brand §9 voice:
1. Intro: "We're funded by members, not advertisers. Here's every dollar."
   Plus the attestation sentence while founder-attested.
2. Monthly costs table: every recurring line incl. $0 ones + amortized
   domain; one-time and upcoming lines listed plainly.
3. Support by month: total, contributor count (never names), source.
4. RUNWAY METER: "Member support covered N% of our costs in <Month Year>."
   RN `accessibilityRole="progressbar"` + `accessibilityValue={{min:0,
   max:100, now}}` (→ aria-valuenow on web) + the sentence as visible text —
   never color-only. Display rules in §4.
5. "What we will never do": no ads; no selling data; no paywalls; no
   pay-for-power governance.
6. PBC + benefit-report commitment (ADR 0007) and the plain sentence:
   "OneRhythm is a public benefit corporation, not a charity — contributions
   are not tax-deductible."
7. The git-ledger audit promise (link or placeholder per Q4).

## 4. Coverage math (display rules)

`coverage = month support / month recurring costs`
- costs 0, support 0 → no percent; copy: "Our costs are currently $0 a month
  — support builds the reserve."  (meter shows full, labeled as such? NO —
  meter hidden, sentence shown; a percent of zero is noise.)
- costs 0, support > 0 → "Support this month exceeded our $0 costs — it all
  goes to the reserve." Meter shown full (now=100).
- costs > 0, support 0 → 0% meter, honest.
- partial → N% (rounded to whole).
- > 100% → meter capped at now=100; text states the real percent and that the
  surplus builds the reserve (community-directed budget arrives in Phase 3).

## 5. The tamper guard (structural, not aspirational)

`.claude/hooks/ledger-append-only.sh`, wired into `.githooks/pre-commit`
(guard #6), blocking staged changes that:
- modify or delete an existing `transparency/support/YYYY-MM.yml` whose month
  is BEFORE the current calendar month (adding new files is fine; the
  current/open month may still be edited until it closes);
- delete entry lines (`- name:` rows) from `costs.yml` — additions and
  amount updates are allowed (git history keeps the trail), deletions are not.
Proof protocol like the other guards: fabricate a closed-month edit staged →
BLOCKED; new-month file staged → passes; costs.yml entry deletion → BLOCKED;
then remove proof files.

## 6. TDD list (checkpoint per the 1D exclusion pattern)

tests/unit/ (new testMatch added to the rn jest project — additive only):
- `transparency-parse.test.ts` (d): valid costs + support parse to typed
  objects; malformed YAML throws; missing required field throws; empty file
  throws; negative amounts throw.
- `transparency-math.test.ts` (c): the four coverage cases + rounding + cap
  metadata (real percent preserved alongside capped meter value).
tests/screens/:
- `transparency-screen.test.tsx` (b, render SLI — treated like the crisis
  affordance: a monitored surface): renders the meter (progressbar role +
  accessibilityValue + the sentence), the costs table incl. a $0 line, the
  support month, the not-tax-deductible sentence verbatim, the never-do
  block; NO "donation" vocabulary anywhere in the rendered output; meter has
  an accessible name.
Guard: shell proof (not jest), like every other guard.

## 7. A11y plan (page + meter)

Headers marked with accessibilityRole="header"; meter =
progressbar role + accessibilityValue + full visible sentence (info never
color-only); "table" rendered as labeled text rows (RN has no table
semantics; each row one Text, amounts in words+digits); all text ≥16px, LH
≥1.5, house palette (all pairs ≥4.5:1 per 1D audit); any link/button ≥44px
with focus ring; no motion; page fully readable signed-out; 🆘 via AppShell.

## 8. Execution order after approval

1. Red tests (checkpoint commit w/ temporary exclusion, 1D pattern).
2. deps: js-yaml, @types/js-yaml, babel-plugin-inline-import (dev).
3. Ledger files with Matt's real figures; README.
4. Parser/util; meter component (src/components/RunwayMeter.tsx); page.
5. Tamper guard + wiring + proof (block + pass + block), remove proof files.
6. Green: new tests + jest 54 prior + pgTAP 34 + lint/typecheck + 6 guards.
7. Reviewer gates: a11y (page + meter), privacy (charge per Step 4 of the
   brief). Fix + re-verify.
8. SESSION_LOG + ADR 0008 (repo-as-ledger rationale, append-only rule,
   founder-attested interim, Phase 4 Stripe handoff contract, Phase 3
   treasury-dashboard relationship) + single feat commit. STOP.
