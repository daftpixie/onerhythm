import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockRouter, navigationState } from "../test/setup";
import { AuthShell, resolvePostAuthPath } from "./auth-shell";

vi.mock("./public-site-footer", () => ({
  PublicSiteFooter: () => <div>Footer</div>,
}));

const authApiMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("../lib/auth-api", async () => {
  const actual = await vi.importActual<typeof import("../lib/auth-api")>("../lib/auth-api");
  return {
    ...actual,
    signIn: authApiMocks.signIn,
    signUp: authApiMocks.signUp,
  };
});

describe("resolvePostAuthPath", () => {
  it("routes returning signed-in users with a profile to account data by default", () => {
    expect(
      resolvePostAuthPath({
        mode: "sign-in",
        requestedNextPath: null,
        session: {
          authenticated: true,
          beta_access: "granted",
          user: {
            email: "matthew@vt-infinite.com",
            preferred_language: "en-US",
            profile_id: "profile-1",
            role: "user",
            user_id: "user-1",
          },
        },
      }),
    ).toBe("/account/data");
  });
});

describe("AuthShell", () => {
  beforeEach(() => {
    navigationState.searchParams = new URLSearchParams();
    authApiMocks.signIn.mockResolvedValue({
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
  });

  it("sends returning users to account data when sign-in has no next param", async () => {
    const user = userEvent.setup();

    render(<AuthShell mode="sign-in" />);

    await user.type(screen.getByLabelText("Email"), "matthew@vt-infinite.com");
    await user.type(screen.getByLabelText("Password"), "steadyrhythm2026!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith("/account/data"),
    );
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it("preserves an explicit next param over the default account route", async () => {
    const user = userEvent.setup();
    navigationState.searchParams = new URLSearchParams("next=%2Feducation");

    render(<AuthShell mode="sign-in" />);

    await user.type(screen.getByLabelText("Email"), "matthew@vt-infinite.com");
    await user.type(screen.getByLabelText("Password"), "steadyrhythm2026!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith("/education"),
    );
  });

  it("routes pending beta accounts to the pending access page before protected routes", () => {
    expect(
      resolvePostAuthPath({
        mode: "sign-in",
        requestedNextPath: "/education",
        session: {
          authenticated: true,
          beta_access: "pending",
          user: {
            email: "matthew@vt-infinite.com",
            preferred_language: "en-US",
            profile_id: "profile-1",
            role: "user",
            user_id: "user-1",
          },
        },
      }),
    ).toBe("/beta-access-pending");
  });

  it("ignores external next params and falls back to the default route", () => {
    expect(
      resolvePostAuthPath({
        mode: "sign-in",
        requestedNextPath: "https://evil.example/phish",
        session: {
          authenticated: true,
          beta_access: "granted",
          user: {
            email: "matthew@vt-infinite.com",
            preferred_language: "en-US",
            profile_id: "profile-1",
            role: "user",
            user_id: "user-1",
          },
        },
      }),
    ).toBe("/account/data");
  });
});
