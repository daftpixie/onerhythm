import { describe, expect, it } from "vitest";

import { getContentEntry, listPublishedEditorialEssays } from "./content";

describe("editorial content helpers", () => {
  it("returns the two published editorial essays in homepage order", () => {
    const entries = listPublishedEditorialEssays();

    expect(entries.map((entry) => entry.slug)).toEqual([
      "living-inside-the-numbers",
      "open-letter-to-electrophysiology-leaders",
    ]);
  });

  it("keeps share atoms available on the canonical article entry", () => {
    const entry = getContentEntry("essay", "living-inside-the-numbers");

    expect(entry?.article?.share.x_thread).toHaveLength(5);
    expect(entry?.article?.share.share_captions).toHaveLength(3);
    expect(entry?.article?.share.image_card_snippets).toHaveLength(3);
    expect(entry?.article?.share.og_image_path).toBe(
      "/brand/og/og-article-invisible-bears-1200x630.png",
    );
  });
});
