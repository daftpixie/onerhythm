// The disclaimer band is persistent, non-dismissible, and appears on every
// health page. CLAUDE.md non-negotiable #2: no diagnosis or individualised
// medical advice anywhere, with persistent disclaimers. If this renders but
// says nothing to a screen reader, the disclaimer is decorative — which is the
// same as not having one.

import { DisclaimerBand } from "../../src/components/DisclaimerBand";
import { mount } from "./mount";

const SENTENCE =
  "General information, not medical advice. Talk to your own clinician.";

describe("DisclaimerBand on web", () => {
  it("states plainly that this is not medical advice", () => {
    const { getByText } = mount(<DisclaimerBand />);
    expect(getByText(SENTENCE)).toBeInTheDocument();
  });

  it("is present in the accessible tree, not hidden", () => {
    // A disclaimer inside aria-hidden would be legally worthless and visually
    // indistinguishable. Check the sentence and every ancestor up to the band.
    const { getByText, container } = mount(<DisclaimerBand />);
    let node: HTMLElement | null = getByText(SENTENCE);
    while (node && node !== container) {
      expect(node).not.toHaveAttribute("aria-hidden", "true");
      node = node.parentElement;
    }
  });

  it("names the ℹ glyph rather than leaving it to be spelled out", () => {
    const { container } = mount(<DisclaimerBand />);
    const icon = container.querySelector('[aria-label="Information"]');
    expect(icon).not.toBeNull();
    expect(icon).toHaveTextContent("ℹ");
  });

  it("offers no way to dismiss it", () => {
    // Persistent means persistent: no button, no link, no control at all.
    const { container } = mount(<DisclaimerBand />);
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector('[role="button"]')).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });
});
