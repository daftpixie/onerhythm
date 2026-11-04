import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { hiddenFromAssistiveTech } from "../lib/a11y";
import { tokens } from "../theme/tokens";

export type WordmarkVariant = "primary" | "reversed" | "mono";

export interface WordmarkProps {
  /**
   * primary  — Ink letterforms, Pulse Red heart, for Paper backgrounds.
   * reversed — Paper letterforms, Pulse Red heart, for Ink backgrounds.
   * mono     — single-colour Ink, heart as a knockout. One-colour contexts.
   */
  variant?: WordmarkVariant;
  /** Mark height in px. The lockup text scales with it. */
  size?: number;
  /** Mark only, no "OneRhythm" lockup (square placements, app icons). */
  markOnly?: boolean;
}

// The 1R mark (Brand v3 §2): a heavy geometric numeral 1 and capital R, with a
// solid heart occupying the R's counter. Rendered as inline SVG rather than a
// raster so it stays crisp at any density and takes its colours from tokens.ts
// — the mark cannot drift out of sync with the palette.
//
// Geometry is traced from assets/brand/svg/1r-mark.svg (the stated source of
// truth). viewBox 546x386 is the mark's natural aspect.
const VIEW_W = 546;
const VIEW_H = 386;

const LETTERFORMS =
  "M14.00,365.00L14.00,344.00L42.00,344.00L70.00,344.00L70.00,217.50L70.00,91.00L34.89,91.00C3.29,91.00 -0.15,90.84 0.39,89.42C0.73,88.55 1.00,79.55 1.00,69.42L1.00,51.00L5.37,51.00C7.77,51.00 13.73,50.31 18.62,49.46C51.47,43.76 73.11,29.09 83.58,5.42L85.97,0.00L109.99,0.00L134.00,0.00L134.00,172.00L134.00,344.00L162.00,344.00L190.00,344.00L190.00,365.00L190.00,386.00L102.00,386.00L14.00,386.00L14.00,365.00ZM221.67,385.33C220.84,384.50 220.80,5.35 221.63,2.25L222.23,-0.00L309.87,0.00C414.34,0.01 424.26,0.62 448.87,8.62C485.98,20.69 512.00,45.82 522.85,80.07C531.21,106.47 530.89,139.20 522.02,165.45C512.62,193.26 492.39,216.08 465.34,229.39C460.48,231.79 454.02,234.53 451.00,235.50C447.98,236.46 445.13,237.58 444.68,237.99C444.23,238.40 449.00,246.11 455.27,255.12C480.83,291.86 539.83,376.82 542.85,381.25L546.10,386.00L504.60,386.00L463.10,386.00L450.21,367.25C427.53,334.26 381.50,266.80 375.49,257.74L369.68,248.98L331.09,249.24L292.50,249.50L292.24,317.75L291.99,386.00L257.16,386.00C238.01,386.00 222.03,385.70 221.67,385.33ZM388.79,183.16C420.56,157.59 437.52,140.15 446.30,124.00C451.03,115.31 453.00,108.09 452.99,99.57C452.96,82.04 444.80,69.06 429.12,61.64C422.98,58.73 421.73,58.50 412.00,58.54C402.25,58.57 401.02,58.80 394.83,61.80C387.35,65.42 380.51,71.55 375.97,78.71C374.30,81.34 372.61,83.28 372.22,83.00C371.83,82.72 369.79,79.91 367.67,76.75C360.36,65.80 349.39,59.25 336.74,58.30C319.14,56.97 303.89,65.34 296.44,80.43C286.12,101.31 293.94,124.85 319.79,150.76C335.20,166.21 369.64,194.94 372.79,194.98C373.50,194.99 380.70,189.67 388.79,183.16Z";

const HEART =
  "M363.00,188.39C358.32,184.78 349.06,177.19 342.42,171.51C304.18,138.81 290.63,118.25 292.36,95.50C294.10,72.50 313.16,56.52 336.74,58.30C349.39,59.25 360.36,65.80 367.67,76.75C369.79,79.91 371.83,82.72 372.22,83.00C372.61,83.28 374.30,81.34 375.97,78.71C380.51,71.55 387.35,65.42 394.83,61.80C401.02,58.80 402.25,58.57 412.00,58.54C421.73,58.50 422.98,58.73 429.12,61.64C444.80,69.06 452.96,82.04 452.99,99.57C453.03,122.88 435.75,145.37 388.79,183.16C380.70,189.67 373.50,194.99 372.79,194.97C372.08,194.96 367.68,191.99 363.00,188.39Z";

export function Wordmark({
  variant = "primary",
  size = 24,
  markOnly = false,
}: WordmarkProps) {
  const letterColor = variant === "reversed" ? tokens.paper : tokens.ink;
  // "mono" knocks the heart out as negative space (v3 §2 variant 3) for
  // embroidery, stamps, and faxable one-colour contexts. Every other variant
  // carries the Pulse Red heart — the one place the accent is never optional.
  const heartColor = variant === "mono" ? tokens.paper : tokens.pulse;

  const mark = (
    <Svg
      width={(size * VIEW_W) / VIEW_H}
      height={size}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      // The lockup's <Text> already carries the accessible name "OneRhythm";
      // the glyph must not repeat it to a screen reader. Exactly ONE spelling
      // per platform — see src/lib/a11y.ts for why passing all three leaks two
      // unknown props onto the real <svg> on web.
      {...hiddenFromAssistiveTech()}
    >
      <G>
        <Path d={LETTERFORMS} fill={letterColor} fillRule="evenodd" />
        <Path d={HEART} fill={heartColor} />
      </G>
    </Svg>
  );

  if (markOnly) {
    return (
      // `accessible` is required: the SVG inside is deliberately hidden, so
      // without it this View is not exposed as a single element and the mark
      // announces NOTHING at all rather than "OneRhythm".
      <View accessible accessibilityRole="image" accessibilityLabel="OneRhythm">
        {mark}
      </View>
    );
  }

  return (
    // The lockup is the brand mark, not page content, so it is an IMAGE and
    // not a heading. It used to carry accessibilityRole="header": that put an
    // unlevelled "OneRhythm" heading in the heading list of every screen (the
    // AppShell renders one on all of them), and two of them on any page that
    // also shows the lockup in its hero. A screen-reader user navigating by
    // heading landed on the logo instead of the content. This now matches the
    // markOnly branch above, which was already right.
    //
    // `accessible` + an explicit label are REQUIRED, for the same reason they
    // are on markOnly. `image` is not a name-from-content role: an image is
    // named by its label, never by concatenating the text inside it. Setting
    // the role without the label would have traded a mislabelled-but-readable
    // heading for a correctly-classified but SILENT image, on every screen —
    // strictly worse than the bug being fixed.
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="OneRhythm"
      style={styles.lockup}
    >
      {mark}
      <Text style={[styles.word, { fontSize: size * 0.85 }]}>
        <Text style={{ color: letterColor }}>One</Text>
        {/*
         * "Rhythm" is the accent ONLY on Paper. This is the binding constraint
         * from ADR 0010: Pulse Red is 4.90:1 on Paper but 4.29:1 on Ink, which
         * clears SC 1.4.11's 3:1 bar for the mark's heart (a graphical object)
         * and FAILS SC 1.4.3's 4.5:1 bar for text. So on a reversed lockup the
         * word takes Paper, not Pulse — the heart inside the mark keeps the
         * accent. "mono" follows letterColor by its single-colour contract.
         */}
        <Text
          style={{ color: variant === "primary" ? tokens.pulse : letterColor }}
        >
          Rhythm
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: "row",
    alignItems: "center",
    // v3 §2 clear space: the width of the numeral 1.
    gap: 8,
  },
  word: {
    // Atkinson Hyperlegible Bold — v3 §2 forbids setting the wordmark in any
    // other typeface. Unchanged from v2.
    fontFamily: "AtkinsonHyperlegible_700Bold",
  },
});
