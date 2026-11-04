# Plan — a `web` jest project (jsdom + react-native-web)

Status: **awaiting approval**. Nothing below is built yet.

## Why

The jest suite runs entirely under the React Native native renderer. Web is the
primary — currently the only — deploy target. Every accessibility assertion we
have checks the prop a component *intended* to set, never what a browser
receives. Two web-only defects have shipped green through that gap:

1. `accessibilityState={{disabled}}` is inert on web (`createDOMProps` contains
   zero references to it), so a destructive control announced as merely
   "button". Passed **208/208**.
2. `importantForAccessibility` is dropped by RNW's `Text` allowlist in silence,
   so the 🆘 in the safety-critical crisis-sheet title was never hidden on web.

This is the same class as the hollow typeface guard, but systematic: it is not
one bad test, it is an entire renderer we never exercise.

## What the spike already proved (measured, not assumed)

Checking installed source has beaten assumption repeatedly on this project, so
the config below was run before being written down.

### The preset works, but not on its own

`preset: "jest-expo/web"` supplies exactly what we want, verified in
`node_modules/jest-expo/config/getPlatformPreset.js`:

- `testEnvironment: 'jsdom'`
- `moduleNameMapper: {'^react-native$': 'react-native-web'}` — the same alias
  the Expo web build uses
- babel `caller.platform = 'web'`, so `Platform.OS` inlines to `"web"` and
  `hiddenFromAssistiveTech()` takes its web branch honestly
- `haste.defaultPlatform = 'web'` + web-first `moduleFileExtensions`

**But it fails in this repo as shipped.** `getPlatformPreset` overwrites the
base preset's babel options with `{caller}` *only*, discarding the `presets` the
base preset injects via `resolveBabelOptions`. That is fine for a normal Expo
app, which has a `babel.config.js` — **this repo has none**; it only ever used
the base `jest-expo` preset, which injects `expo/internal/babel-preset`
programmatically. Result, reproduced: `Support for the experimental syntax 'jsx'
isn't currently enabled`.

Two fixes considered:

- **(a) Add a `babel.config.js`.** Standard for Expo, but it changes how babel
  resolves for the existing 44 green suites. Rejected: it puts every currently
  passing test at risk to fix a new one.
- **(b) Override `transform` in the `web` project only** — re-add
  `presets: [require.resolve("expo/internal/babel-preset")]` with
  `caller.platform = "web"`. **Recommended.** Self-contained; the `rn` and `db`
  projects are untouched.

### RNTL cannot be the query layer on web

`@testing-library/react-native` renders through `react-test-renderer`. Under the
web preset its semantic queries **all throw**:

| query | result under RNW |
|---|---|
| `getByText` / `getByRole` / `getByLabelText` | `THREW: __fbBatchedBridgeConfig is not set, cannot invoke native modules` |
| `UNSAFE_getByProps` | OK |

Even if that were worked around, `react-test-renderer` never mounts a DOM. It
yields DOM-*shaped* props but no `document`, so `document.activeElement`, focus
order, and real ARIA name computation are untestable — and focus management is
load-bearing for the delete-account flow the a11y reviewer already forced fixes
into.

**Therefore the `web` project renders with `react-dom/client` and queries with
`@testing-library/dom`.** That is what "test under the deploy target's renderer"
actually means: `react-dom` is what runs in the browser; `react-test-renderer`
is not.

Dependencies: **no new package downloads.** `react-dom` 19.2.3 is already a
direct dependency; `@testing-library/dom` 10.4.1 and `@testing-library/jest-dom`
6.9.1 are already in `node_modules` (transitively, via RNTL). I propose
**declaring** the two testing-library packages as explicit `devDependencies` —
they are already installed, and depending on another package's transitive tree
is the kind of quiet assumption this session exists to remove.

Small setup detail: the project needs `IS_REACT_ACT_ENVIRONMENT = true` in a
setup file, plus a `mount()` helper (create container → `createRoot` → `act`)
and DOM cleanup between tests.

### `react-native-svg` on web

Resolves to its own web build — `lib/commonjs/ReactNativeSVG.web.js` and
`elements.web.js` — selected by `haste.defaultPlatform = 'web'` and the
web-first `moduleFileExtensions`. So `<Svg>` becomes a real `<svg>` DOM node,
which is the configuration in which the `importantForAccessibility` DOM leak was
originally diagnosed. The Wordmark test will confirm this rather than trust it.

### The spike found a THIRD web-only defect, unprompted

Rendering `unavailable(true)` on a `Pressable` with `accessibilityRole="button"`
produces:

```html
<button aria-disabled="true" disabled="" role="button" tabindex="0" ...>
```

`createDOMProps/index.js:314-319` — when `disabled === true` and the element type
is `button|form|input|select|textarea`, RNW sets `domProps.disabled = true` to
"enhance with native semantics", *in addition to* `aria-disabled`.

A disabled `<button>` is not focusable in a real browser, `tabindex="0"`
notwithstanding. So `unavailable()` — written precisely to keep the control in
the Tab order so a keyboard-only member learns *why* it is grey — **is defeated
on web at its only call site**: `src/components/DeleteAccountPanel.tsx:252-257`
sets `accessibilityRole="button"` and `unavailable(!armed)` on the same element.

Note what this says about the current mitigation: `rnw-a11y-contract.test.ts`
reads RNW's source and passes, because the behaviour it pins is real — it just
does not pin *this* line. Reading source catches what you thought to read.
Rendering catches what you did not. This defect is a Step C fix, not a Step B
claim, and it is listed below as an expected finding.

## The `web` project config

A third project beside `rn` and `db`:

```js
{
  displayName: "web",
  preset: "jest-expo/web",
  setupFilesAfterEach: ["<rootDir>/tests/web/setup.ts"],
  testMatch: ["<rootDir>/tests/web/**/*.test.{ts,tsx}"],
  transform: {
    "\\.[jt]sx?$": ["babel-jest", {
      root: __dirname, babelrc: false, configFile: false,
      presets: [require.resolve("expo/internal/babel-preset")],
      caller: { name: "metro", bundler: "metro", platform: "web" },
    }],
  },
}
```

`testMatch` must be overridden: the platform preset's own pattern is broad
(`**/?(*.)+(spec|test).[jt]s?(x)`) and would sweep up all 44 existing suites.

## Which tests run under `web`

Not all 343. Duplicating pure logic (`transparency-math`, `contrast`,
`sheet-export-fields`, every `db` test) buys nothing — no renderer is involved.
The `web` project covers surfaces where platform divergence has already bitten,
or where it would be most costly:

| Surface | Why |
|---|---|
| `CrisisHelpSheet` | Safety-critical. Already had a silent hiding failure. A crisis affordance that fails to render or announce is a safety incident, not a UI bug. |
| `DeleteAccountPanel` + delete-account flow | Where the `aria-disabled` regression lived, and where the new `<button disabled>` defect lives. Focus behaviour is only testable in a real DOM. Irreversible action. |
| `ConsentManager` / consent screen | Consent is a legal surface; a control that misreports its state misreports a legal state. |
| `DisclaimerBand` | Persistent, non-dismissible, on every screen. |
| `UpbeatButton` | Carries state as icon + text (Brand v3 §7); the state carrier is exactly what RNW transforms. |
| `Wordmark` (incl. reversed) | The `<Svg>` → real `<svg>` prop-leak path. |
| `UpdatesSignupForm` | Validation + the success live region. Its live-region assertions are already known vacuous (see ADR 0013 work) — the DOM is where "did it actually announce" becomes answerable. |
| Landing page (`app/index.tsx`) | The only page a stranger sees today, and the only one currently deployed. |

Eight surfaces. Everything else stays native-only, deliberately.

## Shared vs duplicated test code

The brief asks for shared bodies parameterized by project. **The spike shows
that is not honestly achievable for render tests**, because the two projects
cannot share a query layer: `rn` queries an RNTL tree, `web` queries a DOM. A
"shared" body would have to abstract over both and would end up testing the
abstraction.

What I propose instead, which keeps the actual goal — no silent drift:

1. **Shared fixtures and props**, in `tests/shared/fixtures/`, imported by both
   projects. Divergent *input* is the drift that matters most and this kills it.
2. **A per-surface expectation contract** as plain data — e.g.
   `tests/shared/contracts/crisis-help-sheet.ts` listing the accessible names,
   roles, and hidden-ness each renderer must produce. Native and web tests each
   assert against the same list through a thin adapter. A platform-specific
   expectation becomes a named, commented field (`webOnly` / `nativeOnly`) in
   one file both sides read — visible, not silent.
3. Where a surface genuinely has no shared shape, a separate file with an
   explicit comment naming the exception and why.

This is the same guarantee the brief wants, arrived at without pretending two
renderers are one.

## `rnw-a11y-contract.test.ts` — keep it, with a narrowed job

It pins nine RNW behaviours by reading installed source. **Keep it**: it is a
version-drift canary that fires on `npm update` even for behaviours no rendered
test happens to exercise, and it costs milliseconds.

After the `web` project lands, five of its nine assertions are covered directly
by render:

| Assertion | Now covered by render? |
|---|---|
| Pressable overwrites caller `aria-disabled` | **Yes** — pass it directly, assert absent |
| `createDOMProps` derives `aria-disabled` from `accessibilityDisabled` | **Yes** |
| `createDOMProps` ignores `accessibilityState` | **Yes** — pass only it, assert no `aria-disabled` |
| `accessibilityLiveRegion` → `aria-live` | **Yes** |
| `accessibilityLabel` → `aria-label`, `aria-level` | **Yes** |
| `disabled` removes from Tab order | Partly — we do not use `disabled` |
| Pressable honours explicit `tabIndex` | No — unused path |
| `accessibilityDisabled` survives `_excluded` | Indirectly, via the outcome |
| `announceForAccessibility` is a no-op on web | **No** — a function body, not markup. Source-only, and worth keeping |

Its header comment should be updated to say it is no longer the primary
defence, and to point at the `web` project.

## Proof plan (Step C1) — before porting anything broadly

A test project that cannot catch the bugs that motivated it is theatre. So:

1. Revert `unavailable()` to `accessibilityState`-only. Expect `web` **RED**,
   `rn` still green. Restore.
2. Revert `hiddenFromAssistiveTech()` to always return
   `importantForAccessibility`. Expect `web` **RED** on the Wordmark `<svg>` and
   the crisis-sheet glyph, `rn` still green. Restore.

Both results reported as evidence, including the `rn`-stays-green half — that
contrast *is* the finding.

## Expected new defects

Listed now so they are predictions, not hindsight:

- **Confirmed already:** `<button disabled>` from `unavailable()` at
  `DeleteAccountPanel.tsx:252`. Needs a fix that keeps the control focusable —
  likely dropping `accessibilityRole="button"` on that element, or not routing
  through a tag RNW "enhances". Safety-critical destructive flow → a11y-reviewer
  charged to falsify.
- Suspected: heading levels (`aria-level`) on `Text accessibilityRole="header"`
  render as `<h1>` regardless of nesting; the landing page and panels set
  `aria-level` and this is the first time the real tag is visible.
- Unknown: whatever the landing page does on first contact with a DOM.

## Cost

Measured: cold single-suite web run ≈ **5.2 s** (jsdom + RNW module graph),
against a full current run of ≈ 33–38 s for 44 suites in two projects. Eight web
suites should land in the **10–20 s** range; the true figure gets reported in
Step E rather than guessed at here.

## Recommendation: run all three everywhere

`npm test` and the pre-commit chain should run **all three projects**.

The reasoning is the whole point of this session: the pre-commit chain is what
gates a commit, and a renderer that is only checked in CI is a renderer whose
defects get committed. The two defects that shipped green shipped green *through
a passing pre-commit run*. 10–20 s on a 38 s baseline is a real cost and still
much cheaper than the review cycles these defects have already consumed.

If that proves too slow in practice, the fallback is `web` on pre-push + CI —
but I recommend against starting there.

## Standing rule (→ ADR 0014)

**Any accessibility assertion about the deploy target must run under the deploy
target's renderer.**
