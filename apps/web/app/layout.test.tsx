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

    expect(markup).toContain("Every heartbeat has a story. Every story deserves to be heard.");
    expect(markup).toContain("Community Hub");
  });
});
