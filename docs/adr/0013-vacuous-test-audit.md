# ADR 0013 — The vacuous-test audit, and the rule it leaves behind

Status: Accepted
Date: 2026-08-08
Relates to: ADR 0014 (web renderer test project), which was motivated by the
same class of failure at the renderer level

## Context

Two defects had shipped green. A third, the hollow typeface guard, had already
been found and repaired earlier: it skipped every node with no declared
`fontFamily`, so the one component rendering in the platform default — the
disclaimer sentence on every health page — was the one component it could not
see. Repairing it was the moment the underlying question got asked properly:

> How many of our tests would still pass if the thing they claim to guard were
> deliberately broken?

A test that cannot fail is not a test. It is a comment that costs CI time, and
worse, it is a comment that reads like a guarantee. On a platform whose
non-negotiables are enforced "by hooks and DB constraints, not good intentions",
an assertion that cannot fail is a non-negotiable that is not enforced at all.

## Method

`scripts/vacuity-audit.sh`. It takes a label, a file, a Perl expression, and a
target. It backs the file up, applies the mutation, runs the target, restores
the file, and reports one of three outcomes:

- **CAUGHT** — the target went red. The assertion is real.
- **VACUOUS** — the target stayed green. The assertion is theatre.
- **NO-OP** — the mutation did not change the file, so the run proves nothing.
  Reported separately and loudly, because a mutation that silently fails to
  apply looks exactly like a passing audit.

That third outcome earned its place immediately: three mutations in this audit
were NO-OPs on the first attempt, twice because the source uses typographic
apostrophes (`’`) where the pattern used `'`. Without that check they would have
been recorded as CAUGHT and the audit would have been quietly worthless in
precisely the way it exists to detect.

Guards are audited the same way but through the index, since every guard reads
`git diff --cached`: write a violating file, stage it, run the guard, expect a
non-zero exit, unstage, delete.

## Results

Every line below was proven by a deliberate violation. The five pgTAP
crown-jewel audits listed first were run in the preceding session; the rest are
this one's work.

### Crown-jewel database invariants (pgTAP)

| Invariant | Violations tried | Caught |
|---|---|---|
| no-downvote — `value` column | 2 | 2 |
| duplicate upbeat | 2 | 2 |
| anon read on `posts` | 1 | 1 |
| consent-gating | 2 | 2 |
| deletion cascade | 8 | 8 |

### Guards (7/7, 8 violations)

| Guard | Violation used | Result |
|---|---|---|
| `no-downvote-guard` | `{ downvote: true }` in `src/` | CAUGHT |
| `no-thirdparty-on-health` | `fetch("…google-analytics.com/collect")` | CAUGHT |
| `no-anon-policy-on-sensitive` | `create policy … on health_self_ids … to anon` | CAUGHT |
| `ledger-append-only` | cost entry deleted from `costs.yml` | CAUGHT |
| `ledger-append-only` | closed month `2026-05.yml` modified | CAUGHT |
| `secrets-pii-scan` | `sb_secret_…` literal | CAUGHT |
| `no-raw-color-literals` | `"#E20A17"` outside `tokens.ts` | CAUGHT |
| `no-marketing-member-join` | `updates_subscribers join profiles` | CAUGHT |

### Unit and component invariants

| Assertion | Violation used | Result |
|---|---|---|
| `contrast.test.ts` | Pulse Red → `#F5A3A9` (2.2:1) | CAUGHT |
| `typeface.test.tsx` (repaired guard) | `DisclaimerBand` → Helvetica | CAUGHT |
| `meta-tags.test.ts` | gtag `<script>` into `public/index.html` | CAUGHT |
| `sheet-export-fields.test.ts` | a field removed from the export list | CAUGHT |
| `brand-public-sync.test.ts` | an asset removed from the manifest | CAUGHT |
| no-correlation (`no-join-path.test.ts`) | marketing↔member join added to `src/` | CAUGHT |
| export completeness (`rights-export-format.test.ts`) | a member-owned table dropped | CAUGHT |
| transparency coverage math | `computeCoverage` stubbed out | CAUGHT |
| transparency generated-ledger drift | `total_usd: 0` → `4200` | CAUGHT |

### Absence assertions

| Assertion | Violation used | Result |
|---|---|---|
| no downvote in the upbeat control | a "Dislike" control rendered | CAUGHT |
| signup form says nothing about health | "Tell us your diagnosis" added | CAUGHT |
| delete panel claims nothing about backups | "we purge backups in 30 days" | CAUGHT |
| delete panel: contribution vocabulary only | "consent records" → "donation history" | CAUGHT |
| landing page carries no tracking pixel | Facebook `<img>` pixel added | CAUGHT |
| decorative glyph hiding (Wordmark) | `hiddenFromAssistiveTech()` removed | CAUGHT |
| disclaimer sentence present | replaced with "Ask us about your symptoms" | CAUGHT |
| no control without a data model | "Email notifications" row added | CAUGHT |
| delete panel promises no confirmation email | "we email you and it's done" | **VACUOUS** |

## What was hollow

### 1 & 2. The two live-region assertions in `UpdatesSignupForm`

The success region is deliberately **mounted empty**, so that its later text
reads to assistive tech as a *change* rather than an *arrival*. That design is
correct and stays. The tests built on top of it were not.

Because the node exists from the first render, `await findByRole("status")`
resolves on the first tick — before the submit has resolved. It is not a wait at
all. And `accessibilityLiveRegion === "polite"` is already true while the region
is idle, so that assertion could never fail in either direction.

Proven, not asserted: against a component whose success message never appears,
the old suite left **"announces success politely"** and **"treats an address
already on the list identically to a new one"** both GREEN. The second is the
more instructive of the two — it asserts that the message does *not* say
"already", and an empty string satisfies that perfectly.

This also resolves an open question wrongly filed as an environment problem. The
intermittent "281/282" failure was recorded as a WSL parallel-load flake. It was
not. Every assertion that followed one of those non-waits was racing the state
update, and lost sometimes. The fix is to wait on the **content**, never on the
node, and to check polite-versus-assertive while the region actually has
something in it — where the assertion can fail.

### 3. "Promises no confirmation email" — found by this audit

It matched three exact phrasings: `/we'll email|we will email|email you when/i`.
A violation reading *"when you're signed out, we email you and it's done"* went
straight through, as would "check your inbox", "a confirmation has been sent",
or "we'll write to you shortly".

An assertion that only catches the wordings someone happened to think of is not
an invariant; it is a spell-checker for one author's habits. Widened to forbid
the vocabulary outright — this panel has no legitimate reason to say "email" or
"inbox" at all, and if SMTP ever lands, this test *should* fail and force the
claim to be re-examined deliberately.

### 4. A cast that hid a real defect

The web consent fixture was cast `as never` to quieten the compiler and silently
omitted a required `id`. `react-dom` reported it as a missing-key warning while
the types stayed happy. Casting a fixture is how a test starts describing a
component that does not exist; the cast is gone and the fixture is typed.

## Honest scope

The brief estimated "~24 absence assertions". The real figure is **170 negative
matchers across 43 files**. The invariant-bearing ones are in the tables above.
The remainder — mostly local `toBeNull()` and `toBeUndefined()` checks inside
tests whose positive assertions carry the weight — are **not** individually
mutation-tested, and this ADR does not claim they are.

That gap is not closed by more auditing today. It is closed by the rule below,
which makes the audit a condition of entry rather than a periodic clean-up.

## Decision

**Every new invariant test must be proven to fail against a deliberate violation
before it counts as a guarantee.**

In practice:

1. Write the test. Break the thing. Watch it go red. Restore. Only then is it
   finished. This is the TDD discipline already in CLAUDE.md, stated for the
   case where the test is *about an absence* — where "it passes" is the default
   state and therefore proves nothing on its own.
2. An absence assertion must be accompanied by a positive assertion that the
   surface rendered at all. "No downvote in the DOM" is satisfied by a blank
   page, so it must sit next to "exactly one upbeat control exists".
3. Never wait on the existence of a node that is present from mount. Wait on its
   content.
4. Prefer forbidding a vocabulary to enumerating phrasings.
5. Never cast a fixture. If the types resist, the fixture is wrong.
6. When a test fails intermittently, the fork is: **exit 137 or a timeout under
   parallel load is the environment; a line that passes in isolation and fails
   in a full run is a defect until proven otherwise.** The 281/282 case was
   filed on the wrong side of that fork for weeks.

## Consequences

- `scripts/vacuity-audit.sh` is checked in, so the audit is repeatable rather
  than a one-off narrative. It is deliberately not wired into CI: mutating the
  working tree during a CI run is a bad trade, and the value is in using it while
  writing a test, not in re-proving old ones on every push.
- The suite is slower to add to. That is the intended cost.
- Some assertions are now broader than the behaviour they guard (the email
  vocabulary ban). Where that is deliberate it is commented as such, so a future
  failure is read as "come back and think", not as "widen the regex".
