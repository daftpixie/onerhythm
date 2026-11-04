import { Platform } from "react-native";

/**
 * Props that hide a purely DECORATIVE element from assistive technology.
 *
 * The three platforms spell this differently and the spellings are NOT
 * interchangeable — passing all three everywhere is an actual defect, not
 * belt-and-braces. Verified against the installed react-native-svg 15.15.5 and
 * react-native-web 0.21.2:
 *
 *  - react-native-svg's web build renders a real <svg> and spreads every prop it
 *    does not consume straight onto the DOM node. react-native-web only strips
 *    the names on its `_excluded` list, which does not include the native-only
 *    ones — so they reach the DOM, React logs "React does not recognize the
 *    `importantForAccessibility` prop on a DOM element", and the prop even
 *    survives into the markup as a junk attribute (SVG is case-preserving XML).
 *  - react-native-web's <Text> filters through an allowlist instead, so there
 *    the same prop is dropped in silence: no warning, and no hiding either.
 *
 * Both roads end with the element unhidden on web. Only `aria-hidden` works
 * there; only `importantForAccessibility` works on Android; only
 * `accessibilityElementsHidden` works on iOS. So pick exactly one.
 *
 * The accessible name must live on an ANCESTOR — hiding a glyph without naming
 * its wrapper means it announces nothing at all rather than announcing once.
 *
 * DO NOT use this on a <Text> nested inside another <Text>. On iOS nested Text
 * collapses into a single attributed string and the inner element's a11y props
 * are dropped, so the glyph would still be spoken there — a silent failure on
 * the platform hardest to spot it on. For a decorative glyph inside a run of
 * text, give the PARENT an explicit accessibilityLabel instead; that overrides
 * the subtree on all three platforms. CrisisHelpSheet's title does exactly
 * this. This helper is for a decorative element that is a SIBLING of its label,
 * or a self-contained one like an <Svg>.
 */
export type DecorativeProps = {
  "aria-hidden"?: true;
  importantForAccessibility?: "no-hide-descendants";
  accessibilityElementsHidden?: true;
};

/**
 * There is deliberately NO `unavailable()` helper here. Please do not re-add one.
 *
 * It existed until ADR 0014 and it could not work on web. The goal was to mark a
 * control unavailable while keeping it reachable by Tab, so a keyboard-only
 * member learns WHY it is grey instead of tabbing past a dead end. Every route
 * to that on react-native-web 0.21.2 is closed:
 *
 *  - `accessibilityState={{disabled}}` is INERT on web — createDOMProps contains
 *    zero references to it. It carries the state on native only.
 *  - Passing `aria-disabled` directly is also inert: Pressable renders
 *    `<View {...rest} aria-disabled={disabled}>` and its own literal, spread
 *    last, overwrites whatever came through `rest` — with `undefined`.
 *  - `accessibilityDisabled` DOES survive and does produce `aria-disabled`
 *    (`disabled = ariaDisabled || accessibilityDisabled`) — but createDOMProps
 *    then "enhances with native semantics": for an element type of
 *    button/form/input/select/textarea it ALSO sets a real `disabled`
 *    attribute. `accessibilityRole="button"` makes the element a real
 *    <button>, so this is unavoidable. A disabled <button> is out of the Tab
 *    order regardless of tabindex, and receives no click events at all — the
 *    exact dead end the helper was written to prevent, plus a dead onPress.
 *
 * The ARIA was also wrong on its own terms: `aria-disabled` means perceivable
 * but NOT operable, and a control that explains itself when pressed IS operable.
 *
 * So carry the state the way the brand already carries state (icon + text +
 * weight, Brand v3 §7) and point `aria-describedby` at the words that say what
 * to do. DeleteAccountPanel does exactly this.
 */

export function hiddenFromAssistiveTech(): DecorativeProps {
  // Read at call time, not module load, so it is honest under test and under
  // any future platform-switching renderer.
  switch (Platform.OS) {
    case "web":
      return { "aria-hidden": true };
    case "android":
      return { importantForAccessibility: "no-hide-descendants" };
    default:
      return { accessibilityElementsHidden: true };
  }
}
