// Decorative elements must be hidden from assistive tech ON THE DEPLOY TARGET.
//
// PROOF CASE (b): the three platforms spell this differently and the spellings
// are not interchangeable. react-native-web's <Text> filters props through an
// allowlist, so `importantForAccessibility` is dropped in SILENCE — no warning,
// and no hiding either. react-native-svg's web build takes the opposite road and
// spreads unknown props straight onto the real <svg>, where the prop survives
// into the markup as a junk attribute (SVG is case-preserving XML).
//
// Both roads end with the element unhidden on web. The "rn" project cannot see
// either one: it reads the prop the component set, and the prop is set.

import { Wordmark } from "../../src/components/Wordmark";
import { mount } from "./mount";

describe("Wordmark mark glyph", () => {
  it("renders a real <svg> element", () => {
    // The prop-leak path only exists because react-native-svg resolves to its
    // web build here. If that ever stopped being true the leak assertions below
    // would pass for the wrong reason.
    const { container } = mount(<Wordmark />);
    expect(container.querySelector("svg")).toBeInstanceOf(SVGElement);
  });

  it("hides the glyph with aria-hidden, the only spelling web honours", () => {
    const { container } = mount(<Wordmark />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("leaks no native-only hiding props onto the DOM", () => {
    const { container } = mount(<Wordmark />);
    const svg = container.querySelector("svg")!;

    // Case-insensitive sweep: SVG preserves case, so a leaked prop shows up
    // verbatim as importantForAccessibility="no-hide-descendants".
    const leaked = svg
      .getAttributeNames()
      .filter((n) =>
        /importantforaccessibility|accessibilityelementshidden/i.test(n),
      );
    expect(leaked).toEqual([]);
  });

  it("still exposes the mark under a single accessible name when standalone", () => {
    // Hiding the glyph without naming an ancestor means it announces NOTHING,
    // which is a worse failure than announcing twice.
    const { getByRole } = mount(<Wordmark markOnly />);
    expect(getByRole("img")).toHaveAttribute("aria-label", "OneRhythm");
  });

  it("hides the glyph in the reversed variant too", () => {
    const { container } = mount(<Wordmark variant="reversed" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
