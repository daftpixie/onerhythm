import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StoryDetailPage, { generateMetadata, generateStaticParams } from "./page";

describe("StoryDetailPage", () => {
  it("renders the evidence essay with disclaimer, crisis support, and share kit", async () => {
    render(
      await StoryDetailPage({
        params: Promise.resolve({ slug: "living-inside-the-numbers" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Living Inside the Numbers" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Channel-ready share kit" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Crisis support" })).toBeInTheDocument();
    expect(
      screen.getByText(/I did not live through palpitations\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read the open letter" })).toHaveAttribute(
      "href",
      "/stories/open-letter-to-electrophysiology-leaders",
    );
  });

  it("renders the open letter without the crisis support block", async () => {
    render(
      await StoryDetailPage({
        params: Promise.resolve({ slug: "open-letter-to-electrophysiology-leaders" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "An Open Letter to Electrophysiology Leaders" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note", { name: "Medical disclaimer" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Crisis support" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reviewed source trail" })).toBeInTheDocument();
  });

  it("publishes static params and article metadata for the new stories", async () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([
        { slug: "living-inside-the-numbers" },
        { slug: "open-letter-to-electrophysiology-leaders" },
      ]),
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "living-inside-the-numbers" }),
    });

    expect(metadata.title).toBe("Living Inside the Numbers | OneRhythm");
    expect(metadata.description).toBe(
      "A long-form essay showing why arrhythmia distress is part of the disease experience and why institutions should build for it accordingly.",
    );
    expect(metadata.openGraph?.title).toBe("Living Inside the Numbers");
    expect(metadata.openGraph?.description).toBe(
      "Why repeated internal alarm changes a life, and why arrhythmia care cannot stop at the rhythm strip.",
    );
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "http://127.0.0.1:3001/brand/og/og-article-invisible-bears-1200x630.png",
          alt: "OneRhythm editorial preview for Living Inside the Numbers on a dark branded surface.",
        }),
      ]),
    );
  });
});
