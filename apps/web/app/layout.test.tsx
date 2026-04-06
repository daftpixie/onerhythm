import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { requestHeaderState } from "../test/setup";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("keeps the public footer in the app chrome", async () => {
    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <main>Route content</main>,
      }),
    );

    expect(markup).toContain("Every rhythm shared. Every bear seen.");
    expect(markup).toContain("Mission-driven.");
  });

  it("omits the public chrome for launch-host requests", async () => {
    requestHeaderState.set("x-onerhythm-launch-host", "1");

    const markup = renderToStaticMarkup(
      await RootLayout({
        children: <main>Launch content</main>,
      }),
    );

    expect(markup).toContain("Launch content");
    expect(markup).not.toContain("Every rhythm shared. Every bear seen.");
  });
});
