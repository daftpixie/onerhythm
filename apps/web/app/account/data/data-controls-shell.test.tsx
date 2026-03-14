import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataControlsShell } from "./data-controls-shell";

vi.mock("../../../components/session-actions", () => ({
  SessionActions: () => <div>Session actions</div>,
}));

const authApiMocks = vi.hoisted(() => ({
  createDeleteRequest: vi.fn(),
  createExportRequest: vi.fn(),
  getExportDownloadUrl: vi.fn(),
  getOwnedProfile: vi.fn(),
  getSession: vi.fn(),
  listAuthSessions: vi.fn(),
  listConsents: vi.fn(),
  listDeleteRequests: vi.fn(),
  listExportRequests: vi.fn(),
  revokeAuthSession: vi.fn(),
  revokeConsent: vi.fn(),
  revokeOtherAuthSessions: vi.fn(),
}));

vi.mock("../../../lib/auth-api", () => authApiMocks);

describe("DataControlsShell", () => {
  beforeEach(() => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: true,
      user: {
        email: "person@example.com",
        preferred_language: "en-US",
        profile_id: "profile-1",
        role: "user",
        user_id: "user-1",
      },
    });
    authApiMocks.getOwnedProfile.mockResolvedValue({
      created_at: "2026-03-01T12:00:00Z",
      diagnosis_selection: {
        diagnosis_code: "afib",
        diagnosis_source: "self_reported",
      },
      emotional_context: ["uncertain"],
      physical_symptoms: ["palpitations"],
      preferred_language: "en-US",
      profile_id: "profile-1",
      treatment_history: {
        ablation_count: 1,
        current_medications: ["beta blocker"],
        has_implantable_device: false,
        prior_procedures: [],
      },
      updated_at: "2026-03-05T15:30:00Z",
    });
    authApiMocks.listConsents.mockResolvedValue([
      {
        consent_record_id: "consent-1",
        consent_type: "educational_profile",
        effective_at: "2026-03-01T12:00:00Z",
        locale: "en-US",
        policy_version: "launch-v1",
        profile_id: "profile-1",
        source: "web",
        status: "granted",
      },
    ]);
    authApiMocks.listDeleteRequests.mockResolvedValue([]);
    authApiMocks.listExportRequests.mockResolvedValue([
      {
        artifact_available: true,
        completed_at: "2026-03-10T12:30:00Z",
        export_request_id: "export-existing",
        profile_id: "profile-1",
        requested_at: "2026-03-10T12:00:00Z",
        status: "completed",
      },
    ]);
    authApiMocks.listAuthSessions.mockResolvedValue({
      sessions: [
        {
          created_at: "2026-03-01T12:00:00Z",
          current: true,
          expires_at: "2026-04-01T12:00:00Z",
          last_seen_at: "2026-03-14T12:00:00Z",
          session_id: "session-current",
        },
        {
          created_at: "2026-03-02T12:00:00Z",
          current: false,
          expires_at: "2026-04-02T12:00:00Z",
          ip_address_hint: "203.0.113.x",
          last_seen_at: "2026-03-13T12:00:00Z",
          session_id: "session-other",
          user_agent: "Firefox",
        },
      ],
    });
    authApiMocks.createExportRequest.mockResolvedValue({
      artifact_available: false,
      export_request_id: "export-new",
      profile_id: "profile-1",
      requested_at: "2026-03-14T13:00:00Z",
      status: "requested",
    });
    authApiMocks.revokeConsent.mockResolvedValue({
      consent_record_id: "consent-1",
      consent_type: "educational_profile",
      effective_at: "2026-03-01T12:00:00Z",
      locale: "en-US",
      policy_version: "launch-v1",
      profile_id: "profile-1",
      revoked_at: "2026-03-14T13:05:00Z",
      revocation_reason: "user_request",
      source: "web",
      status: "revoked",
    });
    authApiMocks.createDeleteRequest.mockResolvedValue({
      completed_at: "2026-03-14T13:10:00Z",
      delete_request_id: "delete-1",
      profile_id: "profile-1",
      requested_at: "2026-03-14T13:09:00Z",
      status: "completed",
    });
    authApiMocks.getExportDownloadUrl.mockReturnValue("/exports/export-existing");
  });

  it("announces export, consent revocation, and deletion outcomes", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<DataControlsShell />);

    await screen.findByText("Owned profile");

    await user.click(screen.getByRole("button", { name: "Export my data" }));
    await waitFor(
      () =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Your export request has been recorded. A download link will appear when the bundle is ready.",
        ),
      { timeout: 6000 },
    );
    await screen.findByText("Waiting for fulfillment.", undefined, {
      timeout: 6000,
    });

    await waitFor(
      () =>
        expect(authApiMocks.createExportRequest).toHaveBeenCalledWith("profile-1"),
      { timeout: 6000 },
    );

    await user.click(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(
      () =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Consent was revoked. Future use of that pathway is now blocked.",
        ),
      { timeout: 6000 },
    );
    expect(screen.queryByRole("button", { name: "Revoke" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Request deletion" }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    await waitFor(
      () =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Deletion completed. Your session has been cleared and future educational or upload use is revoked.",
        ),
      { timeout: 6000 },
    );
    confirmSpy.mockRestore();
    expect(screen.getByText(/Your session cookie has been cleared\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export my data" })).toBeDisabled();
  });

  it("shows an account-bound error when no profile exists yet", async () => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: true,
      user: {
        email: "person@example.com",
        preferred_language: "en-US",
        profile_id: null,
        role: "user",
        user_id: "user-1",
      },
    });

    render(<DataControlsShell />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Create a profile before using data controls.",
      ),
    );
    expect(screen.getByRole("button", { name: "Export my data" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Request deletion" })).toBeDisabled();
  });
});
