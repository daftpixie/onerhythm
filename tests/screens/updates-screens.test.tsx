import React from "react";
import { render, waitFor } from "@testing-library/react-native";

const mockParams = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams(),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/lib/supabase", () => ({ supabase: {} }));

const mockConfirm = jest.fn();
const mockUnsubscribe = jest.fn();
jest.mock("../../src/lib/updates/subscribe", () => ({
  confirmSubscription: (...args: unknown[]) => mockConfirm(...args),
  unsubscribeFromUpdates: (...args: unknown[]) => mockUnsubscribe(...args),
}));

import ConfirmScreen from "../../app/updates/confirm";
import UnsubscribeScreen from "../../app/updates/unsubscribe";
import PrivacyNoticeScreen from "../../app/privacy-notice";

const TOKEN = "a".repeat(64);

beforeEach(() => {
  jest.clearAllMocks();
  mockParams.mockReturnValue({ token: TOKEN });
});

function text(tree: unknown): string {
  return JSON.stringify(tree);
}

describe("confirm screen", () => {
  it("confirms with the token from the link", async () => {
    mockConfirm.mockResolvedValue("confirmed");
    render(<ConfirmScreen />);
    await waitFor(() => expect(mockConfirm).toHaveBeenCalledWith(TOKEN));
  });

  it("says plainly that the person is now on the list", async () => {
    mockConfirm.mockResolvedValue("confirmed");
    const { findByRole } = render(<ConfirmScreen />);
    const status = await findByRole("status");
    expect(text(status.props.children)).toMatch(/you're on the list|you are on the list/i);
  });

  it("handles a second click on the same link without alarming anyone", async () => {
    mockConfirm.mockResolvedValue("already_confirmed");
    const { findByRole } = render(<ConfirmScreen />);
    const status = await findByRole("status");
    const body = text(status.props.children);
    expect(body).toMatch(/already/i);
    expect(body).not.toMatch(/error|invalid|failed/i);
  });

  it("explains an unrecognised link in words a tired person can act on", async () => {
    mockConfirm.mockResolvedValue("invalid");
    const { findByRole } = render(<ConfirmScreen />);
    const status = await findByRole("status");
    const body = text(status.props.children);
    expect(body).toMatch(/link/i);
    expect(body).not.toMatch(/\b(4\d\d|5\d\d|null|undefined|PGRST)\b/);
  });

  it("does not call the database when the link carries no token", async () => {
    mockParams.mockReturnValue({});
    const { findByRole } = render(<ConfirmScreen />);
    await findByRole("status");
    expect(mockConfirm).not.toHaveBeenCalled();
  });

  it("announces its outcome politely rather than as an alert", async () => {
    mockConfirm.mockResolvedValue("confirmed");
    const { findByRole } = render(<ConfirmScreen />);
    const status = await findByRole("status");
    expect(status.props.accessibilityLiveRegion).toBe("polite");
  });
});

describe("unsubscribe screen", () => {
  it("unsubscribes with the token from the link, with no login", async () => {
    mockUnsubscribe.mockResolvedValue("unsubscribed");
    render(<UnsubscribeScreen />);
    await waitFor(() => expect(mockUnsubscribe).toHaveBeenCalledWith(TOKEN));
  });

  it("confirms in plain words that no more email will be sent", async () => {
    mockUnsubscribe.mockResolvedValue("unsubscribed");
    const { findByRole } = render(<UnsubscribeScreen />);
    const status = await findByRole("status");
    expect(text(status.props.children)).toMatch(/won't|will not/i);
  });

  it("is idempotent to the reader too", async () => {
    mockUnsubscribe.mockResolvedValue("already_unsubscribed");
    const { findByRole } = render(<UnsubscribeScreen />);
    const status = await findByRole("status");
    const body = text(status.props.children);
    expect(body).toMatch(/already/i);
    expect(body).not.toMatch(/error|failed/i);
  });

  it("never asks the person to sign in to leave the list (CAN-SPAM)", async () => {
    mockUnsubscribe.mockResolvedValue("unsubscribed");
    const { toJSON, findByRole } = render(<UnsubscribeScreen />);
    await findByRole("status");
    expect(text(toJSON())).not.toMatch(/sign in|log in|create an account/i);
  });
});

describe("marketing privacy notice", () => {
  it("says what is collected and that it is only an email address", () => {
    const { toJSON } = render(<PrivacyNoticeScreen />);
    expect(text(toJSON())).toMatch(/email address/i);
  });

  it("promises no sale and explains the planned processors", () => {
    const { toJSON } = render(<PrivacyNoticeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/never sell/i);
    expect(body).toMatch(/Supabase/i);
    expect(body).toMatch(/private Google Sheet/i);
    expect(body).toMatch(/under written contracts/i);
    expect(body).not.toMatch(/Nobody\. We never sell your address and we never share/i);
  });

  it("states that it covers the updates list ONLY", () => {
    const { toJSON } = render(<PrivacyNoticeScreen />);
    expect(text(toJSON())).toMatch(/updates list only|only the updates list/i);
  });

  it("does not claim to be the member privacy policy, and says that review is still pending", () => {
    // ADR 0011 decision (e): this notice does NOT satisfy the build-blocking
    // attorney review (CLAUDE.md #7), and must not be mistaken for it.
    const { toJSON } = render(<PrivacyNoticeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/lawyer|attorney|legal review/i);
    expect(body).toMatch(/not open yet|isn't open yet|before .{0,20}open/i);
  });

  it("explains how to unsubscribe and how to ask for deletion", () => {
    const { toJSON } = render(<PrivacyNoticeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/unsubscribe/i);
    expect(body).toMatch(/delete/i);
  });

  it("states retention honestly, without promising an automatic purge", () => {
    const { toJSON } = render(<PrivacyNoticeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/until you/i);
    // No scheduler exists, so no automatic-deletion promise may appear.
    expect(body).not.toMatch(/automatically delete|deleted after \d+ days/i);
  });

  it("mentions no health data, because the form collects none", () => {
    const { toJSON } = render(<PrivacyNoticeScreen />);
    expect(text(toJSON())).not.toMatch(/diagnos|symptom|health data we collect/i);
  });
});
