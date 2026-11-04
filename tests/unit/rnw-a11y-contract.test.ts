/**
 * The accessibility contract we depend on from the INSTALLED react-native-web.
 *
 * Why this file exists: the jest suite runs entirely under the native renderer
 * (jest-expo), so nothing in it ever passes through react-native-web. Every
 * assertion elsewhere checks the prop a component INTENDED to set, not what the
 * browser actually receives — and web is the launch surface.
 *
 * That gap is not hypothetical. It let a real regression pass 208/208 green: the
 * destructive control was switched from `disabled` to `aria-disabled` to keep it
 * in the Tab order, and the a11y reviewer found that react-native-web silently
 * discarded it, so the button announced as merely "button" with no hint it was
 * unavailable. The native-tree test read the intended value and passed.
 *
 * These tests read react-native-web's own source and pin the three behaviours
 * src/lib/a11y.ts relies on. They are cheap, need no DOM, and will fail loudly
 * on an upgrade that changes any of them — which is exactly when a human needs
 * to re-check the real markup.
 *
 * This is a NARROW stand-in. It does not replace a proper jsdom + RNW render
 * test; it guards the specific mechanics we bet on.
 */
import { readFileSync } from "fs";
import { join } from "path";

const RNW = join(__dirname, "..", "..", "node_modules", "react-native-web", "dist");

function read(rel: string): string {
  return readFileSync(join(RNW, rel), "utf8");
}

describe("react-native-web accessibility contract (installed version)", () => {
  const pressable = () => read("exports/Pressable/index.js");
  const createDOMProps = () => read("modules/createDOMProps/index.js");

  it("Pressable's `disabled` prop removes the control from the Tab order", () => {
    // This is WHY we do not use `disabled` on a control we still want a
    // keyboard-only member to reach and be told about.
    expect(pressable()).toMatch(/_tabIndex\s*=\s*disabled\s*\?\s*-1\s*:\s*0/);
  });

  it("Pressable honours an explicit tabIndex over its own computation", () => {
    expect(pressable()).toMatch(/if\s*\(tabIndex\s*!==\s*undefined\)/);
  });

  it("Pressable OVERWRITES any aria-disabled passed in by the caller", () => {
    // Its own literal is spread AFTER `rest`, so a caller-supplied
    // `aria-disabled` is replaced by Pressable's own `disabled` (undefined once
    // we stop passing `disabled`). Passing aria-disabled directly is therefore
    // silently useless — the trap this file exists to catch.
    const src = pressable();
    const call = src.slice(src.indexOf("_extends({}, rest, pressEventHandlers"));
    expect(call).toContain('"aria-disabled": disabled');
    // `rest` comes first, the literal second — so the literal wins.
    expect(call.indexOf("rest")).toBeLessThan(call.indexOf('"aria-disabled"'));
  });

  it("`accessibilityDisabled` is NOT stripped by Pressable, so it survives in rest", () => {
    const excluded = /var _excluded = \[(.*?)\];/s.exec(pressable())?.[1] ?? "";
    expect(excluded).toContain('"disabled"');
    expect(excluded).not.toContain('"accessibilityDisabled"');
  });

  it("createDOMProps derives aria-disabled from accessibilityDisabled", () => {
    const src = createDOMProps();
    expect(src).toMatch(/var disabled = ariaDisabled \|\| accessibilityDisabled/);
    expect(src).toMatch(/domProps\['aria-disabled'\] = true/);
  });

  it("createDOMProps IGNORES accessibilityState entirely — it is native-only", () => {
    // If this ever starts failing, accessibilityState began working on web and
    // src/lib/a11y.ts can be simplified. Until then it must not be relied on.
    expect(createDOMProps()).not.toContain("accessibilityState");
  });

  it("createDOMProps maps accessibilityLiveRegion to aria-live", () => {
    expect(createDOMProps()).toMatch(/domProps\['aria-live'\]/);
  });

  it("createDOMProps maps accessibilityLabel to aria-label, and aria-level through", () => {
    const src = createDOMProps();
    expect(src).toMatch(/domProps\['aria-label'\] = _ariaLabel/);
    expect(src).toMatch(/domProps\['aria-level'\]/);
  });

  it("AccessibilityInfo.announceForAccessibility is a NO-OP on web", () => {
    // So it must never be the only way a message reaches someone on web.
    // app/settings/delete-account.tsx moves focus as the load-bearing
    // mechanism and uses the announce purely as native insurance.
    const src = read("exports/AccessibilityInfo/index.js");
    expect(src).toMatch(/announceForAccessibility:\s*function announceForAccessibility\([^)]*\)\s*\{\s*\}/);
  });
});
