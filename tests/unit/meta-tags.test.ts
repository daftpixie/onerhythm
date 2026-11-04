// The web HTML shell: favicons, manifest, and social meta.
//
// WHY THIS FILE AND NOT app/+html.tsx: this project uses Expo's default web
// output ("single"). On that path @expo/cli builds index.html from
// createTemplateHtmlFromExpoConfigAsync, which reads public/index.html if it
// exists and otherwise the stock template (start/server/webTemplate.js).
// app/+html.tsx is consumed only by exportStaticAsync, i.e. web.output
// "static" | "server"; expo-router merely excludes +html from the route tree.
// Tags placed there today would ship in nothing at all. Verified against the
// installed toolchain before this was written. See ADR 0011 decision (d).
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");
const html = readFileSync(join(ROOT, "public", "index.html"), "utf8");

const SITE = "https://onerhythm.org";

function metaContent(html: string, attr: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]*\\b${attr}=["']${name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    )}["'][^>]*>`,
    "i",
  );
  const tag = html.match(re)?.[0];
  if (!tag) return null;
  return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? null;
}

describe("public/index.html — favicons and manifest", () => {
  it("links the favicon set, apple touch icon, and web manifest", () => {
    expect(html).toMatch(/<link[^>]+rel=["']icon["'][^>]+href=["']\/favicon\.ico["']/i);
    expect(html).toMatch(/href=["']\/icons\/favicon-32x32\.png["']/i);
    expect(html).toMatch(/href=["']\/icons\/favicon-16x16\.png["']/i);
    expect(html).toMatch(
      /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']\/icons\/apple-touch-icon\.png["']/i,
    );
    expect(html).toMatch(
      /<link[^>]+rel=["']manifest["'][^>]+href=["']\/site\.webmanifest["']/i,
    );
  });

  it("declares the theme colour as Paper", () => {
    expect(metaContent(html, "name", "theme-color")).toBe("#FFFFFF");
  });
});

describe("public/index.html — Open Graph and Twitter", () => {
  const required: [string, string][] = [
    ["property", "og:type"],
    ["property", "og:site_name"],
    ["property", "og:title"],
    ["property", "og:description"],
    ["property", "og:url"],
    ["property", "og:image"],
    ["property", "og:image:width"],
    ["property", "og:image:height"],
    ["property", "og:image:alt"],
    ["name", "twitter:card"],
    ["name", "twitter:title"],
    ["name", "twitter:description"],
    ["name", "twitter:image"],
  ];

  it.each(required)("carries %s=%s", (attr, name) => {
    const content = metaContent(html, attr, name);
    expect(content).not.toBeNull();
    expect(content).not.toBe("");
  });

  it("uses ABSOLUTE urls for every image and url tag", () => {
    // Relative og:image is ignored by most scrapers — the whole point of
    // wiring this by hand rather than letting the bundler emit a path.
    for (const name of ["og:url", "og:image"]) {
      expect(metaContent(html, "property", name)).toMatch(
        new RegExp(`^${SITE}/`),
      );
    }
    expect(metaContent(html, "name", "twitter:image")).toMatch(
      new RegExp(`^${SITE}/`),
    );
  });

  it("points at social images that exist in the export root", () => {
    expect(metaContent(html, "property", "og:image")).toBe(
      `${SITE}/social/og-image-1200x630.png`,
    );
    expect(metaContent(html, "name", "twitter:image")).toBe(
      `${SITE}/social/twitter-card-1200x600.png`,
    );
  });

  it("gives the OG image real alt text", () => {
    expect(metaContent(html, "property", "og:image:alt")).toMatch(/1R mark/i);
  });

  it("describes the project without health claims or hype", () => {
    const description = metaContent(html, "property", "og:description") ?? "";
    expect(description.length).toBeGreaterThan(20);
    expect(description).not.toMatch(
      /cure|treat|diagnos|breakthrough|revolution/i,
    );
  });
});

describe("public/index.html — no third-party surface", () => {
  it("loads no external script, pixel, font, or frame", () => {
    // Non-negotiable #5: no ad/tracking pixels on any health or authenticated
    // page. The landing is the page most likely to attract "just add the
    // pixel" pressure, so the absence is asserted rather than assumed.
    const banned = [
      /googletagmanager|google-analytics|gtag\(/i,
      /connect\.facebook\.net|facebook\.com\/tr/i,
      /doubleclick|adservice|adsystem/i,
      /hotjar|fullstory|mouseflow|clarity\.ms/i,
      /fonts\.googleapis\.com|fonts\.gstatic\.com/i,
      /<iframe/i,
    ];
    for (const pattern of banned) {
      expect(html).not.toMatch(pattern);
    }
  });

  it("has no script tag pointing at another origin", () => {
    const srcs = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(
      (m) => m[1],
    );
    for (const src of srcs) {
      expect(src).not.toMatch(/^https?:\/\//);
    }
  });
});

describe("site.webmanifest", () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "public", "site.webmanifest"), "utf8"),
  );

  it("names the app and points at icons that ship", () => {
    expect(manifest.name).toMatch(/OneRhythm/);
    const srcs = (manifest.icons ?? []).map(
      (i: { src: string }) => i.src,
    ) as string[];
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) {
      expect(src.startsWith("/")).toBe(true);
    }
  });
});
