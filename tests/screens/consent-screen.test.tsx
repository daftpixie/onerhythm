import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  HealthSelfIdConsent,
  type SelfIdTagOption,
} from "../../src/components/HealthSelfIdConsent";

const tags: SelfIdTagOption[] = [
  { id: "t1", code: "afib", label: "AFib", tag_type: "diagnosis" },
  { id: "t2", code: "svt", label: "SVT", tag_type: "diagnosis" },
  { id: "t3", code: "anxiety", label: "Anxiety", tag_type: "emotional_symptom" },
];

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

describe("HealthSelfIdConsent — WCAG 2.2 AA", () => {
  it("consent control is UNCHECKED by default (explicit opt-in)", () => {
    const { getByRole } = render(
      <HealthSelfIdConsent tags={tags} onSave={jest.fn()} onSkip={jest.fn()} />,
    );
    const checkbox = getByRole("checkbox", { name: /add this/i });
    expect(checkbox.props.accessibilityState.checked).toBe(false);
  });

  it("shows the plain-language promise (optional, private, never sold/shared)", () => {
    const { getByText } = render(
      <HealthSelfIdConsent tags={tags} onSave={jest.fn()} onSkip={jest.fn()} />,
    );
    expect(getByText(/optional/i)).toBeTruthy();
    expect(getByText(/never (sell|sold|share|shared)/i)).toBeTruthy();
  });

  it("primary actions meet the 44px touch target", () => {
    const { getByRole } = render(
      <HealthSelfIdConsent tags={tags} onSave={jest.fn()} onSkip={jest.fn()} />,
    );
    const save = getByRole("button", { name: /save/i });
    const skip = getByRole("button", { name: /skip/i });
    expect(flatten(save.props.style).minHeight).toBeGreaterThanOrEqual(44);
    expect(flatten(skip.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("the consent explanation is persistent — no dismiss/close (no dark pattern)", () => {
    const { queryByRole, getByText } = render(
      <HealthSelfIdConsent tags={tags} onSave={jest.fn()} onSkip={jest.fn()} />,
    );
    // explanation is shown without any interaction…
    expect(getByText(/optional/i)).toBeTruthy();
    // …and cannot be dismissed away.
    expect(queryByRole("button", { name: /close|dismiss|got it|x/i })).toBeNull();
  });

  it("Skip is offered as plainly as Save (symmetry, no dark pattern)", () => {
    const onSkip = jest.fn();
    const { getByRole } = render(
      <HealthSelfIdConsent tags={tags} onSave={jest.fn()} onSkip={onSkip} />,
    );
    fireEvent.press(getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("does NOT grant when saved with consent unchecked", () => {
    const onSave = jest.fn();
    const { getByRole } = render(
      <HealthSelfIdConsent tags={tags} onSave={onSave} onSkip={jest.fn()} />,
    );
    fireEvent.press(getByRole("button", { name: /save/i }));
    // saved with consent unchecked => parent must write nothing
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ consentChecked: false, selectedTagIds: [] }),
    );
  });

  it("toggling consent on, selecting a tag, then saving passes the opt-in payload", () => {
    const onSave = jest.fn();
    const { getByRole } = render(
      <HealthSelfIdConsent tags={tags} onSave={onSave} onSkip={jest.fn()} />,
    );
    fireEvent.press(getByRole("checkbox", { name: /add this/i }));
    fireEvent.press(getByRole("checkbox", { name: /^AFib$/i }));
    fireEvent.press(getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith({
      consentChecked: true,
      selectedTagIds: ["t1"],
    });
  });
});
