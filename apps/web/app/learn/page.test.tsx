import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LearnPage, { metadata } from "./page";

describe("LearnPage", () => {
  it("renders the ResearchPulse beta landing page and beta access form", () => {
    render(<LearnPage />);

    expect(
      screen.getByRole("heading", { name: "ResearchPulse is in development." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Help shape the first release." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Request beta access" })).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Supportive environment information" }),
    ).toBeInTheDocument();
  });

  it("publishes beta landing metadata", () => {
    expect(metadata.title).toBe("ResearchPulse Beta | OneRhythm");
    expect(metadata.description).toBe(
      "ResearchPulse is in development. Preview condition-specific education features, supportive information, and request beta access.",
    );
    expect(metadata.openGraph?.title).toBe("ResearchPulse Beta | OneRhythm");
    expect(metadata.alternates?.canonical).toBe("http://127.0.0.1:3001/learn");
  });
});
