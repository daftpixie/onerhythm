# ADR 0014 — Test under the deploy target's renderer

Status: Accepted
Date: 2026-08-08
Relates to: ADR 0013 (vacuous-test audit) — the same class of failure, one level
up: not one hollow assertion, but an entire renderer never exercised
Supersedes in part: the mitigation recorded in `tests/unit/rnw-a11y-contract.test.ts`,
which stays as a version-drift canary but is no longer the primary defence

## Context

Web is the deploy target. Today it is the *only* deploy target — Cloudflare Pages
serves the landing page, and iOS/Android are Phase 5. The entire test suite ran
under the React Native renderer, through `react-test-renderer`.

That renderer reports **the props a component intended to set**. It never builds
a DOM. So every accessibility assertion in the repo was of the form "did we pass
`accessibilityDisabled`?" and never "does a browser receive something a screen
reader or a keyboard can use?".

This is not a gap in one test. It is an entire layer — react-native-web's prop
translation — that stood between our assertions and our users, and that nothing
ever executed.

Three defects reached `main` through it.

## The three defects

**1. `accessibilityState={{disabled}}` is inert on web.** `createDOMProps`
contains zero references to `accessibilityState`; it carries state on native
only. A destructive control announced as a plain "button". Passed 208/208.

**2. `importantForAccessibility` is dropped in silence.** RNW's `<Text>` filters
props through an allowlist, so the Android-only spelling vanishes with no warning
and no hiding. The 🆘 in the safety-critical crisis-sheet title was never hidden
on web. `react-native-svg`'s web build takes the opposite road and spreads
unknown props straight onto the real `<svg>`, where the same prop survives as a
junk attribute — SVG being case-preserving XML.

**3. `unavailable()` was defeated at its only call site.** Found by the spike,
unprompted, and the sharpest of the three. `accessibilityDisabled` *does* produce
`aria-disabled` — but `createDOMProps` then "enhances with native semantics": for
an element type of `button|form|input|select|textarea` it also sets a **real
`disabled` attribute**. `accessibilityRole="button"` makes the element a real
`<button>`, so the delete-account trigger rendered:

```html
<button aria-disabled="true" disabled="" role="button" tabindex="0" ...>
```

Fatal twice over, and `tabindex="0"` saves neither. A disabled `<button>` is out
of the Tab order — the exact keyboard dead-end `unavailable()` existed to
prevent — **and** receives no click events, so the `onPress` branch that showed
the hint and moved focus to the field was dead on web for mouse users too. An
unarmed member clicking the button got silence.

## What the proof gate actually showed

The plan predicted `web` RED / `rn` GREEN for all three. Measured:

| # | Defect | `web` with bug | `rn` with bug | Discriminates? |
|---|---|---|---|---|
| a | `accessibilityState` inert | RED (1 failed) | RED (2 failed) | **No** |
| b | `importantForAccessibility` dropped | RED (3 failed) | RED (3 failed) | **No** |
| c | real `disabled` attribute | RED (2 failed) | GREEN (23/23) | **Yes** |

The "passed 208/208" claim was true when those defects shipped, and is no longer
reproducible at HEAD: the preceding session added `decorative-a11y-hiding.test.tsx`
and prop-level assertions in `DeleteAccountPanel.test.tsx` as targeted
mitigations *after* the fact.

Which produces a better argument than the plan's. Those mitigations assert that
the component sets `accessibilityDisabled` — and setting `accessibilityDisabled`
is **precisely what causes defect (c)**. The native suite was asserting the cause
of a live browser defect and reporting it as a pass. Reading a library's source
catches what you thought to read; rendering catches what you did not.

## Decision

A third jest project, `web`: `jest-expo/web` (jsdom, the
`^react-native$ → react-native-web` alias the Expo web build uses,
`caller.platform = "web"`, web-first module resolution), rendered with
**`react-dom`** and queried with **`@testing-library/dom`**.

`react-dom` is what runs in the browser. `react-test-renderer` is not. That is
what "test under the deploy target's renderer" has to mean, and it is why RNTL
could not be the query layer here: under the web preset its semantic queries all
throw (`__fbBatchedBridgeConfig is not set`), and even patched it mounts no
document — so `document.activeElement`, Tab order and real accessible-name
computation stay unreachable. Focus management is load-bearing in the
delete-account flow, so that was not an acceptable gap.

All three projects run in `npm test` and in pre-commit. The two defects that
shipped green shipped *through a passing pre-commit run*; a renderer checked only
in CI is a renderer whose defects get committed. Measured cost: **10.2 s for 51
tests**, against a full run of ~50–64 s.

Two configuration points worth keeping:

- `jest-expo/web`'s `getPlatformPreset` **replaces** the base preset's babel
  options with `{caller}` alone, discarding the presets `jest-expo` injects
  programmatically via `resolveBabelOptions`. Fine for an app with a
  `babel.config.js`; this repo has none, so every `.tsx` failed with "Support for
  the experimental syntax 'jsx' isn't currently enabled". Fixed by overriding
  `transform` **in the web project only** — adding a root `babel.config.js` would
  have put 44 already-green suites at risk to fix a new one.
- `testMatch` must be overridden. The platform preset's own pattern is broad
  enough to sweep every existing suite into the web renderer.

## Coverage — and what is deliberately not covered

Eight surfaces, chosen where platform divergence has already bitten or would cost
most: `CrisisHelpSheet`, the delete-account flow, `ConsentManager`,
`DisclaimerBand`, `UpbeatButton`, `Wordmark` (including reversed),
`UpdatesSignupForm`, and the landing page. Pure logic — `transparency-math`,
`contrast`, `sheet-export-fields`, every `db` test — is **not** duplicated: no
renderer is involved, so a second run buys nothing.

Deliberate non-coverage, named so it is not mistaken for coverage:

- **Modal semantics and focus trap.** RNW's `<Modal>` renders through a portal on
  `document.body` with no dialog role and no trap. The crisis sheet's modal
  behaviour is only meaningfully assertable on native today.
- **`disabled` blocks focus.** jsdom does **not** implement this rule — verified:
  it focuses a disabled `<button>` happily. So defect (c) is caught by asserting
  the **attribute**, never `document.activeElement`. A focus-based assertion
  there would have passed vacuously while the control stayed unreachable in every
  real browser. This is the ADR 0013 trap in a new costume.
- **Screen-reader announcement.** jsdom has no accessibility tree. This project
  proves an attribute is present; it cannot prove anything is spoken. The manual
  keyboard/screen-reader pass that `.claude/rules/a11y.md` already requires is
  still required, and is listed in `docs/PRODUCTION_READINESS.md`.
- **Native.** `Platform.OS` is `"web"` here by construction. iOS/Android
  behaviour remains the `rn` project's job.

Shared expectations live in `tests/shared/contracts/` as plain data, with
`webOnly` / `nativeOnly` as **named fields both sides read**. Shared *test
bodies* were considered and rejected: the two projects cannot share a query
layer, so a shared body would abstract over an RNTL tree and a DOM and end up
testing the abstraction. Sharing the expectations kills the drift that matters —
the two suites disagreeing about what the screen should say — while each side
keeps its own honest queries.

## Consequences

### `unavailable()` is deleted

There is no way to put `aria-disabled` on a `role="button"` element in
react-native-web without the real `disabled` attribute coming too. The helper
could not do its job on the deploy target, and its only call site is gone, so it
is removed with the reasoning kept in `src/lib/a11y.ts` so nobody re-adds it.

The ARIA was also wrong on its own terms: `aria-disabled` means *perceivable but
not operable*, and a control that explains itself when pressed **is** operable.
The state is now carried in words — `accessibilityHint` on native,
`aria-describedby` on web, one carrier per platform because neither crosses over.

Considered and rejected: dropping `accessibilityRole="button"` so the element
renders as a `<div>` that escapes the enhancement branch, then hand-rolling the
WAI-ARIA button pattern (`role`, `tabIndex`, manual Enter/Space handling with
`preventDefault` on Space). That moves keyboard-activation correctness out of the
framework and into code we maintain — a real accessibility risk traded for a
tidier ARIA attribute. Not worth it for a control whose precondition is better
expressed in words anyway.

### A fourth latent gap, found while fixing the third

**`accessibilityHint` does not exist anywhere in react-native-web 0.21.2.** It is
dropped in total silence — the same failure mode as defect (2). Three components
use it. `UpdatesSignupForm` is fine: it pairs the hint with `aria-describedby`
deliberately, one carrier per platform. `PostCard` and `JourneyEntryCard` are
**not** — their hints ("Open this post from …", "Open this journey entry") simply
do not exist in a browser. Neither is safety-critical and neither is among the
eight ported surfaces, so this is recorded as a known gap rather than fixed
blind; the fix is the same two-carrier pattern.

### The flake fork

Adding a third project tipped this 6-core / 9.7 GiB WSL box past its concurrency
budget: four suites failed on 5 s timeouts and `AuthRetryableFetchError` from the
local auth container, never on an assertion, and all four passed in isolation.
`maxWorkers` is now `"50%"` and the web project gets a 20 s timeout. Two
consecutive full runs green — and faster than the flaky ones, because less
thrashing.

Recorded because misreading this costs days, and this repo has already paid once
in each direction:

- **Exit 137, a timeout, or a connection error under parallel load → the
  environment.** Confirm by running the suite in isolation.
- **A line that passes in isolation and fails in a full run → a defect until
  proven otherwise.** The "281/282" case sat on the wrong side of this fork for
  weeks; it was a racing non-wait, not WSL load (ADR 0013).

jsdom's missing `window.matchMedia` belongs on the first side. RNW's
`AccessibilityInfo` computes `prefersReducedMotionMedia` once at module load and
returns `undefined` from `addEventListener` when it is absent, so
`useReducedMotion`'s cleanup called `.remove()` on nothing and every component
using it threw on unmount. That is an artefact of the environment, not a product
defect — so the environment was fixed (a stub in the web setup, matching every
real browser) rather than the app bent around it. The hook is *also* made
defensive, because the baseline user is on an older device and the cost of being
wrong is a crash on the screen carrying the crisis affordance.

### `rnw-a11y-contract.test.ts` keeps a narrower job

It pins nine RNW behaviours by reading installed source. Five are now covered
directly by render. It stays as a **version-drift canary** — it fires on
`npm update` even for behaviours no rendered test happens to exercise, and it
costs milliseconds — with a header pointing here. `announceForAccessibility` being
a no-op on web is a function body rather than markup, so it remains source-only
and is genuinely worth keeping.

## Decision, in one line

**Any accessibility assertion about the deploy target must run under the deploy
target's renderer.**
