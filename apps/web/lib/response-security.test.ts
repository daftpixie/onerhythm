import { describe, expect, it } from "vitest";

import { buildWebResponseHeaderRules, experimentalRouteSources } from "./response-security";

function headerValue(headers: Array<{ key: string; value: string }>, key: string): string | undefined {
  return headers.find((header) => header.key === key)?.value;
}

describe("buildWebResponseHeaderRules", () => {
  it("ships baseline hardening headers for all routes", () => {
    const rules = buildWebResponseHeaderRules("production");
    const baselineRule = rules.find((rule) => rule.source === "/:path*");

    expect(baselineRule).toBeDefined();
    expect(headerValue(baselineRule!.headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerValue(baselineRule!.headers, "X-Content-Type-Options")).toBe("nosniff");
    expect(headerValue(baselineRule!.headers, "X-Frame-Options")).toBe("DENY");
    expect(headerValue(baselineRule!.headers, "Strict-Transport-Security")).toContain("max-age=63072000");
  });

  it("marks authenticated and personalized routes as experimental", () => {
    const rules = buildWebResponseHeaderRules("production");

    for (const source of experimentalRouteSources) {
      const rule = rules.find((candidate) => candidate.source === source);
      expect(rule, source).toBeDefined();
      expect(headerValue(rule!.headers, "Cache-Control")).toBe("private, no-store, max-age=0");
      expect(headerValue(rule!.headers, "X-OneRhythm-Release-Stage")).toBe("experimental");
      expect(headerValue(rule!.headers, "X-Robots-Tag")).toBe("noindex, nofollow, noarchive");
    }
  });

  it("omits HSTS during local development builds", () => {
    const rules = buildWebResponseHeaderRules("development");
    const baselineRule = rules.find((rule) => rule.source === "/:path*");

    expect(headerValue(baselineRule!.headers, "Strict-Transport-Security")).toBeUndefined();
  });
});

