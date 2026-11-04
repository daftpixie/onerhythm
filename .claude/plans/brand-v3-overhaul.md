# Brand v3 Overhaul — Implementation Plan

Status: **AWAITING APPROVAL**
Spec: `docs/brand/OneRhythm_Brand_Guidelines_v3.md` (Authoritative)
Scope: colour re-skin + 1R mark. Behaviour-preserving. No copy, no data layer.

---

## 0. Pre-flight findings (read this first — two surprises)

### 0.1 The token files are dead code

`tailwind.config.js` and `global.css` define the full v2 token set. **Nothing
reads them.** There are **zero** NativeWind `className` props in `app/` or
`src/`. All 26 styled files use `StyleSheet.create` with **~316 raw hex
literals**.

ADR 0002 asserts "`tailwind.config.js` at the repo root is the single source of
truth for design tokens." That premise never shipped. A v3 migration that only
rewrote those two files would change **nothing on screen**.

**Resolution (approved):** introduce `src/theme/tokens.ts` as the real single
source. Components import it; `tailwind.config.js` imports it; the new contrast
tests import it. A token edit then changes the UI *and* trips the suite — which
is what Step 4c asks for. ADR 0002 gets a short amendment noting the correction.

### 0.2 Off-palette colours already in the tree

Four colours in use are not v2 tokens and are not in the retire list:

| Hex | Uses | Where | Note |
|---|---|---|---|
| `#155E75` teal | 10 | secondary/quiet actions | never a brand token |
| `#1B5E20` green | 4 | Verified badge, Published chip | not v2 `success` (`#2E7D32`) |
| `#6B5000` amber | 2 | disclaimer icon | darker than v2 `caution` |
| `#8A909C` grey | 1 | disabled consent row | not v2 `muted` |

They are swept to v3 values along with the real tokens. Flagged so the grep
count of 0 is honest about what it covers.

### 0.3 Baseline

| Suite | Result |
|---|---|
| jest `rn` (components + screens + unit) | **16/16 suites, 104 tests green** |
| jest `db` | **9 suites red — Docker Desktop not running in this WSL distro** |
| pgTAP | **not runnable — same cause** |
| `npm run typecheck` | clean |
| `npm run lint` | clean (1 pre-existing warning, under the `--max-warnings 5` gate) |

The `rn` project is the entire surface this re-skin touches, and it is green.
The `db` failures are all `AuthRetryableFetchError: fetch failed` — the stack is
down, not broken. **`docker` is not on PATH in this distro** (`npx supabase
start` fails with `LegacyDockerLifecycleInspectError`).

> **This blocks the commit, not the build.** `.githooks/pre-commit` runs
> `npm test`, which runs *both* projects. Docker Desktop must be up (with WSL
> integration enabled) before Step 6 can commit without `--no-verify` — and
> `.claude/rules/git.md` forbids `--no-verify`.

### 0.4 `OneRhythm_Brand_Guidelines_v2.md` is not in the repo

`docs/brand/` contains only v3. Step 6's "mark v2 SUPERSEDED" has no target.
v3's own §0 records what changed, so nothing is lost. Step 6 will instead note
the absence in `docs/prd/README.md` and ADR 0010.

---

## 1. Token migration map

### 1.1 The v3 token module — `src/theme/tokens.ts`

```ts
export const tokens = {
  paper:        '#FFFFFF',
  ink:          '#000000',
  inkSecondary: 'rgba(0,0,0,0.70)',
  inkTertiary:  'rgba(0,0,0,0.55)',
  line:         'rgba(0,0,0,0.12)',
  fill:         'rgba(0,0,0,0.04)',
  pulse:        '#E20A17',
} as const;

export const radius = { input: 8, card: 12 } as const;   // UNCHANGED
export const focus  = { width: 2, offset: 2 } as const;
```

### 1.2 Value map

| v2 value | v2 name | uses | → v3 | Rationale |
|---|---|---|---|---|
| `#FFFFFF` | paper | 69 | `tokens.paper` | unchanged value |
| `#1B1D23` | ink | 75 | `tokens.ink` `#000000` | v3 §3 — pure black, 21:1 |
| `#4A4F5C` | slate | 39 | `tokens.inkSecondary` | 8.45:1 |
| `#D7DBE2` | line | 10 | `tokens.line` | hairline 1px |
| `#F6F7F9` | mist | 7 | `tokens.fill` | card/input fill |
| `#A4133C` | heart | 74 | **split — see 1.3** | Pulse is reserved |
| `#155E75` | *(off-palette)* | 10 | `tokens.ink` | secondary/quiet → Ink |
| `#1B5E20` | *(off-palette)* | 4 | `tokens.ink` / retire | see 1.4 |
| `#8A6D00` | caution | 2 | `tokens.ink` | v3 §7 disclaimer border |
| `#6B5000` | *(off-palette)* | 2 | `tokens.inkSecondary` | disclaimer icon |
| `#1F6FA8` | calm | 1 | `tokens.ink` | crisis resource link |
| `#FDF2F5` | *(off-palette)* | 1 | **retire** | upbeat-on tint, see 1.5 |
| `#8A909C` | *(off-palette)* | 1 | **retire** | disabled, see 1.6 |
| `#6B7280` | muted | 1 | `tokens.inkTertiary` | placeholder, 4.74:1 |
| `rgba(0,0,0,0.5)` | — | 1 | unchanged | modal scrim, not a text token |

**Retired outright (must not survive):** `mist`, `cloud`, `slate`, `muted`,
`heart`, `heart-bright`, `calm`, `success`, `caution`, `danger` — exactly v3
§11's list. Plus the four off-palette values above.

**Kept, unchanged:** `radius-input` 8px, `radius-card` 12px, the Atkinson
Hyperlegible font stack, `--motion-fast`, `--motion-base`, the
`prefers-reduced-motion` block. Per v3 §11 and your hard rules.

**Inter: untouched this session** (your call). It stays loaded in
`src/hooks/useFonts.ts` and declared as `ui`/`ui-medium`/`ui-bold` in
`tailwind.config.js`. **No component uses it** — it is dead weight, logged as a
follow-up, not removed, because removing a font loader is a font-stack edit and
a first-paint timing risk.

### 1.3 Splitting `#A4133C` — where Pulse Red survives

v3 §3: Pulse Red is for the mark, the primary CTA, the active upbeat,
destructive actions. *"Never on more than one element in a viewport if
avoidable, never as the sole carrier of meaning."* So the 74 heart-deep uses
split:

**→ `tokens.pulse` (stays accent):**
- Primary CTA fills (`backgroundColor` + Paper text) — v3 §7 Primary
- Destructive button text + border, confirm-box border — v3 §7 Destructive
- `UpbeatButton` active state — v3 §7
- `AppShell` wordmark "Rhythm" — v3 §2
- `UpbeatButton` error text — v3 §7 (words already carry it; colour reinforces)

**→ `tokens.ink` (demoted):**
- Secondary buttons: `CommunityRow` join/leave, `feed`, `index` — v3 §7 Secondary
- `CrisisHelpSheet` trigger label — v3 §7 says *Ink text, Pulse Red mark, 1px
  Ink border*. The 🆘 glyph is the mark.
- `ActivityIndicator color` (3 sites) — spinners are not accents
- `HealthSelfIdConsent` checked-box fill — the ✓ glyph + `accessibilityState`
  carry the state; the consent screen's primary CTA already owns the one Pulse
- `RunwayMeter` bar fill — data, not accent; the percent lives in text anyway

### 1.4 Semantic colours — how meaning survives (WCAG 1.4.1 audit)

Every former semantic site, checked individually:

| Site | v2 carrier | Already has non-colour carrier? | v3 treatment |
|---|---|---|---|
| `PostCard.verified` | green text | ✅ `✔` icon + "Verified · general education" | Ink, bold |
| `CommentThread.verified` | green text | ✅ same | Ink, bold |
| `JourneyEntryCard.chipPublished` | green border | ✅ chip text reads "Draft"/"Published" + `accessibilityLabel` | **retire the style** — one Ink 12% border for both |
| `DisclaimerBand` | amber border + icon | ✅ `ℹ` icon + "Disclaimer" label | 3px Ink left border, Ink 70% icon, Ink 4% fill |
| `compose.tsx` notice | amber border + icon | ✅ same pattern | same |
| `CrisisHelpSheet` link | blue text | ✅ `textDecorationLine: underline` | Ink + underline retained |
| `HealthSelfIdConsent` disabled | grey text | ✅ `opacity 0.45` + `accessibilityState.disabled` | **retire `disabledText`** — opacity + a11y state carry it |
| `UpbeatButton` error | red text | ✅ `accessibilityRole="alert"` + full sentence | Pulse text retained |

**Result: no site relied on colour alone.** There is no latent 1.4.1 bug to
fix — every one of these already paired colour with an icon, a word, or an
accessibility state. That is the finding the a11y-reviewer will be asked to
falsify in Step 5.

### 1.5 The upbeat control (v3 §7 — the most visible Pulse Red)

State is carried by the **glyph** (`♥` vs `♡`), by `aria-pressed`, and by
`accessibilityState.selected` — never by colour. Colour only reinforces.

| | Not upbeated | Upbeated |
|---|---|---|
| glyph | `♡` | `♥` |
| text + border | `tokens.ink` | `tokens.pulse` |
| fill | `tokens.paper` | `tokens.paper` |

The `#FDF2F5` pink wash is retired — v3 forbids Pulse Red as a background wash.

### 1.6 Focus ring

21 sites currently: `{ outlineWidth: 3, outlineColor: "#1B1D23", outlineStyle: "solid" }`
→ v3 §5: `{ outlineWidth: 2, outlineColor: tokens.ink, outlineStyle: "solid", outlineOffset: 2 }`

3px → 2px is a v3-mandated change, not a regression: black-on-white is 21:1
(SC 1.4.11 needs 3:1), and the new 2px offset adds separation the old ring
lacked. RN 0.85 supports `outlineOffset` on native and RNW.

### 1.7 Verified contrast (computed, not quoted)

| Pair | Ratio | Needs | |
|---|---|---|---|
| Pulse `#E20A17` on Paper | **4.90:1** | 4.5 | ✅ matches v3 §3 exactly |
| Paper on Pulse | **4.90:1** | 4.5 | ✅ |
| Ink on Paper | **21.0:1** | 4.5 | ✅ |
| Ink 70% on Paper | **8.45:1** | 4.5 | ✅ |
| Ink 55% on Paper | **4.74:1** | 4.5 | ✅ |
| Focus ring vs Paper | **21.0:1** | 3.0 | ✅ |
| Focus ring vs Ink 4% | **19.26:1** | 3.0 | ✅ |
| **Pulse on Ink (reversed mark)** | **4.29:1** | 3.0 non-text | ⚠️ see below |

> **⚠️ Finding.** v3 §2 says of the reversed mark *"Red passes on black; verify
> at build."* Verified: **it does not pass 4.5:1 for text** (4.29:1). It passes
> 3:1 for graphical objects, so the heart *inside the mark* is fine. **Pulse Red
> must never be used for text on an Ink background.** Recorded in ADR 0010; no
> current site does this.

---

## 2. Component-by-component sweep

No font changes. No radius changes. Every row below is colour, border, or
spacing only.

### `src/components/` (11 files)

| File | Change |
|---|---|
| `AppShell.tsx` | header border → `line`; wordmark → new `<Wordmark/>` (mark + One/Rhythm); container → `paper` |
| `UpbeatButton.tsx` | full §1.5 restate; retire `#FDF2F5`; focus ring |
| `DisclaimerBand.tsx` | fill → `fill`; 3px left border → `ink`; icon → `inkSecondary`; body → `inkSecondary` |
| `CrisisHelpSheet.tsx` | trigger label → `ink`; resource link → `ink` + underline; sheet fill → `paper`; close btn → `fill`; scrim unchanged; focus ring |
| `PostCard.tsx` | card border → `line`; verified → `ink`; meta/counts → `inkSecondary`; **padding 16 → 24**; focus ring |
| `JourneyEntryCard.tsx` | card border → `line`; **retire `chipPublished`**; chip → `fill` + `line`; **padding 16 → 24**; focus ring |
| `JourneyEntryView.tsx` | secondary → `ink`; destructive + confirm box → `pulse`; body → `ink`; meta → `inkSecondary`; focus ring |
| `CommentThread.tsx` | left rule → `line`; verified → `ink`; reply → `ink`; meta → `inkSecondary`; focus ring |
| `CommunityRow.tsx` | row border → `line`; join button → Ink secondary treatment; **padding 16 → 24**; focus ring |
| `HealthSelfIdConsent.tsx` | checked box → `ink`; box border → `ink`; **retire `disabledText`**; explanation → `inkSecondary`; focus ring |
| `RunwayMeter.tsx` | track → `fill` + `line` border; fill → `ink`; detail → `inkSecondary` |

### `app/` (15 files)

| File | Change |
|---|---|
| `index.tsx` | primary CTA `pulse`; secondary → Ink; divider → `line`; focus ring |
| `feed.tsx` | primary `pulse`; secondary → Ink; spinner → `ink`; quiet link → `ink`; focus ring |
| `compose.tsx` | notice band → Ink left border + `fill`; quiet link → `ink`; spinner; focus ring |
| `posts/[id].tsx` | verified → `ink`; quiet link → `ink`; card borders → `line`; focus ring |
| `communities/index.tsx`, `communities/[slug].tsx` | borders → `line`; CTA split; focus ring |
| `journey/index.tsx`, `journey/editor.tsx`, `journey/entry/[id].tsx` | quiet links → `ink`; CTA split; borders → `line`; focus ring |
| `members/[id]/journey.tsx` | quiet link → `ink`; focus ring |
| `onboarding.tsx` | CTA split; focus ring |
| `settings/consent.tsx` | CTA split; borders → `line`; focus ring |
| `sign-in.tsx` | input fill → `fill`, border → `ink`; placeholder → `inkTertiary`; CTA `pulse`; focus ring |
| `auth/callback.tsx` | text → `ink`/`inkSecondary`; spinner |
| `transparency.tsx` | card borders → `line`; text tiers; **card padding → 24** |
| `_layout.tsx` | no colour — untouched |

### Config

| File | Change |
|---|---|
| `src/theme/tokens.ts` | **new** |
| `tailwind.config.js` | colours → v3 (imports `tokens.ts`); `fontFamily` + `borderRadius` **untouched** |
| `global.css` | `:root` colour vars → v3 §11; font/radius/motion vars **untouched** |
| `app.json` | icon/favicon/adaptiveIcon → `assets/brand/icons/*` (currently points at the retired v2 ECG artwork) |

**Shadows:** grep found **zero** `shadow*` properties anywhere. Nothing to
replace — v3 §5's "no shadows" rule is already satisfied. Whitespace still
increases (cards 16 → 24px padding, 8 sites).

---

## 3. The 1R mark

Assets are already in place and complete (`assets/brand/`, with a README, a
regenerate script, and `svg/1r-mark.svg` as the stated source of truth). The
mark's own SVG already uses `#E20A17` for the heart — it is v3-native.

**New: `src/components/Wordmark.tsx`**

```
<Wordmark variant="primary" | "reversed" | "mono" size={n} />
```

- Mark rendered inline via `react-native-svg` (already a dependency) — crisp at
  every density, and the heart can be driven from `tokens.pulse`.
- Lockup: mark + `One` in `tokens.ink` + `Rhythm` in `tokens.pulse`, Atkinson
  Hyperlegible **Bold** (the existing `AtkinsonHyperlegible_700Bold` face — no
  new font loading).
- `accessibilityRole="header"`, accessible name **"OneRhythm"** (per the asset
  README's alt-text rule). The mark itself is `aria-hidden` so screen readers
  hear the name once, not twice.
- `reversed` = Paper letterforms + Pulse heart; `mono` = single-colour knockout.
- Replaces the text-only wordmark in `AppShell`.

**Favicons.** Verified present and correctly sized: 16×16 (460 B), 32×32
(775 B), 512×512 (10.9 kB), plus `favicon.ico` (16/32/48 multi),
`apple-touch-icon` 180, maskable 512. I will **visually inspect the 16px and
32px renders** against v3 §2's "enlarged and simplified heart" note and report
whether they hold up — and say so plainly if they do not, rather than assert
they are crisp because the files exist.

`app.json` currently points at `./assets/icon.png` and `./assets/favicon.png`,
which are the **retired v2 ECG-heart artwork**. Repointed to `assets/brand/`.

---

## 4. Test-impact inventory — SANCTIONED AMENDMENTS FOR APPROVAL

Only **4 assertions** in the whole suite reference a v2 colour. Every other
test — all 104 — asserts behaviour, glyphs, target size, typography, or radius
and must pass **untouched**.

**Amendment 1 — `tests/components/DisclaimerBand.test.tsx:39-47`**
```diff
-  it("has Mist background fill", () => {
+  it("has the Ink 4% fill (v3 §7)", () => {
       ...
-    expect(flatStyle.backgroundColor).toBe("#F6F7F9");
+    expect(flatStyle.backgroundColor).toBe(tokens.fill);
```

**Amendment 2 — `tests/components/DisclaimerBand.test.tsx:49-58`**
```diff
-  it("has 3px Caution left border", () => {
+  it("has a 3px Ink left border (v3 §7)", () => {
       ...
     expect(flatStyle.borderLeftWidth).toBe(3);
-    expect(flatStyle.borderLeftColor).toBe("#8A6D00");
+    expect(flatStyle.borderLeftColor).toBe(tokens.ink);
```
*(`borderLeftWidth: 3` is unchanged — v3 §7 keeps the 3px rule.)*

**Amendment 3 — `tests/components/DisclaimerBand.test.tsx:60-68`**
```diff
-  it("text color is Slate", () => {
+  it("text colour is Ink 70% (v3 §3)", () => {
       ...
-    expect(flatStyle.color).toBe("#4A4F5C");
+    expect(flatStyle.color).toBe(tokens.inkSecondary);
```

**Amendment 4 — `tests/components/JourneyEntryView.test.tsx:113-123`**
```diff
-  it("the confirm button wears the Brand v2 destructive treatment (Paper fill, Heart Deep border)", () => {
+  it("the confirm button wears the v3 destructive treatment (Paper fill, Pulse Red border)", () => {
       ...
-    expect(style.backgroundColor).toBe("#FFFFFF");
-    expect(style.borderColor).toBe("#A4133C");
+    expect(style.backgroundColor).toBe(tokens.paper);
+    expect(style.borderColor).toBe(tokens.pulse);
     expect(style.minHeight).toBeGreaterThanOrEqual(44);
```
*(`backgroundColor` is Paper in both v2 and v3 — the value does not change, only
the literal becomes a token. `minHeight` untouched.)*

**Nothing else is touched.** Specifically these stay exactly as they are:
- all 5 `UpbeatButton` tests (glyph, count, rollback, no-downvote, 44px)
- all 3 `AppShell` tests (crisis affordance, children, accessible label)
- `RunwayMeter` "never renders information by color alone"
- `JourneyEntryCard` "status is TEXT, never color alone"
- all 4 screen tests, all 3 unit tests, all 9 db tests, all 35 pgTAP assertions

### 4.1 New — `tests/unit/contrast.test.ts`

A real WCAG relative-luminance implementation (sRGB linearisation + the 0.05
offset), applied to `tokens.ts` values — including alpha compositing over Paper
for the `rgba` tiers, so `inkSecondary`/`inkTertiary` are measured as rendered,
not as declared.

Asserts: Pulse↔Paper ≥ 4.5 both directions · Ink, Ink 70%, Ink 55% on Paper
≥ 4.5 · focus ring ≥ 3.0 against both Paper and Ink 4% · plus a guard that
Pulse-on-Ink is **only** claimed at the 3:1 non-text bar (documenting §1.7).

Because it imports `tokens.ts` — the same module the components import — any
future token edit fails the suite *and* moves the UI. That is the durable win.

### 4.2 New — `tests/unit/typeface.test.ts`

Walks the rendered tree of the long-form/body components (`JourneyEntryView`,
`PostCard`, `CommentThread`, `DisclaimerBand`) and asserts every text node
resolves to an `AtkinsonHyperlegible_*` family — pinning v3 §10.1 mechanically.
Also asserts no node resolves to an `Inter_*` family, which pins the "Atkinson
is the reading face" rule without touching the font stack.

---

## 5. Accessibility plan, per screen

Every screen gets the same four checks; the two rows in **bold** are where the
risk actually is.

1. Text contrast ≥ 4.5:1 at the new values — mechanically covered by §4.1.
2. Focus ring visible on Paper *and* on Ink 4% fills, 2px + 2px offset, present
   on all 21 interactive sites, never removed.
3. Target sizes unchanged — 44px primary, 24px minimum. No size touched.
4. **No state conveyed by colour alone** — the §1.4 table, re-verified per site
   by the a11y-reviewer rather than trusted from this plan.
5. **🆘 crisis affordance renders on every route** — `AppShell` is being edited
   for the wordmark, and a silent failure to render 🆘 is a *safety* incident
   per `.claude/rules/a11y.md`, not a UI bug. The 3 `AppShell` tests must pass
   untouched.

---

## 6. Order of work

1. `src/theme/tokens.ts` → `tailwind.config.js` → `global.css`
2. `src/components/Wordmark.tsx` + `app.json` icon repoint
3. Sweep `src/components/` (11), then `app/` (15)
4. Grep for every retired value — **must report 0**
5. Add `contrast.test.ts` + `typeface.test.ts`; apply the 4 amendments
6. Full green: `rn` + `db` + pgTAP + lint + typecheck + 5 guards
7. a11y-reviewer, then privacy-reviewer
8. Visual pass 1440 / 900 / 380px
9. ADR 0010 + ADR 0002 amendment + SESSION_LOG + CLAUDE.md brand ref → v3
10. Commit. **STOP** — no landing page.

## 7. Rollback

Single commit on `main`, no migrations, no data touched — `git revert` is a
complete undo. `tokens.ts` is additive; the old hex values are recoverable from
the diff.
