import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigationState } from "../../test/setup";
import { RevealShell } from "./reveal-shell";

const authApiMocks = vi.hoisted(() => ({
  getUploadSession: vi.fn(),
}));

vi.mock("../../lib/auth-api", () => authApiMocks);

describe("RevealShell", () => {
  beforeEach(() => {
    navigationState.searchParams = new URLSearchParams("session=session-123");
  });

  it("renders the completed contribution tile and documented metric", async () => {
    authApiMocks.getUploadSession.mockResolvedValue({
      upload_session_id: "session-123",
      processing_status: "completed",
      upload_format: "pdf",
      consent_record_ids: ["consent-1"],
      phi_redaction_applied: true,
      raw_upload_retained: false,
      started_at: "2026-03-15T12:00:00Z",
      completed_at: "2026-03-15T12:00:03Z",
      resulting_tile_id: "tile-123",
      rhythm_distance_cm: 25,
      retryable: false,
      status_detail: "Processing completed successfully.",
      user_message: "Your contribution finished processing and the original file has been destroyed.",
      result_tile: {
        tile_id: "tile-123",
        condition_category: "afib",
        contributed_at: "2026-03-15T12:00:03Z",
        is_public: true,
        display_date: "2026-03-15",
        tile_version: 1,
        render_version: "artistic-abstract-v1",
        visual_style: {
          color_family: "signal",
          opacity: 0.82,
          texture_kind: "grain",
          glow_level: "bright",
          waveform_signature: {
            source: "redacted_waveform_profile_v1",
            bands: [
              {
                emphasis: 0.84,
                points: [
                  { x: 0, y: 0.42 },
                  { x: 0.5, y: 0.22 },
                  { x: 1, y: 0.61 },
                ],
              },
            ],
          },
          attribution: {
            contributor_name: "Matthew",
            contributor_location: "Vermont",
          },
        },
        rhythm_distance_cm: 25,
      },
      contribution_distance: {
        distance_cm: 25,
        policy_id: "standard_12_lead_long_strip",
        label: "Standard 10-second rhythm strip",
        rationale: "Counted as a canonical long rhythm strip.",
        provenance:
          "Inferred a standard 12-lead layout with a long rhythm strip. Applied the canonical 10 seconds at 25 mm/sec -> 25 cm policy.",
        inferred_layout: "standard_12_lead_with_long_strip",
        paper_speed_mm_per_sec: 25,
        fallback_used: false,
      },
    });

    render(<RevealShell />);

    await screen.findByText("Your contribution segment is ready to join the shared line.");
    expect(screen.getByTestId("art-reveal-tile")).toBeInTheDocument();
    expect(screen.getByText(/25\.00/)).toBeInTheDocument();
    expect(screen.getByText("Standard 10-second rhythm strip")).toBeInTheDocument();
    expect(screen.getByText(/25 mm\/sec -> 25 cm policy\./)).toBeInTheDocument();
    expect(screen.getByText("Matthew · Vermont")).toBeInTheDocument();
    expect(screen.queryByText("OneRhythm tile")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Abstract. Non-diagnostic. Shared with consent."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join the Mosaic" })).toHaveAttribute(
      "href",
      "/contribute/joined",
    );
  });

  it("renders a branded fallback tile when the upload result cannot be loaded", async () => {
    authApiMocks.getUploadSession.mockRejectedValue(new Error("Session unavailable"));

    render(<RevealShell />);

    await waitFor(() =>
      expect(
        screen.getByText("Session unavailable"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByTestId("art-reveal-tile")).toBeInTheDocument();
    expect(screen.getByText("1 Rhythm Unit fallback")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try another upload" })).toHaveAttribute(
      "href",
      "/contribute/upload",
    );
  });
});
