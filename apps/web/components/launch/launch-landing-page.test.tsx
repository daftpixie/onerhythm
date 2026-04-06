import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LaunchLandingPage } from "./launch-landing-page";

vi.mock("../structured-data", () => ({
  StructuredData: () => null,
}));

describe("LaunchLandingPage", () => {
  it("renders the revised launch narrative and only the three flagship brief downloads", () => {
    render(<LaunchLandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "A private decade became a public mission.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No more quiet." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "One mission, explained three ways." })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Download brief" })).toHaveLength(3);
    expect(screen.queryByText("Essays & Public Writing")).not.toBeInTheDocument();
    expect(screen.queryByText("Research / Executive Briefs")).not.toBeInTheDocument();
    expect(screen.queryByText("Shared Rhythm Distance Executive Brief")).not.toBeInTheDocument();
  });
});
