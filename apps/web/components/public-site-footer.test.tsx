import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicSiteFooter } from "./public-site-footer";

vi.mock("./brand-logo", () => ({
  BrandLogo: () => <div>OneRhythm</div>,
}));

describe("PublicSiteFooter", () => {
  it("removes unreleased community links and routes research links to the learn landing page", () => {
    render(<PublicSiteFooter />);

    expect(screen.queryByRole("link", { name: "Community Hub" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Community Stories" })).not.toBeInTheDocument();

    const communityGroup = screen.getByText("Community").closest("div");
    expect(communityGroup).not.toBeNull();
    if (!communityGroup) {
      return;
    }

    expect(within(communityGroup).getByRole("link", { name: "Mission" })).toHaveAttribute(
      "href",
      "/mission",
    );

    const researchGroup = screen.getByText("Research").closest("div");
    expect(researchGroup).not.toBeNull();
    if (!researchGroup) {
      return;
    }

    for (const label of ["ResearchPulse", "ResearchPulse feed", "Your ResearchPulse"]) {
      expect(within(researchGroup).getByRole("link", { name: label })).toHaveAttribute(
        "href",
        "/learn",
      );
    }
  });
});
