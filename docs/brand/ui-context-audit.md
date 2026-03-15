# UI Context Audit

This document captures the current UI/UX baseline for OneRhythm so future
Codex work starts from the actual repository state instead of re-deriving the
design system from scratch.

Audit date: 2026-03-14

## Source documents reviewed

- [Brand system](README.md)
- [Campaign and content strategy](content-strategy/README.md)
- [Tone and style guide](../content/tone-and-style-guide.md)
- [Global web tokens and utilities](../../apps/web/app/globals.css)
- [Web Tailwind theme bridge](../../apps/web/tailwind.config.ts)
- [Shared UI primitives](../../packages/ui/src/index.ts)

Representative frontend surfaces reviewed:

- [Homepage](../../apps/web/app/page.tsx)
- [Public site header](../../apps/web/components/public-site-header.tsx)
- [Public site footer](../../apps/web/components/public-site-footer.tsx)
- [Learn hub](../../apps/web/app/learn/page.tsx)
- [Research hub](../../apps/web/app/research/page.tsx)
- [Content page shell](../../apps/web/components/content-page.tsx)
- [Research translation page shell](../../apps/web/components/research-translation-page.tsx)
- [About surfaces](../../apps/web/components/about/about-hero.tsx)
- [Community hub](../../apps/web/app/community/page.tsx)

## North star

The written standards are clear and coherent:

- visually dark-first, luminous, calm, and humane
- emotionally literate without becoming clinical or alarmist
- educational and community-focused, never diagnostic
- explicit about privacy, provenance, consent, and product boundaries
- accessible by default, with visible focus, high contrast, and reduced-motion
  support

Future UI work should treat those points as fixed product constraints, not
stylistic suggestions.

## What is already strong

### 1. Brand tokens are real, not aspirational

The core palette, radius, motion, typography roles, gradients, and surface
language from the brand guide are implemented in
[apps/web/app/globals.css](../../apps/web/app/globals.css) and exposed to
Tailwind in
[apps/web/tailwind.config.ts](../../apps/web/tailwind.config.ts).

This is the strongest part of the current system. Most public-facing UI already
uses brand-aligned variables like:

- `--color-deep-void`, `--color-cosmos`, `--color-pulse`, `--color-signal`
- `--gradient-void`, `--gradient-heartbeat`
- `--radius-*`
- `--focus-ring`, `--glow-*`, `--shadow-*`

### 2. Safety and trust signals are consistently visible

The shared
[MedicalDisclaimer](../../packages/ui/src/components/medical-disclaimer.tsx) is
used across educational and research-adjacent surfaces, and provenance is
visible in the content and research page shells.

That aligns well with the brand/content rules around:

- persistent non-dismissible disclaimer presence
- educational boundary clarity
- visible source provenance

### 3. The atmospheric direction is consistent

The homepage, mosaic, research, and about surfaces all use a recognizably
shared visual language:

- layered dark backgrounds instead of flat fills
- restrained glows instead of loud effects
- display/body/mono role separation
- artistic ECG and mosaic visuals framed as non-diagnostic

Even where the implementation is uneven, the product already feels like one
brand rather than a set of disconnected experiments.

### 4. Accessibility intent is present in code

The repo already includes:

- visible focus states
- a high-contrast mode plus `prefers-contrast` handling
- `prefers-reduced-motion` handling
- `aria-live` usage for validation and status messaging
- `min-h-11` form controls in shared UI primitives

That is a solid baseline to build on.

## Where the current system drifts

### 1. The design system is split between tokens and page-local composition

The repo has a good token layer, but only a thin component layer in
[packages/ui](../../packages/ui/src/index.ts). In practice, many public
surfaces are assembled with repeated class recipes instead of shared layout or
surface primitives.

Common examples:

- repeated CTA class strings built from `action-link` utilities
- repeated `rounded-xl border border-token bg-cosmos p-6` content panels
- repeated hero headers and metadata chip patterns across content pages

Implication:

- the visual language is consistent
- the implementation is not yet systemized enough to support fast, safe UI
  iteration

### 2. Public CTA styling bypasses the shared `Button` primitive

The shared
[Button](../../packages/ui/src/components/button.tsx) exists and is used in app
flows, but public marketing/editorial surfaces mostly use ad hoc link class
strings from
[apps/web/app/globals.css](../../apps/web/app/globals.css).

That creates two separate button systems:

- form/app buttons in `packages/ui`
- public CTA links in page components

Future UI work should either unify them behind a shared link-capable button
primitive or clearly define them as two intentional tiers.

### 3. Page-shell patterns are duplicated

[ContentPage](../../apps/web/components/content-page.tsx) and
[ResearchTranslationPage](../../apps/web/components/research-translation-page.tsx)
solve similar layout problems with different abstractions. The same is true for
hero headers, pills, section cards, and sidebars across `/learn`, `/research`,
and content detail routes.

Implication:

- the current UI is coherent enough to ship
- redesign work will move faster if shared editorial shells are extracted

### 4. Typography is specified but not fully guaranteed at runtime

The brand guide names `Exo 2`, `DM Sans`, and `Space Mono` as approved roles.
Those names appear in CSS variables, but the web app does not currently wire
them through `next/font` or another explicit font-loading path.

Implication:

- the intended type system is documented
- the actual rendered type may fall back to local system fonts depending on the
  environment

That is important for any UI polish pass because typography is carrying a large
part of the brand identity.

### 5. Mobile navigation and touch target standards are not fully met

The public header keeps the full navigation, contrast toggle, sign-in, and
contribute actions in one always-visible row in
[apps/web/components/public-site-header.tsx](../../apps/web/components/public-site-header.tsx).

Two concrete issues follow from that:

- there is no mobile-specific navigation pattern
- several interactive header controls are below the repo's `44x44` touch-target
  requirement, including the `36x36` contrast toggle

This is the most important UX gap in the shared chrome.

### 6. Tone is strongest when it is calm, and weakest when it becomes campaign-sharp by default

The repo intentionally contains advocacy language, especially on the homepage,
about, and mission surfaces. That is partly aligned with the campaign strategy,
but some copy drifts away from the "knowledgeable companion" voice into a
sharper, more confrontational mode.

Examples of drift:

- frequent use of "patients" instead of lived-experience framing
- lines that read more activist or prosecutorial than calm and steady
- occasional rhetoric that feels closer to campaign creative than default
  product voice

This is not a reason to flatten the brand. It means the product needs clearer
voice modes:

- calm educational mode
- emotionally direct campaign/advocacy mode
- founder-origin mode

Future UI work should not treat the sharpest copy as the universal tone.

### 7. Token discipline is strong, but not complete

Most UI colors route through brand variables. A few exceptions remain:

- hard-coded color values in component code, such as the warning hover color in
  [Button](../../packages/ui/src/components/button.tsx)
- hard-coded mosaic palette values in
  [heart-mosaic SVG rendering](../../apps/web/components/home/heart-mosaic-svg.tsx)

The mosaic exceptions are reasonable because that surface is artistic. The
button exception is more likely system drift.

### 8. Responsive behavior relies on page breakpoints, not component responsiveness

No container-query usage was found in the reviewed web or shared UI code. The
current system is almost entirely built around page-level Tailwind breakpoints.

That is workable for now, but it means redesign work should be careful about:

- reusable components in mixed-width layouts
- editorial cards reused across hubs and detail pages
- navigation behavior at intermediate screen sizes

## Current implementation summary

The repository is best understood as:

- a strong brand-token and trust-boundary foundation
- a partial component system
- a public UI layer that still depends heavily on repeated utility recipes
- a content voice that is compelling but not yet fully mode-governed

That means future Codex UI/UX work should not start with a blank-slate visual
redesign. The higher-value move is to systemize what already works and tighten
the places where implementation quality lags behind the written standards.

## Guidance for future Codex work

### Preserve as non-negotiable

- dark-first luminous palette and token naming
- persistent educational disclaimer behavior
- visible provenance on educational and research surfaces
- strict non-diagnostic framing
- artistic-not-diagnostic treatment of ECG and mosaic visuals
- privacy, consent, and data-boundary messaging

### Prioritize next

- unify public CTA patterns with shared primitives
- extract shared editorial page shells and metadata chips
- make mobile navigation intentional instead of compressed desktop navigation
- fix touch-target gaps in shared chrome
- formalize voice modes so campaign rhetoric does not leak into every surface
- decide whether approved brand fonts should be explicitly loaded at runtime

### Design direction for future UI passes

Keep the brand's luminous dark atmosphere, but avoid repeating the same
centered hero plus stacked cards pattern everywhere. The strongest future work
will likely come from:

- more deliberate asymmetry
- stronger editorial layout rhythm
- clearer differentiation between community, education, research, and founder
  narrative surfaces
- fewer one-off class recipes and more reusable compositional primitives
