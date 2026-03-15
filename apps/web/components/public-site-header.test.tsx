import { render, screen, waitFor } from "@testing-library/react";
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
});
