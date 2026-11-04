import { tokens, focus } from "../../src/theme/tokens";

// WCAG 2.2 contrast, computed from the SHIPPED token values.
//
// This suite is the palette's self-policing mechanism: every component styles
// against src/theme/tokens.ts (enforced by guard #7), so a token edit both
// moves the UI and trips these assertions. Values are never restated here —
// everything is derived from the imported tokens.
//
// Brand: docs/brand/OneRhythm_Brand_Guidelines_v3.md §3
// Decision: docs/adr/0010-brand-v3.md

type RGB = { r: number; g: number; b: number };

/** Parse #RRGGBB or rgba(r,g,b,a) into channels + alpha. */
function parse(color: string): RGB & { a: number } {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const fn = color
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (fn) {
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }
  throw new Error(`contrast test cannot parse colour: ${color}`);
}

/**
 * Composite a possibly-translucent colour over an opaque backdrop.
 * The Ink 70% / Ink 55% tiers are authored as rgba, so they must be measured
 * AS RENDERED against Paper — not as their declared channels.
 */
function over(fg: string, bg: string): RGB {
  const f = parse(fg);
  const b = parse(bg);
  if (b.a !== 1) throw new Error("backdrop must be opaque");
  return {
    r: f.r * f.a + b.r * (1 - f.a),
    g: f.g * f.a + b.g * (1 - f.a),
    b: f.b * f.a + b.b * (1 - f.a),
  };
}

/** WCAG relative luminance (sRGB linearisation). */
function luminance({ r, g, b }: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio of fg over bg, compositing alpha first. */
function ratio(fg: string, bg: string): number {
  const l1 = luminance(over(fg, bg));
  const l2 = luminance(over(bg, bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const BODY_TEXT = 4.5; // SC 1.4.3
const NON_TEXT = 3.0; // SC 1.4.11

describe("v3 palette — WCAG 2.2 AA contrast, computed from tokens.ts", () => {
  describe("Pulse Red, the single accent", () => {
    it("is text-safe on Paper (primary CTA, destructive text, active upbeat)", () => {
      expect(ratio(tokens.pulse, tokens.paper)).toBeGreaterThanOrEqual(BODY_TEXT);
    });

    it("carries Paper text on a Pulse fill (v3 §7 Primary button)", () => {
      expect(ratio(tokens.paper, tokens.pulse)).toBeGreaterThanOrEqual(BODY_TEXT);
    });

    // BINDING CONSTRAINT — ADR 0010, amending v3 §2.
    //
    // v3 §2 says of the reversed mark: "Red passes on black; verify at build."
    // Verified — and it passes for GRAPHICAL OBJECTS only. Pulse Red on Ink
    // measures ~4.29:1, which clears SC 1.4.11's 3:1 bar for the heart inside
    // the mark but FAILS SC 1.4.3's 4.5:1 bar for text.
    //
    // Pulse Red must therefore NEVER be used for text on an Ink background.
    // Both bounds are pinned so neither can drift unnoticed: raising the token
    // past the text bar would silently license a usage the brand forbids.
    it("clears the 3:1 graphical bar on Ink — the reversed mark's heart", () => {
      expect(ratio(tokens.pulse, tokens.ink)).toBeGreaterThanOrEqual(NON_TEXT);
    });

    it("does NOT clear the text bar on Ink — never use Pulse for text on Ink", () => {
      expect(ratio(tokens.pulse, tokens.ink)).toBeLessThan(BODY_TEXT);
    });
  });

  describe("Ink hierarchy on Paper — opacity, not greys", () => {
    it.each([
      ["ink", tokens.ink],
      ["inkSecondary", tokens.inkSecondary],
      ["inkTertiary", tokens.inkTertiary],
    ])("%s passes body text contrast", (_name, value) => {
      expect(ratio(value, tokens.paper)).toBeGreaterThanOrEqual(BODY_TEXT);
    });

    it("descends monotonically — each tier is lighter than the one above", () => {
      const r = (c: string) => ratio(c, tokens.paper);
      expect(r(tokens.ink)).toBeGreaterThan(r(tokens.inkSecondary));
      expect(r(tokens.inkSecondary)).toBeGreaterThan(r(tokens.inkTertiary));
    });
  });

  describe("Focus ring — v3 §5, 2px solid Ink", () => {
    it("is visible against Paper", () => {
      expect(ratio(tokens.ink, tokens.paper)).toBeGreaterThanOrEqual(NON_TEXT);
    });

    it("is visible against an Ink 4% fill (cards, inputs)", () => {
      const filled = over(tokens.fill, tokens.paper);
      const l1 = luminance(over(tokens.ink, tokens.paper));
      const l2 = luminance(filled);
      const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
      expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(NON_TEXT);
    });

    it("is 2px wide with a 2px offset, and never zero", () => {
      expect(focus.width).toBeGreaterThanOrEqual(2);
      expect(focus.offset).toBeGreaterThanOrEqual(2);
    });
  });

  describe("the palette stays monochrome + one", () => {
    it("has exactly one chromatic token — every other colour is neutral", () => {
      const chromatic = Object.entries(tokens).filter(([, v]) => {
        const c = over(v, tokens.paper);
        return (
          Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) > 2 // not grey
        );
      });
      expect(chromatic.map(([k]) => k)).toEqual(["pulse"]);
    });
  });
});
