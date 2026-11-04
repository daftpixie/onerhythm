import React from "react";
import { TextInput } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

const mockSubscribe = jest.fn();
jest.mock("../../src/lib/updates/subscribe", () => ({
  subscribeToUpdates: (...args: unknown[]) => mockSubscribe(...args),
  looksLikeEmail: jest.requireActual("../../src/lib/updates/subscribe")
    .looksLikeEmail,
}));

import { UpdatesSignupForm } from "../../src/components/UpdatesSignupForm";

beforeEach(() => {
  jest.clearAllMocks();
  mockSubscribe.mockResolvedValue({ ok: true });
});

describe("updates signup form — what it collects", () => {
  it("collects an email address and nothing else", () => {
    const { UNSAFE_getAllByType } = render(<UpdatesSignupForm />);
    // One field. No name, no diagnosis, no "how did you hear about us", and
    // above all nothing about the person's condition (CLAUDE.md #1).
    expect(UNSAFE_getAllByType(TextInput)).toHaveLength(1);
  });

  it("says nothing about health, diagnosis, or symptoms anywhere in the form", () => {
    const { toJSON } = render(<UpdatesSignupForm />);
    const text = JSON.stringify(toJSON());
    expect(text).not.toMatch(
      /diagnos|symptom|condition|arrhythmia|afib|ICD|patient|caregiver/i,
    );
  });

  it("states plainly what the address is used for and that it is never sold", () => {
    const { toJSON } = render(<UpdatesSignupForm />);
    const text = JSON.stringify(toJSON());
    expect(text).toMatch(/never sell/i);
    expect(text).toMatch(/unsubscribe/i);
  });
});

describe("updates signup form — accessibility (WCAG 2.2 AA)", () => {
  it("gives the field a real visible label, not a placeholder", () => {
    const { getByLabelText, UNSAFE_getAllByType } = render(
      <UpdatesSignupForm />,
    );
    expect(getByLabelText("Your email address")).toBeTruthy();

    const input = UNSAFE_getAllByType(TextInput)[0];
    // Placeholder-as-label disappears on focus and fails 3.3.2 (Brand v3 §7:
    // "label above the field, never placeholder-as-label").
    expect(input.props.placeholder).toBeFalsy();
  });

  it("renders the label as visible text above the field, not only to assistive tech", () => {
    const { getByText } = render(<UpdatesSignupForm />);
    expect(getByText("Your email address")).toBeTruthy();
  });

  it("gives the submit button a 44px minimum target", () => {
    const { getByRole } = render(<UpdatesSignupForm />);
    const button = getByRole("button", { name: "Keep me posted" });
    const style = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style.filter(Boolean))
      : button.props.style;
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
  });

  it("uses an email keyboard and no autocorrect/autocapitalize traps", () => {
    const { UNSAFE_getAllByType } = render(<UpdatesSignupForm />);
    const input = UNSAFE_getAllByType(TextInput)[0];
    expect(input.props.keyboardType).toBe("email-address");
    expect(input.props.autoCapitalize).toBe("none");
    expect(input.props.autoCorrect).toBe(false);
    // 1.3.5 Identify Input Purpose + 2.2's Redundant Entry: let the browser
    // fill it for a 65+ user who does not want to type it again.
    expect(input.props.autoComplete).toBe("email");
  });
});

describe("updates signup form — errors are words, never colour", () => {
  it("identifies a malformed address in plain words, in text", async () => {
    const { getByLabelText, getByRole, findByText } = render(
      <UpdatesSignupForm />,
    );
    fireEvent.changeText(getByLabelText("Your email address"), "nope");
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));

    // SC 1.4.1 + 3.3.1: the error must be readable text, not a red border.
    expect(
      await findByText(/that doesn't look like an email address/i),
    ).toBeTruthy();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("announces the error to assistive technology", async () => {
    const { getByLabelText, getByRole, findByRole } = render(
      <UpdatesSignupForm />,
    );
    fireEvent.changeText(getByLabelText("Your email address"), "nope");
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));

    const alert = await findByRole("alert");
    expect(alert).toBeTruthy();
  });

  it("explains a failed submission without jargon or an error code", async () => {
    mockSubscribe.mockResolvedValue({ ok: false, reason: "failed" });
    const { getByLabelText, getByRole, findByRole } = render(
      <UpdatesSignupForm />,
    );
    fireEvent.changeText(
      getByLabelText("Your email address"),
      "someone@example.com",
    );
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));

    const alert = await findByRole("alert");
    const text = JSON.stringify(alert.props.children ?? "");
    expect(text).not.toMatch(/\b(4\d\d|5\d\d|23505|42501|PGRST)\b/);
    expect(text).toMatch(/couldn't|could not|try again/i);
  });
});

/**
 * The status text, or "" while the region is still empty.
 *
 * Why this exists (ADR 0013): the live region is deliberately MOUNTED EMPTY so
 * its later text reads as a change rather than an arrival. That makes
 * `await findByRole("status")` resolve on the very first tick, before the
 * submit has resolved — so it is not a wait at all. Every assertion that
 * followed one was racing the state update, which is the real cause of the
 * intermittent "281/282" failure that was being blamed on WSL load. Wait on the
 * CONTENT, never on the node.
 */
function statusText(tree: ReturnType<typeof render>): string {
  const status = tree.queryByRole("status");
  return status ? JSON.stringify(status.props.children ?? "") : "";
}

describe("updates signup form — success tells the truth", () => {
  it("submits the trimmed address and announces success politely", async () => {
    const tree = render(<UpdatesSignupForm />);
    const { getByLabelText, getByRole } = tree;

    // The region exists and is EMPTY before the submit. Asserting this is what
    // stops the assertions below from being satisfied by a region that was
    // always there saying nothing.
    expect(tree.getByRole("status")).toBeTruthy();
    expect(statusText(tree)).toMatch(/^""$/);

    fireEvent.changeText(
      getByLabelText("Your email address"),
      "  Someone@Example.com  ",
    );
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));

    await waitFor(() =>
      expect(mockSubscribe).toHaveBeenCalledWith("Someone@Example.com"),
    );
    await waitFor(() => expect(statusText(tree)).toMatch(/saved your address/i));

    // Polite, never assertive — checked while the region actually has content,
    // where the assertion can fail. Idle, it was true by construction.
    expect(tree.getByRole("status").props.accessibilityLiveRegion).toBe(
      "polite",
    );
  });

  it("says plainly that NO confirmation email has been sent yet, and why", async () => {
    const tree = render(<UpdatesSignupForm />);
    const { getByLabelText, getByRole } = tree;
    fireEvent.changeText(
      getByLabelText("Your email address"),
      "someone@example.com",
    );
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));

    await waitFor(() => expect(statusText(tree)).toMatch(/saved your address/i));
    const text = statusText(tree);
    // The send is blocked until the SMTP gate (ADR 0011 decision b). The page
    // must not claim an email is on its way, and must not imply the person is
    // already on the list — they are not subscribed until they confirm.
    expect(text).toMatch(/nothing is sent yet|no email has been sent/i);
    expect(text).not.toMatch(/check your (inbox|email)|we've sent|we have sent/i);
  });

  it("replaces the form with the success message rather than inviting a resubmit", async () => {
    const tree = render(<UpdatesSignupForm />);
    const { getByLabelText, getByRole, queryByRole } = tree;
    fireEvent.changeText(
      getByLabelText("Your email address"),
      "someone@example.com",
    );
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));
    await waitFor(() => expect(statusText(tree)).toMatch(/saved your address/i));
    expect(queryByRole("button", { name: "Keep me posted" })).toBeNull();
  });

  it("treats an address already on the list identically to a new one", async () => {
    // The database absorbs duplicates silently; the UI must not undo that by
    // rendering a different message for an address it has seen before.
    mockSubscribe.mockResolvedValue({ ok: true });
    const tree = render(<UpdatesSignupForm />);
    const { getByLabelText, getByRole } = tree;
    fireEvent.changeText(
      getByLabelText("Your email address"),
      "already@example.com",
    );
    fireEvent.press(getByRole("button", { name: "Keep me posted" }));
    await waitFor(() => expect(statusText(tree)).toMatch(/saved your address/i));
    const text = statusText(tree);
    // Not vacuous: the region now provably HAS content, so "does not say
    // already" is a statement about a real message rather than about "".
    expect(text).not.toMatch(/already/i);
  });
});
