import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WaitlistForm } from "./waitlist-form";

describe("WaitlistForm", () => {
  it("shows a success state after a fresh signup", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "joined",
            message: "Thanks. You're on the beta waitlist.",
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
    await user.click(screen.getByRole("button", { name: "Join the beta waitlist" }));

    await waitFor(() =>
      expect(screen.getByText("Thanks. You're on the beta waitlist.")).toBeInTheDocument(),
    );
  });

  it("shows the duplicate state when the email already exists", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "already_joined",
            message: "This email is already on the beta list.",
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
    await user.click(screen.getByRole("button", { name: "Join the beta waitlist" }));

    await waitFor(() =>
      expect(screen.getByText("This email is already on the beta list.")).toBeInTheDocument(),
    );
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
    await user.click(screen.getByRole("button", { name: "Join the beta waitlist" }));

    await waitFor(() =>
      expect(
        screen.getByText("The waitlist could not be updated right now."),
      ).toBeInTheDocument(),
    );
  });
});
