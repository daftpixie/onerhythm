import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaitlistForm } from "./waitlist-form";

describe("WaitlistForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows a confirmation state after a fresh signup", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "joined",
            message: "Thanks. You're on the beta waitlist.",
            referral_code: "abc123def456",
            referral_count: 0,
            referral_url: "https://onerhythm.org/join?ref=abc123def456",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    render(<WaitlistForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Join the Mission" }));

    await waitFor(() =>
      expect(screen.getByText("You're in. Welcome to the mission.")).toBeInTheDocument(),
    );
    expect(screen.getByText("https://onerhythm.org/join?ref=abc123def456")).toBeInTheDocument();
  });

  it("shows the duplicate confirmation state when the email already exists", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "already_joined",
            message: "This email is already on the beta list.",
            referral_code: "abc123def456",
            referral_count: 2,
            referral_url: "https://onerhythm.org/join?ref=abc123def456",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    render(<WaitlistForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Join the Mission" }));

    await waitFor(() =>
      expect(screen.getByText(/This email is already on the beta list\./)).toBeInTheDocument(),
    );
    expect(screen.getByText("Scout")).toBeInTheDocument();
  });

  it("shows an error state when the submission fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "The waitlist could not be updated right now.",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    render(<WaitlistForm />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.click(screen.getByRole("button", { name: "Join the Mission" }));

    await waitFor(() =>
      expect(
        screen.getByText("The waitlist could not be updated right now."),
      ).toBeInTheDocument(),
    );
  });

  it("syncs the confirmation state across multiple form instances", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "joined",
            message: "Thanks. You're on the beta waitlist.",
            referral_code: "abc123def456",
            referral_count: 0,
            referral_url: "https://onerhythm.org/join?ref=abc123def456",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        ),
      ),
    );

    render(
      <>
        <WaitlistForm idPrefix="hero" />
        <WaitlistForm idPrefix="footer" />
      </>,
    );

    await user.type(screen.getAllByLabelText("Email")[0]!, "person@example.com");
    await user.click(screen.getAllByRole("button", { name: "Join the Mission" })[0]!);

    await waitFor(() =>
      expect(screen.getAllByText("You're in. Welcome to the mission.")).toHaveLength(2),
    );
  });
});
