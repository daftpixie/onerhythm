// OneRhythm design tokens — the ONLY place a colour literal may appear.
//
// Guard #7 (.claude/hooks/no-raw-color-literals.sh) blocks colour literals
// anywhere else under src/ and app/. tests/unit/contrast.test.ts computes WCAG
// ratios from these values, so a token edit is checked by the suite AND moves
// the UI — which is the whole point of routing every component through here.
//
// Brand: docs/brand/OneRhythm_Brand_Guidelines_v3.md §11
// Decision: docs/adr/0010-brand-v3.md
//
// v3 is monochrome + exactly one accent. Hierarchy comes from OPACITY and
// WEIGHT, never from a third colour. There are no greys in this system; there
// is black at a stated opacity.

export const tokens = {
  // Surfaces
  paper: "#FFFFFF", // the only background — no dark mode default
  fill: "rgba(0,0,0,0.04)", // card + input fills
  line: "rgba(0,0,0,0.12)", // 1px hairline borders, dividers, rules

  // Ink — hierarchy by opacity
  ink: "#000000", // 21.0:1 on Paper — all text, all rules
  inkSecondary: "rgba(0,0,0,0.70)", // 8.45:1 — captions, metadata
  inkTertiary: "rgba(0,0,0,0.55)", // 4.74:1 — tertiary, still passes body

  // The one accent. Reserved: the mark, the primary CTA, the active upbeat,
  // destructive actions. Never a background wash, never the sole carrier of
  // meaning, never more than one element in a viewport if avoidable.
  //
  // BINDING CONSTRAINT (ADR 0010, amends v3 §2): Pulse Red measures 4.90:1 on
  // Paper but only 4.29:1 on Ink. It therefore passes 4.5:1 for text on Paper
  // and 3:1 for graphical objects on Ink — but it MUST NEVER be used for TEXT
  // on an Ink background. tests/unit/contrast.test.ts pins both bounds.
  pulse: "#E20A17", // 4.90:1 on Paper

  // Non-palette: modal overlay. Not a text or UI-component colour.
  scrim: "rgba(0, 0, 0, 0.5)",
} as const;

// Geometry — UNCHANGED by the v3 re-skin (v3 §5; divergence register §10.2:
// rounded geometry reads calm, and calm is the point for an anxious audience).
export const radius = {
  input: 8,
  card: 12,
} as const;

// Focus ring — v3 §5: 2px solid Ink with a 2px offset. Black, not blue; there
// is no blue in v3. Visible on every interactive element, never removed.
export const focus = {
  width: 2,
  offset: 2,
} as const;

// Spacing — v3 §5: space lowers cognitive load.
export const space = {
  card: 24, // card padding
  section: 48, // minimum gap between sections (48–64)
} as const;

export type Tokens = typeof tokens;
