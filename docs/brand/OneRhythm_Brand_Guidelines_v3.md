# OneRhythm — Brand Guidelines v3

*The VT Infinite house system, adapted for an accessibility-first care product*

**Version:** 3.0 · **Status:** Authoritative · Supersedes Brand Guidelines v2
**Companion to:** VT Infinite Brand & Style Guide, OneRhythm PRD v1.0 (+ Amendments 1–2), Wireframes
**Binding rule, unchanged from v2:** where this document and PRD §9 accessibility ever conflict, **§9 wins.**

---

## 0. What changed in v3, and what did not

**Changed — visual style only:**
- The identity mark is now **1R** (numeral one + R, heart in the R's counter), replacing the continuous-line ECG heart.
- Color moves to **monochrome + exactly one accent**. Pure black and white, hierarchy by opacity.
- Semantic state colors are **retired** — states are carried by icon + text + weight.
- Whitespace increases; depth comes from hairline rules rather than shadows.

**Explicitly unchanged — do not touch:**
- **Typography.** Atkinson Hyperlegible remains the reading face everywhere — v3 changes colour, not type.
- **Geometry.** Soft corners (8px inputs/buttons, 12px cards) stay: rounded shapes read calm, and calm is the point for an anxious audience.
- Every WCAG 2.2 AA requirement (build-blocking).
- Voice and tone: plain, warm, humble, ~8th grade. "If it sounds grandiose, it's a bug."
- Motion: minimal, no autoplay/carousels/ambient looping, honor `prefers-reduced-motion`.
- The crisis affordance (🆘), the persistent disclaimer band, upbeat-only feedback, and every safety component's behavior.
- Photography rules, iconography rules (icon **+** text, always).

This is a re-skin, not a redirection.

---

## 1. The family system

VT Infinite is the house. OneRhythm is a product of the house — visibly related, deliberately adapted.

| | VT Infinite (corporate) | OneRhythm (product) |
|---|---|---|
| Color | Strict monochrome, no accent | Monochrome **+ one accent** (the heart red) |
| Typography | JetBrains Mono | **Atkinson Hyperlegible** *(diverges — see §10)* |
| Corners | 0 radius | Soft (8px / 12px) *(diverges — see §10)* |
| Mark | Incentive-eyes | **1R** |
| Voice | Direct, exact, unblinking | Warm, humble, plain |

**Endorsement:** OneRhythm surfaces carry a small "A VT Infinite, Inc. initiative." line with the incentive-eyes mark in the footer / about page. Never co-lock the two marks in a header.

---

## 2. The 1R mark

**Construction:** a heavy geometric numeral **1** and capital **R**, tightly set, with a solid heart occupying the R's counter (bowl). Black letterforms, Pulse Red heart.

**Why it works:** it *is* the name — One, Rhythm — compressed to two characters; the heart sits inside the letterform rather than beside it; it survives at small sizes better than a fine ECG line ever did.

**Variants (all required):**
1. **Primary** — black 1R, red heart, on Paper.
2. **Reversed** — white 1R, red heart, on black. (Red passes on black; verify at build.)
3. **Single-colour** — all-black or all-white, heart as a knockout (negative space). For embroidery, stamps, faxable documents, and any one-colour context.
4. **Favicon (16–32px)** — the heart is **enlarged and simplified** at these sizes; test at 16px and pick the variant that stays crisp rather than shrinking the primary.

**Full lockup:** the 1R mark, then "OneRhythm" set in Atkinson Hyperlegible Bold — "One" in Ink, "Rhythm" in Pulse Red. Horizontal lockup for headers; stacked for square placements.

**Clear space:** the width of the numeral 1 on all sides.
**Misuse:** never rotate, stretch, outline, add glow/shadow/bevel, recolour the heart to anything but Pulse Red (or knockout), place on a busy photo, or reset the wordmark in another typeface.

---

## 3. Colour — monochrome plus one

### Binding rule (overrides any hex below)
Body text ≥ **4.5:1**; large text (≥18px bold / ≥24px regular) and UI/focus ≥ **3:1**. Verify on implementation.

### The system
| Name | Value | On Paper | Role |
|---|---|---|---|
| Paper | `#FFFFFF` | — | The only background. No dark mode default. |
| Ink | `#000000` | **21:1** | All text, all rules, all letterforms. Maximum contrast. |
| Ink 70% | `rgba(0,0,0,0.70)` | ~8.4:1 | Secondary text, captions, metadata. |
| Ink 55% | `rgba(0,0,0,0.55)` | ~4.7:1 | Tertiary / non-essential. Still passes body. |
| Ink 12% | `rgba(0,0,0,0.12)` | — | Hairline borders, dividers, rules. |
| Ink 4% | `rgba(0,0,0,0.04)` | — | Card and input fills (replaces Mist/Cloud). |
| **Pulse Red** | `#E20A17` | **4.90:1** | The heart. The single accent. |

**Hierarchy comes from opacity and weight — never from a third colour.** There are no grays in this system; there is black at a stated opacity.

### Using Pulse Red — sparingly, deliberately
- The heart in the mark; "Rhythm" in the wordmark.
- The primary CTA (white text on Pulse Red — 4.90:1, passes).
- The upbeat control in its active state.
- Destructive-action text and borders.
- **Never** as a background wash, never on more than one element in a viewport if avoidable, never as the sole carrier of meaning.

**Note (monitored):** pure black on pure white is maximum contrast but can cause halation for some readers with astigmatism. This is a single token change (`--ink` → `#1B1D23`, still 16.9:1) if member feedback ever shows strain. Ship pure black; watch for it.

### Semantic states — retired as colour
Success, caution, and info no longer have colours. A state is communicated by **icon + text label + weight**, which WCAG 1.4.1 requires regardless. Only *destructive* keeps Pulse Red, always with an explicit word ("Delete my account").

---

## 4. Typography — one face, chosen for readers

**Atkinson Hyperlegible is the typeface. Everywhere.** Headings, body, buttons,
labels, numbers, long-form. It was engineered by the Braille Institute to
maximize character distinction for low-vision readers, and OneRhythm's baseline
user is 65+ with reduced vision. One face is also simply calmer: no visual
gear-changes between a heading and the paragraph under it.

Free via Google Fonts. **Inter** remains a permitted fallback for a genuinely
dense UI surface if Atkinson ever runs too wide there — but it is the exception,
never the default. **No monospace**, except for short technical identifiers if
one ever appears (rare by design).

### Scale (1.2 ratio, 16px root — minimums, not targets)
| Element | Size | Weight | Line height |
|---|---|---|---|
| Page title | 1.728rem (28px) | 700 | 1.25 |
| Section (H2) | 1.44rem (23px) | 700 | 1.3 |
| Subsection (H3) | 1.2rem (19px) | 600 | 1.35 |
| **Body** | **1.0–1.125rem (16–18px)** | 400 | **1.5** |
| Long-form reading | 1.125rem (18px) | 400 | 1.6 |
| Button / label | 1.0rem (16px) | 600 | 1.2 |
| Caption / metadata | 0.875rem (14px) | 500 | 1.4 |
| Disclaimer | 0.875rem (14px) minimum | 400 | 1.5 |

**Rules:**
- Body is **never below 16px**; long-form starts at 18px.
- Maximum line length ~70 characters for reading content.
- No all-caps beyond short labels.
- Plain language target ~8th grade.
- The medical disclaimer renders at 14px minimum and is never smaller.

---

## 5. Layout, spacing, targets

- **Soft corners, consistent:** 8px inputs and buttons, 12px cards. Nothing sharp, nothing pill-shaped that hides its function.
- **Depth by hairline rule only** — 1px `Ink 12%` borders. No shadows, no glow, no elevation.
- **Generous whitespace.** Cards 24px padding, sections 48–64px apart. Space lowers cognitive load.
- **Targets:** primary actions 44×44px; any interactive minimum 24×24px (SC 2.5.8).
- **Focus ring:** 2px solid Ink with a 2px offset, visible on every interactive element, never removed. (Black, not blue — there is no blue in v3.)
- **Single, obvious path.** One primary action per screen.

---

## 6. Motion — unchanged from v2

No autoplay. No carousels. No auto-advancing anything. No ambient or looping animation. Transitions ≤200ms and only to confirm a user-initiated action. Honor `prefers-reduced-motion: reduce` everywhere. GIFs (Phase 2M) never autoplay — still frame, tap to play.

---

## 7. Components — v3 treatments

**Buttons** (8px radius, Atkinson Hyperlegible 600 at 16px, 44px tall):
| Variant | Treatment |
|---|---|
| Primary | Solid Pulse Red, Paper text |
| Secondary | Paper fill, Ink text, 1px Ink border |
| Quiet | No fill/border, Ink text, underlined on hover/focus |
| Destructive | Paper fill, Pulse Red text + 1px Pulse Red border, explicit label |

**Cards:** Paper or Ink 4% fill, 1px Ink 12% border, 12px radius, 24px padding. No shadows.

**Inputs:** Ink 4% fill, 1px Ink border, 8px radius, label **above** the field (never placeholder-as-label). Focus adds the Ink ring. Errors show Pulse Red text **and** an icon **and** words below the field.

**Consent checkboxes:** unchecked by default, large, adjacent to plain-language explanation. Unchanged.

**Upbeat control:** heart glyph + "Upbeat" + count. Filled Pulse Red heart = you've upbeated; Ink outline = you haven't. Structurally no downvote.

**Crisis affordance (🆘):** unchanged in behavior and prominence — reachable from every screen, plain label ("Need help right now?"), icon **+** text, large target. Now rendered in the v3 system: Ink text, Pulse Red mark, 1px Ink border. Its render is a monitored safety SLI.

**Disclaimer band:** unchanged in behavior — persistent, non-dismissible. Now: Ink 4% fill, 3px **Ink** left border (was Caution), info icon + label, Atkinson 14px minimum.

**Verified badge:** check icon + "Verified", Ink. No colour.

---

## 8. Imagery — unchanged from v2

Real, warm, natural settings — never clinical. Natural light. Diverse representation mandatory. Never depict people as visibly ill, distressed, or in crisis. No stock "concerned person clutching chest." Consider high-contrast black-and-white treatment for editorial imagery to sit inside the monochrome system; never at the cost of showing people as they are.

---

## 9. Accessibility is the brand (WCAG 2.2 AA, build-blocking)

Restated because it is non-negotiable: white background; body ≥16–18px; line-height ≥1.5; **all text in Atkinson Hyperlegible**; text contrast ≥4.5:1, UI/focus ≥3:1; targets ≥24px (44px primary); visible focus; plain language; no autoplay or carousels; icon **+** text always. Honor the 2.2 additions (Focus Not Obscured, Consistent Help, Redundant Entry, Accessible Authentication, Dragging alternative). CI gate: automated `axe` + manual keyboard/screen-reader passes before merge.

---

## 10. Divergence register — where OneRhythm departs from the VT Infinite guide, and why

Recorded so no one "corrects" these later. **What OneRhythm adopts is the
colour system** — monochrome, opacity for hierarchy, austerity in palette. That
is the family signal, and colour carries most of brand recognition.

1. **Typography is Atkinson Hyperlegible, not JetBrains Mono.** VT Infinite
   specifies mono throughout; mono is code-native and precise, but monospace
   forces uniform character width, which measurably slows prose reading.
   Atkinson Hyperlegible was engineered by the Braille Institute specifically to
   maximize character distinction for low-vision readers. OneRhythm's baseline
   user is 65+ with reduced vision, and WCAG 2.2 AA is build-blocking (PRD §9
   wins conflicts by rule). **This divergence is not up for revision.**
2. **Soft corners, not 0 radius.** Rounded geometry reads calm; sharp reads
   technical. For a population managing cardiac fear, calm wins.
3. **One accent colour exists.** VT Infinite is strictly monochrome. OneRhythm's
   mark contains a heart, and the heart is the product's meaning. Pulse Red
   `#E20A17` passes 4.5:1, so it is used as a text-safe accent, sparingly —
   most visibly on the upbeat control, where the community's positive-only
   feedback lives.
4. **Voice stays warm.** VT Infinite's register is unblinking and exact;
   OneRhythm speaks to people in distress. Plain, humble, never dismissive.
   Anchor phrases used sincerely and sparingly: *"invisible bears," "nobody
   should fight an invisible bear alone," "pain is not a competition," "Ad Astra
   Per Aspera."*

---

## 11. Implementation tokens

```css
/* globals.css — OneRhythm v3 */
:root {
  /* Surfaces */
  --paper:          #FFFFFF;
  --fill-subtle:    rgba(0,0,0,0.04);
  --line:           rgba(0,0,0,0.12);

  /* Ink + hierarchy by opacity (no grays) */
  --ink:            #000000;
  --ink-secondary:  rgba(0,0,0,0.70);
  --ink-tertiary:   rgba(0,0,0,0.55);

  /* The one accent */
  --pulse:          #E20A17;   /* 4.90:1 on Paper — text-safe */

  /* Type — one face */
  --font-primary:   'Atkinson Hyperlegible', system-ui, sans-serif;

  /* Geometry */
  --radius-input:   8px;
  --radius-card:    12px;
  --border:         1px;
  --focus-ring:     2px;

  /* Motion */
  --motion-fast:    150ms;
  --motion-base:    200ms;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition-duration: 0.01ms !important; }
}
```

```ts
// tailwind.config — v3 tokens
colors: {
  paper: '#FFFFFF',
  ink: {
    DEFAULT: '#000000',
    secondary: 'rgba(0,0,0,0.70)',
    tertiary: 'rgba(0,0,0,0.55)',
    line: 'rgba(0,0,0,0.12)',
    fill: 'rgba(0,0,0,0.04)',
  },
  pulse: '#E20A17',
},
fontFamily: {
  sans: ['Atkinson Hyperlegible', 'system-ui', 'sans-serif'],
},
borderRadius: { input: '8px', card: '12px' },
```

**Retired tokens (must not survive the migration):** `mist`, `cloud`, `slate`, `muted`, `heart`, `heart-bright`, `calm`, `success`, `caution`, `danger`. Radius tokens are **kept**; only their values are confirmed (8px / 12px). Atkinson Hyperlegible stays as the font stack — unchanged from v2.

---

*Nobody should fight an invisible bear alone. Ad Astra Per Aspera.*
*A VT Infinite, Inc. initiative.*
