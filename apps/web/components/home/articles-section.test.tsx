import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArticlesSection } from "./articles-section";

describe("ArticlesSection", () => {
  it("renders the two canonical editorial stories with story-route CTAs", () => {
    render(<ArticlesSection />);

    expect(
      screen.getByRole("heading", { name: "Living Inside the Numbers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "An Open Letter to Electrophysiology Leaders" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Read the journey" })).toHaveAttribute(
      "href",
      "/stories/living-inside-the-numbers",
    );
    expect(screen.getByRole("link", { name: "Read the open letter" })).toHaveAttribute(
      "href",
      "/stories/open-letter-to-electrophysiology-leaders",
    );

    expect(
      screen.getByText(
        "This piece starts inside the private math of arrhythmia, then widens into the research to show that the invisible burden around it is real, common, and worthy of support.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Grounded in gratitude for the field and in lived experience, this letter asks for routine screening, real referral pathways, and a more human standard of care.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("/articles/Living Inside the Numbers.pdf")).not.toBeInTheDocument();
  });
});
