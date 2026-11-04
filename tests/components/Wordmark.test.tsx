import React from "react";
import { render } from "@testing-library/react-native";
import { Wordmark } from "../../src/components/Wordmark";
import { tokens } from "../../src/theme/tokens";

function colorOf(node: { props: { style?: unknown } }): unknown {
  const style = node.props.style;
  const flat = Array.isArray(style)
    ? Object.assign({}, ...style.filter(Boolean))
    : style || {};
  return (flat as { color?: unknown }).color;
}

// ADR 0010 records a BINDING constraint: Pulse Red measures 4.90:1 on Paper but
// only 4.29:1 on Ink. That clears SC 1.4.11's 3:1 bar for a graphical object
// (the heart inside the mark) and FAILS SC 1.4.3's 4.5:1 bar for text.
//
// tests/unit/contrast.test.ts proves the ratios, but it only ever sees raw token
// PAIRS — it cannot see which token a component actually hands to a <Text>. This
// suite closes that gap for the one component that renders the accent as text.
describe("Wordmark — the accent never becomes text on Ink (ADR 0010)", () => {
  it("accents 'Rhythm' in Pulse Red on Paper (primary lockup, 4.90:1)", () => {
    const { getByText } = render(<Wordmark variant="primary" />);
    expect(colorOf(getByText("Rhythm"))).toBe(tokens.pulse);
  });

  it("does NOT set 'Rhythm' in Pulse Red on an Ink background (reversed)", () => {
    const { getByText } = render(<Wordmark variant="reversed" />);
    const color = colorOf(getByText("Rhythm"));
    expect(color).not.toBe(tokens.pulse);
    expect(color).toBe(tokens.paper);
  });

  it("keeps the mono lockup to a single colour", () => {
    const { getByText } = render(<Wordmark variant="mono" />);
    expect(colorOf(getByText("Rhythm"))).toBe(tokens.ink);
    expect(colorOf(getByText("One"))).toBe(tokens.ink);
  });

  it("sets 'One' in the letterform colour for every variant", () => {
    const primary = render(<Wordmark variant="primary" />);
    expect(colorOf(primary.getByText("One"))).toBe(tokens.ink);
    const reversed = render(<Wordmark variant="reversed" />);
    expect(colorOf(reversed.getByText("One"))).toBe(tokens.paper);
  });

  it("markOnly exposes one image with the accessible name, and no lockup text", () => {
    const { getByRole, queryByText } = render(<Wordmark markOnly />);
    expect(getByRole("image").props.accessibilityLabel).toBe("OneRhythm");
    expect(queryByText("Rhythm")).toBeNull();
  });
});
