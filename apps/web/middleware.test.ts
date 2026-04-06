import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { middleware } from "./middleware";

const originalLaunchMode = process.env.NEXT_PUBLIC_LAUNCH_MODE;
const originalLaunchUrl = process.env.NEXT_PUBLIC_LAUNCH_URL;
const originalLaunchHost = process.env.NEXT_PUBLIC_LAUNCH_HOST;

function setLaunchEnv(overrides?: Partial<Record<string, string>>) {
  process.env.NEXT_PUBLIC_LAUNCH_MODE = "true";
  process.env.NEXT_PUBLIC_LAUNCH_URL = "https://launch.onerhythm.org";
  process.env.NEXT_PUBLIC_LAUNCH_HOST = "launch.onerhythm.org";

  if (!overrides) {
    return;
  }

  for (const [key, value] of Object.entries(overrides)) {
    process.env[key] = value;
  }
}

describe("middleware", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_LAUNCH_MODE = originalLaunchMode;
    process.env.NEXT_PUBLIC_LAUNCH_URL = originalLaunchUrl;
    process.env.NEXT_PUBLIC_LAUNCH_HOST = originalLaunchHost;
  });

  it("redirects public main-domain routes to the launch URL when launch mode is enabled", () => {
    setLaunchEnv();

    const response = middleware(new NextRequest("https://onerhythm.org/mission"));

    expect(response.headers.get("location")).toBe("https://launch.onerhythm.org/");
  });

  it("rewrites the launch host root request to the launch route and marks the request host", () => {
    setLaunchEnv();

    const response = middleware(new NextRequest("https://launch.onerhythm.org/"));

    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://launch.onerhythm.org/launch",
    );
    expect(response.headers.get("x-onerhythm-launch-host")).toBe("1");
  });

  it("redirects non-root launch host routes back to the launch homepage", () => {
    setLaunchEnv();

    const response = middleware(new NextRequest("https://launch.onerhythm.org/mission"));

    expect(response.headers.get("location")).toBe("https://launch.onerhythm.org/");
    expect(response.headers.get("x-onerhythm-launch-host")).toBe("1");
  });

  it("allows asset requests through so launch PDFs remain downloadable", () => {
    setLaunchEnv();

    const response = middleware(
      new NextRequest("https://onerhythm.org/launch/pdfs/onerhythm-project-brief-2026.pdf"),
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves sign-in redirects for protected routes when launch mode is disabled", () => {
    setLaunchEnv({ NEXT_PUBLIC_LAUNCH_MODE: "false" });

    const response = middleware(new NextRequest("https://onerhythm.org/contribute"));

    expect(response.headers.get("location")).toBe(
      "https://onerhythm.org/sign-in?next=%2Fcontribute",
    );
  });
});
