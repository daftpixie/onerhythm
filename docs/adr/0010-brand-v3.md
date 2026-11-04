# ADR 0010 — Brand v3: the VT Infinite colour system, the 1R mark

Status: Accepted
Date: 2026-08-06
Supersedes: Brand Guidelines v2 (colour system only)
Supersedes-in-part: ADR 0002 (NativeWind styling system) — see §6

Status note (2026-10-28): references here to VT Infinite, Inc. as a public benefit
corporation (PBC) reflect what was believed when this was written. The PBC
conversion is drafted and has not been filed; see ADR 0007 as corrected on
2026-09-26. Left unchanged below as the historical record.

## Context

VT Infinite, Inc. (PBC, d/b/a OneRhythm) is unifying its properties under one
house visual system. Brand Guidelines v3 supersedes v2. v3 is explicit that this
is "a re-skin, not a redirection": colour and the identity mark change; typography,
geometry, voice, motion, safety components, and every WCAG 2.2 AA requirement do not.

## Decision

Adopt the v3 colour system — monochrome plus exactly one accent — and the 1R mark.

| | Value | Role |
|---|---|---|
| Paper | `#FFFFFF` | the only background |
| Ink | `#000000` | all text, all rules |
| Ink 70% | `rgba(0,0,0,0.70)` | secondary text, metadata |
| Ink 55% | `rgba(0,0,0,0.55)` | tertiary |
| Ink 12% | `rgba(0,0,0,0.12)` | hairline borders |
| Ink 4% | `rgba(0,0,0,0.04)` | card and input fills |
| Pulse Red | `#E20A17` | the single accent |

**Why the colour system is the family signal.** What OneRhythm adopts from the
house guide is the *palette* — monochrome, opacity for hierarchy, austerity.
Colour carries most of brand recognition, so adopting it is what makes OneRhythm
visibly a VT Infinite product. That is also why the divergences below are safe:
they depart on type and geometry while the family signal stays intact.

**Hierarchy comes from opacity and weight, never from a third colour.** There are
no greys in this system; there is black at a stated opacity. Semantic state
colours are retired — a state is carried by icon + text label + weight, which
WCAG 1.4.1 requires regardless.

## Measurements (computed, not quoted)

All verified in `tests/unit/contrast.test.ts`, which computes from the shipped
token values rather than restating them.

| Pair | Ratio | Bar | |
|---|---|---|---|
| Pulse Red on Paper | **4.90:1** | 4.5 text | pass |
| Paper on Pulse Red | **4.90:1** | 4.5 text | pass |
| Ink on Paper | 21.0:1 | 4.5 | pass |
| Ink 70% on Paper | 8.45:1 | 4.5 | pass |
| Ink 55% on Paper | 4.74:1 | 4.5 | pass |
| Focus ring on Paper | 21.0:1 | 3.0 | pass |
| Focus ring on Ink 4% | 19.26:1 | 3.0 | pass |
| **Pulse Red on Ink** | **4.29:1** | — | **see below** |

### Binding constraint — Pulse Red is never text on Ink (amends v3 §2)

v3 §2 says of the reversed mark: *"Red passes on black; verify at build."*
Verified — and the answer is more specific than the spec implies.

Pulse Red on Ink measures **4.29:1**. That clears SC 1.4.11's 3:1 bar for
**graphical objects**, so the heart inside the reversed mark is fine. It **fails**
SC 1.4.3's 4.5:1 bar for **text**.

**Pulse Red must never be used for text on an Ink background.** No current site
does. Both bounds are pinned in the contrast suite — the lower bound so the mark
stays legible, and the upper bound so that raising the token past the text bar
cannot silently license a usage the brand forbids.

## Divergences from the VT Infinite house guide (v3 §10)

Recorded so no one "corrects" these later.

1. **Typography is Atkinson Hyperlegible, not JetBrains Mono.** Monospace forces
   uniform character width, which measurably slows prose reading. Atkinson
   Hyperlegible was engineered by the Braille Institute to maximise character
   distinction for low-vision readers. OneRhythm's baseline user is 65+ with
   reduced vision, WCAG 2.2 AA is build-blocking, and PRD §9 wins conflicts by
   rule. **This divergence is not up for revision.** It is now pinned
   mechanically by `tests/unit/typeface.test.tsx` rather than by prose alone.
2. **Soft corners (8px inputs/buttons, 12px cards), not 0 radius.** Rounded reads
   calm; sharp reads technical. For a population managing cardiac fear, calm wins.
3. **One accent colour exists.** The house guide is strictly monochrome. The mark
   contains a heart, and the heart is the product's meaning. Pulse Red passes
   4.5:1, so it is used as a text-safe accent, sparingly — most visibly on the
   upbeat control, where the community's positive-only feedback lives.
4. **Voice stays warm.** The house register is unblinking and exact; OneRhythm
   speaks to people in distress. Plain, humble, never dismissive.

## Retired colour tokens (must not survive)

The ten named by v3 §11:

`mist` · `cloud` · `slate` · `muted` · `heart` · `heart-bright` · `calm` ·
`success` · `caution` · `danger`

Plus four **off-palette** values found in the tree that were never v2 tokens and
so appear on no published retire list — recorded here because a grep that omits
them would report a false zero:

| Hex | Uses | Was | Now |
|---|---|---|---|
| `#155E75` teal | 10 | secondary / quiet actions | Ink |
| `#1B5E20` green | 4 | Verified badge, Published chip | Ink / retired |
| `#6B5000` amber | 2 | disclaimer info icon | Ink 70% |
| `#8A909C` grey | 1 | disabled consent row | retired entirely |

Also retired: `#FDF2F5` (upbeat pink wash — v3 §3 forbids Pulse as a background)
and `#ECEEF2` (unused).

**Kept unchanged:** every font stack, `radius-input` 8px, `radius-card` 12px, the
motion durations, and the `prefers-reduced-motion` block. Inter remains loaded but
unused — v3 §4 permits it as a fallback, and removing a font loader is a
typography change this re-skin deliberately did not make. Flagged as follow-up.

## WCAG 1.4.1 — retiring semantic colour cost no meaning

Each of the eight former semantic-colour sites was audited individually before
the sweep, and adversarially re-audited by the a11y-reviewer afterwards. **None
relied on colour alone**; every one already paired colour with an icon, a word,
or an accessibility state.

| Site | Non-colour carrier that was already present |
|---|---|
| PostCard / CommentThread verified badge | `✔` icon + "Verified · general education" |
| JourneyEntryCard status chip | chip text reads "Draft"/"Published" + `accessibilityLabel` |
| DisclaimerBand | `ℹ` icon + "Disclaimer" label |
| compose.tsx notice | same icon + label pattern |
| CrisisHelpSheet resource link | `textDecorationLine: underline` |
| HealthSelfIdConsent disabled row | `opacity` + `accessibilityState.disabled` |
| UpbeatButton error | `accessibilityRole="alert"` + full sentence |
| UpbeatButton state | the glyph itself (`♥` vs `♡`) + `aria-pressed` |

**Falsification result: 7 of the 8 survive; 1 is qualified.** The reviewer was
charged to break this claim, not confirm it, and it did not come back clean.

`UpbeatButton` state (row 8) is the one site where **no word changes** between
states — the label reads "Upbeat · N" whether or not you have upbeated. Its
sighted non-colour carrier is a bare 16px glyph swap, `♥` vs `♡`. That still
satisfies 1.4.1 to the letter: shape is a non-colour visual means, so colour is
not the *only* carrier, and `aria-pressed` / `accessibilityState.selected` carry
it programmatically. But a filled-vs-hollow heart at 16px is a materially weaker
distinction than the icon+word pairing every other site uses, and this project's
stated baseline user is 65+ with reduced vision. Colour was doing more real work
here than "reinforcement" admits.

**Not fixed in this commit, deliberately.** The fix is a copy change — e.g.
"Upbeat · N" → "Upbeated · N" — and this commit is a presentation-only re-skin.
`tests/components/UpbeatButton.test.tsx` pins the exact strings at four
assertions, so changing the label needs a founder-sanctioned test amendment
under the TDD rule rather than a quiet edit inside a colour commit. Logged as
the first follow-up. The colour distinction remains in place meanwhile, so
nothing regressed; the site is simply weaker than the other seven and now says
so out loud instead of being recorded as uniformly clean.

The remaining seven needed no new affordance, which is why the palette could be
retired without adding one.

### What the adversarial pass caught that the pre-sweep audit did not

**BLOCKING, fixed here — `Wordmark.tsx` violated this ADR's own binding
constraint.** The lockup set "Rhythm" to `tokens.pulse` unconditionally, while
the letterforms switched to Paper for `variant="reversed"`. The first use of the
reversed lockup as documented would therefore have rendered Pulse Red **text** on
an Ink background at 4.29:1 — the precise thing the constraint above forbids,
shipped inside the component that introduces the constraint. Now the accent
applies only to the primary lockup; reversed takes Paper, mono follows its
single-colour contract, and the heart inside the mark keeps the accent in every
variant (graphical, 3:1 bar, passes).

This is worth recording as a method note: `tests/unit/contrast.test.ts` proves
the *ratios* but only ever sees raw token PAIRS. It structurally cannot see which
token a component hands to a `<Text>`. Token-level contrast tests are necessary
and not sufficient. `tests/components/Wordmark.test.tsx` closes that gap for the
one component that renders the accent as text, and was verified to fail (2 red)
against the defect before the fix.

**Also fixed here:** `markOnly` set `accessibilityRole="image"` and a label on a
`View` without `accessible`, so the wrapper was never exposed as one element —
and since the SVG inside is deliberately `aria-hidden`, the mark announced
**nothing at all** rather than "OneRhythm".

**Pre-existing, NOT introduced by this diff, deferred — native focus rings.**
Every focus ring in the app is gated on `focused` from the `Pressable` style
callback, which is a react-native-web runtime concept; there is no `onFocus`/
`onBlur` fallback anywhere in `src/` or `app/`. On web the ring is excellent
(2px Ink, 21:1 on Paper, 19.26:1 on the 4% fill). On iOS/Android there is no
app-rendered focus indicator for hardware-keyboard or switch-control users. This
predates v3 and touching it means changing interaction behaviour in every
interactive component — out of scope for a colour re-skin, but it is a
build-blocking a11y gap under `.claude/rules/a11y.md` and belongs on the launch
gates, not in a backlog.

## Consequences

- `src/theme/tokens.ts` is the single source of colour. Guard #7
  (`.claude/hooks/no-raw-color-literals.sh` — the seventh guard, carried by the
  sixth script; `secrets-pii-scan.sh` implements two) blocks hex and `rgb()/rgba()/hsl()`
  literals everywhere else under `src/` and `app/`. It covers functional notation
  because three v3 tokens are authored as `rgba(0,0,0,x)` — a hex-only guard
  would have let exactly the new tokens drift back into components.
- The contrast suite computes from that module, so a token edit both moves the UI
  and trips the tests. Verified by deliberately drifting Pulse Red and confirming
  three assertions fail.
- Depth is hairline rules only. No shadows were found anywhere in the tree, so
  v3 §5's no-shadow rule was already satisfied; that line item reduced to spacing.
- Pulse Red survives at exactly 18 sites: 11 primary CTA fills (one per screen),
  3 destructive, 3 upbeat-active, 1 wordmark.

### A token defined but never applied — the same drift, caught late

Recovering this work after a power interruption turned up `space.section` (48px)
declared in `tokens.ts` and referenced by **nothing**. `space.card` had been
applied to all four card components; the section half of v3 §5 had been defined
and then quietly skipped. The screens still rendered, and every test still
passed — the spacing was simply never adopted.

This is precisely the failure guard #7 exists to prevent, one layer up: a value
that looks authoritative because it lives in the token module, but that no
surface actually reads. A colour literal in a component is a value the contrast
suite cannot see; an unused token is a value the *design system* cannot see. The
first is now mechanically blocked, the second is not.

Closed in this commit at the two surfaces with genuine section structure —
`app/index.tsx` (landing, 32→48px) and `app/transparency.tsx` (six headings on a
long document; 12px marginTop → 48, which with the container's 12px gap gives
60px, inside the 48–64 band). Deliberately **not** applied to
`app/settings/consent.tsx`, whose style is named `section` but is a bordered
card: 48px of padding inside a small settings card reads as bloat, not calm. The
list screens (`/feed`, `/journey`, `/communities`) space cards on a 12px list
rhythm, which is not section separation.

No guard is proposed for unused tokens — an export-usage check would be noise
against a module whose whole purpose is to be imported selectively. Recorded
here instead so the next re-skin knows to grep for adoption, not just definition.

## §6 — ADR 0002 is superseded in part

ADR 0002 states that `tailwind.config.js` "is the single source of truth for
design tokens" and that "all components use `className` props (NativeWind)".

**That premise never shipped.** There is not a single NativeWind `className` in
`app/` or `src/`; all 26 styled files use `StyleSheet.create`. The Tailwind
`colors` block and the `global.css` `:root` colour variables were read by nothing
— dead duplication that the contrast suite structurally could not see. Both
colour blocks are deleted, with pointer comments, rather than mirrored: CSS and
CommonJS cannot import the TS module without inventing a build step.

NativeWind is still installed and still compiles the `@tailwind` directives.
**Whether to adopt classNames at all is deliberately NOT decided here** — it is
an architectural question that deserves its own session and its own ADR, not a
side effect of a colour re-skin.

## Note on the v2 document

`docs/brand/OneRhythm_Brand_Guidelines_v2.md` is **not present in this repo** —
`docs/brand/` has only ever contained v3. There was therefore nothing to mark
superseded. v3 §0 records what changed and what did not, so no history is lost.
`docs/prd/README.md` now lists v3 as the only authoritative brand document.

## Monitored

v3 §3 notes that pure black on pure white is maximum contrast but can cause
halation for some readers with astigmatism. This is a single token change
(`ink` → `#1B1D23`, still 16.9:1) if member feedback ever shows strain. Ship pure
black; watch for it.

## References

- `docs/brand/OneRhythm_Brand_Guidelines_v3.md` (authoritative)
- `.claude/plans/brand-v3-overhaul.md`
- `tests/unit/contrast.test.ts`, `tests/unit/typeface.test.tsx`
- ADR 0002 (superseded in part), ADR 0009
