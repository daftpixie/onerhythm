import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingShell } from "./onboarding-shell";

vi.mock("../../components/session-actions", () => ({
  SessionActions: () => <div>Session actions</div>,
}));

const authApiMocks = vi.hoisted(() => ({
  createConsent: vi.fn(),
  createProfile: vi.fn(),
}));

vi.mock("../../lib/auth-api", () => authApiMocks);

describe("OnboardingShell", () => {
  beforeEach(() => {
    authApiMocks.createProfile.mockResolvedValue({
      created_at: "2026-03-14T12:00:00Z",
      diagnosis_selection: {
        diagnosis_code: "afib",
        diagnosis_source: "self_reported",
      },
      emotional_context: ["anxious during episodes"],
      physical_symptoms: ["palpitations"],
      preferred_language: "en-US",
      profile_id: "profile-1",
      treatment_history: {
        ablation_count: 0,
        current_medications: [],
        has_implantable_device: false,
        prior_procedures: [],
      },
      updated_at: "2026-03-14T12:00:00Z",
    });
    authApiMocks.createConsent.mockResolvedValue({
      consent_record_id: "consent-1",
      consent_type: "educational_profile",
      effective_at: "2026-03-14T12:00:00Z",
      locale: "en-US",
      policy_version: "launch-v1",
      profile_id: "profile-1",
      source: "web",
      status: "granted",
    });
  });

  it("shows the medical disclaimer and blocks progress with clear validation", async () => {
    const user = userEvent.setup();

    render(<OnboardingShell />);

    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByText("Select the condition that best matches your self-reported experience."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Add at least one symptom or lived-effect to ground the educational profile."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Add at least one emotional experience so the profile reflects the human side of care.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Self-reported condition")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Symptom history")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Emotional experience")).toHaveAttribute("aria-invalid", "true");
  });

  it("saves consent choices and points people back to data controls", async () => {
    const user = userEvent.setup();

    render(<OnboardingShell />);

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.selectOptions(screen.getByLabelText("Self-reported condition"), "afib");
    await user.type(screen.getByLabelText("Symptom history"), "Palpitations");
    await user.type(screen.getByLabelText("Emotional experience"), "Anxious during episodes");

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(
      screen.getByRole("radio", { name: /Yes, I want that option available\./i }),
    );
    await user.click(
      screen.getByRole("radio", { name: /Yes, for educational guidance\./i }),
    );
    await user.click(
      within(
        screen
          .getByText(
            "May we include your data in aggregated, de-identified research sharing later?",
          )
          .closest("fieldset") as HTMLFieldSetElement,
      ).getByRole("radio", { name: /Not now\./i }),
    );
    await user.click(
      screen.getByRole("checkbox", {
        name: /I understand that OneRhythm is educational, not diagnostic\./i,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Save and continue" }));

    await screen.findByText("Your profile and consent choices are now part of your account.", undefined, {
      timeout: 6000,
    });
    expect(
      screen.getByText(
        "Your profile and consent choices were saved. You can review them in Data controls.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open data controls" })).toHaveAttribute(
      "href",
      "/account/data",
    );
    expect(authApiMocks.createConsent).toHaveBeenCalledTimes(3);
    await waitFor(() => expect(authApiMocks.createProfile).toHaveBeenCalledTimes(1), {
      timeout: 6000,
    });
  });
});
