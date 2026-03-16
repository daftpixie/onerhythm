import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { navigationState } from "../test/setup";
import { PublicSiteHeader } from "./public-site-header";

vi.mock("./brand-logo", () => ({
  BrandLogo: () => <div>OneRhythm</div>,
}));

vi.mock("./contrast-toggle", () => ({
  ContrastToggle: () => <button type="button">Contrast</button>,
}));

const authApiMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("../lib/auth-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/auth-api")>("../lib/auth-api");
  return {
    ...actual,
    getSession: authApiMocks.getSession,
  };
});

describe("PublicSiteHeader", () => {
  beforeEach(() => {
    navigationState.pathname = "/";
  });

  it("shows the account link for an authenticated user with a profile", async () => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: true,
      beta_access: "granted",
      user: {
        email: "matthew@vt-infinite.com",
        preferred_language: "en-US",
        profile_id: "profile-1",
        role: "user",
        user_id: "user-1",
      },
    });

    render(<PublicSiteHeader />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
        "href",
        "/account/data",
      ),
    );
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
  });

  it("keeps the sign-in link for a guest session", async () => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: false,
      user: null,
      beta_access: "not_required",
    });

    render(<PublicSiteHeader />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/sign-in",
      ),
    );
  });

  it("shows beta status for a signed-in account that is still pending access", async () => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: true,
      beta_access: "pending",
      user: {
        email: "matthew@vt-infinite.com",
        preferred_language: "en-US",
        profile_id: null,
        role: "user",
        user_id: "user-1",
      },
    });

    render(<PublicSiteHeader />);

    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "Beta status" })).toHaveLength(2),
    );
  });

  it("keeps the contrast toggle visible while the mobile menu is collapsed", async () => {
    authApiMocks.getSession.mockResolvedValue({
      authenticated: false,
      user: null,
      beta_access: "not_required",
    });

    render(<PublicSiteHeader />);

    expect(screen.getByRole("button", { name: "Contrast" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByRole("region", { name: "Mobile menu" })).not.toBeInTheDocument();
  });

  it("opens and closes the mobile menu", async () => {
    const user = userEvent.setup();

    authApiMocks.getSession.mockResolvedValue({
      authenticated: false,
      user: null,
      beta_access: "not_required",
    });

    render(<PublicSiteHeader />);

    const menuButton = screen.getByRole("button", { name: "Open menu" });
    await user.click(menuButton);

    const menuRegion = screen.getByRole("region", { name: "Mobile menu" });
    expect(menuButton).toHaveAttribute("aria-expanded", "true");
    expect(
      within(menuRegion).getByRole("link", { name: "Community" }),
    ).toHaveAttribute("href", "/community");

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("region", { name: "Mobile menu" })).not.toBeInTheDocument();
  });
});
