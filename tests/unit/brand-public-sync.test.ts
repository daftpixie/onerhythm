// The web export serves everything in public/ from the site root, which is
// where the favicon links, the manifest, and the absolute og:image URLs point.
// But assets/brand/svg/1r-mark.svg remains the single source of truth for the
// mark (assets/brand/README.md), so public/ holds COPIES.
//
// Copies rot. This asserts every copy is byte-identical to its source, so a
// regenerated icon that never made it to public/ fails the build instead of
// quietly serving last month's mark in every social preview.
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

// The manifest the sync script reads — one definition, so the script and this
// check cannot disagree about what ships.
const PUBLIC_ASSETS = JSON.parse(
  readFileSync(join(ROOT, "scripts", "brand-public-assets.json"), "utf8"),
) as { from: string; to: string }[];

describe("brand assets mirrored into public/", () => {
  it("declares a non-trivial asset list", () => {
    expect(PUBLIC_ASSETS.length).toBeGreaterThanOrEqual(10);
  });

  it.each(PUBLIC_ASSETS)("$to matches its source $from", ({ from, to }) => {
    const source = join(ROOT, from);
    const copy = join(ROOT, to);
    expect(existsSync(source)).toBe(true);
    expect(existsSync(copy)).toBe(true);
    expect(readFileSync(copy).equals(readFileSync(source))).toBe(true);
  });

  it("serves favicon.ico from the site root, where browsers look for it", () => {
    expect(PUBLIC_ASSETS.some((a) => a.to === "public/favicon.ico")).toBe(true);
  });

  it("ships every image the meta tags and manifest reference", () => {
    const shipped = new Set(PUBLIC_ASSETS.map((a) => a.to));
    for (const required of [
      "public/site.webmanifest",
      "public/icons/favicon-16x16.png",
      "public/icons/favicon-32x32.png",
      "public/icons/apple-touch-icon.png",
      "public/icons/android-chrome-192x192.png",
      "public/icons/android-chrome-512x512.png",
      "public/icons/maskable-512.png",
      "public/social/og-image-1200x630.png",
      "public/social/twitter-card-1200x600.png",
    ]) {
      expect(shipped).toContain(required);
    }
  });

  it("copies only from assets/brand — no other source of brand truth", () => {
    for (const { from } of PUBLIC_ASSETS) {
      expect(from.startsWith("assets/brand/")).toBe(true);
    }
  });
});
