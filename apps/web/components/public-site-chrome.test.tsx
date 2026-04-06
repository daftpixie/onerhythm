import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { navigationState } from "../test/setup";
import { PublicSiteChrome } from "./public-site-chrome";

vi.mock("./public-site-header", () => ({
  PublicSiteHeader: () => <div>Public header</div>,
}));

vi.mock("./public-site-footer", () => ({
  PublicSiteFooter: () => <div>Public footer</div>,
}));

describe("PublicSiteChrome", () => {
  it("renders the standard chrome for normal routes", () => {
    navigationState.pathname = "/mission";

    render(
      <PublicSiteChrome>
        <main>Route content</main>
      </PublicSiteChrome>,
    );

    expect(screen.getByText("Public header")).toBeInTheDocument();
    expect(screen.getByText("Public footer")).toBeInTheDocument();
  });

  it("suppresses the standard chrome for the launch route", () => {
    navigationState.pathname = "/launch";

    render(
      <PublicSiteChrome>
        <main>Launch content</main>
      </PublicSiteChrome>,
    );

    expect(screen.getByText("Launch content")).toBeInTheDocument();
    expect(screen.queryByText("Public header")).not.toBeInTheDocument();
    expect(screen.queryByText("Public footer")).not.toBeInTheDocument();
  });

  it("suppresses the standard chrome on the launch host", () => {
    navigationState.pathname = "/";

    render(
      <PublicSiteChrome isLaunchHost>
        <main>Launch host content</main>
      </PublicSiteChrome>,
    );

    expect(screen.getByText("Launch host content")).toBeInTheDocument();
    expect(screen.queryByText("Public header")).not.toBeInTheDocument();
    expect(screen.queryByText("Public footer")).not.toBeInTheDocument();
  });
});
