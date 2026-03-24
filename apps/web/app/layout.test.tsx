import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("keeps the public footer in the app chrome", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <main>Route content</main>
      </RootLayout>,
    );

    expect(markup).toContain("Every rhythm shared. Every bear seen.");
    expect(markup).toContain("Join the mission");
  });
});
