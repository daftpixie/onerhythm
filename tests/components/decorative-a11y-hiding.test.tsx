import React from "react";
import fs from "fs";
import path from "path";
import { Platform } from "react-native";
import Svg from "react-native-svg";
import { render, fireEvent } from "@testing-library/react-native";
import { Wordmark } from "../../src/components/Wordmark";
import { CrisisHelpSheet } from "../../src/components/CrisisHelpSheet";

// Hiding a DECORATIVE glyph from assistive tech is spelled differently on every
// platform, and the three spellings are not interchangeable:
//
//   web     — `aria-hidden`. The ONLY one the DOM understands.
//   android — `importantForAccessibility="no-hide-descendants"`.
//   iOS     — `accessibilityElementsHidden`.
//
// Passing all three everywhere is not a harmless belt-and-braces. Verified
// against the INSTALLED packages (react-native-svg 15.15.5, react-native-web
// 0.21.2):
//
//   * react-native-svg's web build renders a REAL <svg> via
//     createElement(this.tag, prepare(...)), and `prepare` spreads every prop it
//     does not itself consume straight onto the DOM node. react-native-web's
//     createDOMProps strips only the props on its `_excluded` list, and the two
//     native-only names are not on it. So both reach the DOM, React logs
//     "React does not recognize the `importantForAccessibility` prop on a DOM
//     element", and `importantForAccessibility` even survives into the markup as
//     a junk attribute (SVG is case-preserving XML).
//   * react-native-web's <Text> takes the opposite route — a forwardedProps
//     ALLOWLIST — so there the same prop is dropped silently. No warning, and
//     no hiding either: on web it simply does nothing.
//
// These tests pin the platform-correct spelling at each call site so neither
// failure mode can come back.

type A11yProps = Record<string, unknown>;

/** The props react-native-svg would hand to the platform view. */
function svgPropsOf(tree: ReturnType<typeof render>): A11yProps {
  return tree.UNSAFE_getByType(Svg).props as A11yProps;
}

function withPlatform<T>(os: string, run: () => T): T {
  const original = Platform.OS;
  (Platform as unknown as { OS: string }).OS = os;
  try {
    return run();
  } finally {
    (Platform as unknown as { OS: string }).OS = original;
  }
}

const WEB_ONLY = "aria-hidden";
const ANDROID_ONLY = "importantForAccessibility";
const IOS_ONLY = "accessibilityElementsHidden";

describe("decorative glyphs are hidden the way each platform actually spells it", () => {
  describe("the 1R mark (Wordmark)", () => {
    it("exposes exactly ONE accessible name, with the glyph itself hidden", () => {
      const tree = render(<Wordmark markOnly />);

      // the name is on the wrapper...
      const named = tree.getAllByLabelText("OneRhythm");
      expect(named).toHaveLength(1);

      // ...and the SVG underneath it is hidden, so it cannot announce a second
      // time. Whichever spelling applies, at least one must be present.
      const svg = svgPropsOf(tree);
      const hidden =
        svg[WEB_ONLY] === true ||
        svg[IOS_ONLY] === true ||
        svg[ANDROID_ONLY] === "no-hide-descendants";
      expect(hidden).toBe(true);
    });

    it("hides via aria-hidden ONLY on web — no native-only prop reaches the DOM", () => {
      const svg = withPlatform("web", () => svgPropsOf(render(<Wordmark markOnly />)));
      expect(svg[WEB_ONLY]).toBe(true);
      // These two are what React warns about; neither may be present on web.
      expect(svg).not.toHaveProperty(ANDROID_ONLY);
      expect(svg).not.toHaveProperty(IOS_ONLY);
    });

    it("hides via importantForAccessibility ONLY on android", () => {
      const svg = withPlatform("android", () =>
        svgPropsOf(render(<Wordmark markOnly />)),
      );
      expect(svg[ANDROID_ONLY]).toBe("no-hide-descendants");
      expect(svg).not.toHaveProperty(WEB_ONLY);
      expect(svg).not.toHaveProperty(IOS_ONLY);
    });

    it("hides via accessibilityElementsHidden ONLY on ios", () => {
      const svg = withPlatform("ios", () => svgPropsOf(render(<Wordmark markOnly />)));
      expect(svg[IOS_ONLY]).toBe(true);
      expect(svg).not.toHaveProperty(WEB_ONLY);
      expect(svg).not.toHaveProperty(ANDROID_ONLY);
    });

    it("hides the glyph in the full lockup too, where <Text> carries the name", () => {
      const svg = withPlatform("web", () => svgPropsOf(render(<Wordmark />)));
      expect(svg[WEB_ONLY]).toBe(true);
      expect(svg).not.toHaveProperty(ANDROID_ONLY);
    });
  });

  describe("the 🆘 glyph in the crisis sheet title", () => {
    // The crisis affordance is safety-critical. This asserts the ANNOUNCED
    // OUTCOME rather than the mechanism, because the mechanism is exactly where
    // this went wrong once: hiding a nested <Text> is inert on iOS, so a test
    // that only checked "the inner glyph carries a hiding prop" would have gone
    // green while VoiceOver still said "SOS Need help right now?".
    //
    // An explicit label on the PARENT is what actually holds on all three
    // platforms, and it is platform-independent — hence no withPlatform here.
    function openSheet() {
      const tree = render(<CrisisHelpSheet />);
      fireEvent.press(tree.getAllByText(/need help right now/i)[0]);
      return tree;
    }

    it("announces the title WITHOUT the emoji, on every platform", () => {
      const tree = openSheet();
      const titles = tree.UNSAFE_root.findAll(
        (n) =>
          typeof n.props?.children === "string" &&
          n.props.children.includes("🆘") &&
          n.props.children.includes("Need help right now?"),
      );
      expect(titles.length).toBeGreaterThan(0);
      for (const t of titles) {
        // visible text keeps the icon (a11y.md: icon AND text)...
        expect(t.props.children).toContain("🆘");
        // ...but the spoken name is the words alone.
        expect(t.props.accessibilityLabel).toBe("Need help right now?");
        expect(t.props.accessibilityLabel).not.toContain("🆘");
      }
    });

    it("does not rely on hiding a nested <Text>, which iOS ignores", () => {
      const tree = openSheet();
      const glyphOnly = tree.UNSAFE_root.findAll(
        (n) =>
          typeof n.props?.children === "string" &&
          n.props.children.includes("🆘") &&
          !n.props.children.includes("Need help"),
      );
      // The trigger's icon is allowed to be a bare glyph: it sits inside a
      // Pressable whose own accessibilityLabel already overrides the subtree.
      // What must NOT exist is a glyph leaning on a hiding prop to stay quiet.
      for (const g of glyphOnly) {
        expect(g.props).not.toHaveProperty(IOS_ONLY);
        expect(g.props).not.toHaveProperty(ANDROID_ONLY);
        expect(g.props).not.toHaveProperty(WEB_ONLY);
      }
    });
  });

  describe("repo-wide: no unconditional native-only a11y prop in a component", () => {
    // If a future component reaches for `importantForAccessibility` directly,
    // this is the thing that notices. The one legal home for these names is the
    // platform helper, which picks exactly one per platform.
    const HELPER = path.join("src", "lib", "a11y.ts");

    function sourceFiles(dir: string, out: string[] = []): string[] {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) sourceFiles(full, out);
        else if (/\.tsx?$/.test(entry.name)) out.push(full);
      }
      return out;
    }

    it("keeps the native-only spellings inside the platform helper", () => {
      const root = path.join(__dirname, "..", "..");
      const files = [
        ...sourceFiles(path.join(root, "src")),
        ...sourceFiles(path.join(root, "app")),
      ];
      const offenders = files
        .map((f) => ({ rel: path.relative(root, f), text: fs.readFileSync(f, "utf8") }))
        .filter(
          ({ rel, text }) =>
            rel !== HELPER &&
            (text.includes(ANDROID_ONLY) || text.includes(IOS_ONLY)),
        )
        .map(({ rel }) => rel);
      expect(offenders).toEqual([]);
    });
  });
});
