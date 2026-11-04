import React from "react";
import { render } from "@testing-library/react-native";
import { DisclaimerBand } from "../../src/components/DisclaimerBand";
import { tokens } from "../../src/theme/tokens";

describe("DisclaimerBand", () => {
  it("renders disclaimer text", () => {
    const { getByText } = render(<DisclaimerBand />);
    expect(
      getByText(/general information, not medical advice/i)
    ).toBeTruthy();
  });

  it("renders 'talk to your own clinician' guidance", () => {
    const { getByText } = render(<DisclaimerBand />);
    expect(getByText(/talk to your own clinician/i)).toBeTruthy();
  });

  it("has NO dismiss or close control", () => {
    const { queryAllByRole } = render(<DisclaimerBand />);
    const buttons = queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("renders info icon with text label (never icon-only)", () => {
    const { getByText } = render(<DisclaimerBand />);
    expect(getByText(/not medical advice/i)).toBeTruthy();
  });

  it("text meets minimum 14px size", () => {
    const { getByText } = render(<DisclaimerBand />);
    const textEl = getByText(/general information/i);
    const style = textEl.props.style;
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style || {};
    expect(flatStyle.fontSize).toBeGreaterThanOrEqual(14);
  });

  it("has the Ink 4% fill (v3 §7)", () => {
    const { getByTestId } = render(<DisclaimerBand />);
    const band = getByTestId("disclaimer-band");
    const style = band.props.style;
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style || {};
    expect(flatStyle.backgroundColor).toBe(tokens.fill);
  });

  it("has a 3px Ink left border (v3 §7 — the caution colour is retired)", () => {
    const { getByTestId } = render(<DisclaimerBand />);
    const band = getByTestId("disclaimer-band");
    const style = band.props.style;
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style || {};
    expect(flatStyle.borderLeftWidth).toBe(3);
    expect(flatStyle.borderLeftColor).toBe(tokens.ink);
  });

  it("text colour is Ink 70% (v3 §3)", () => {
    const { getByText } = render(<DisclaimerBand />);
    const textEl = getByText(/general information/i);
    const style = textEl.props.style;
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style || {};
    expect(flatStyle.color).toBe(tokens.inkSecondary);
  });
});
