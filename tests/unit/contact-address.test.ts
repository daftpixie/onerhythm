// The public contact address (founder decision, 4 November 2026):
// matthew@vt-infinite.com, for the landing page's contact line and as
// SECURITY.md's email fallback. GitHub private vulnerability reporting stays
// the first channel for security reports.
//
// WHY a test: an address that bounces turns a security report or a partner's
// first email into silence. The placeholder (hello@onerhythm.org) never
// received mail, so it must not survive in anything a reader sees. Every other
// test reads the address through CONTACT_EMAIL; this is the one place it is
// pinned as a literal.
import { readFileSync } from "fs";
import { join, relative } from "path";
import { CONTACT_EMAIL } from "../../src/lib/site";
import { publicFiles, ROOT } from "../shared/public-files";

const DECIDED = "matthew@vt-infinite.com";
const PLACEHOLDER = /hello@onerhythm\.org/i;

const files = publicFiles([
  "docs/DEPLOY_RAILWAY.md",
  "docs/PRODUCTION_READINESS.md",
  "docs/adr/0023-railway-landing-only-web-host.md",
]);

describe("the public contact address", () => {
  it("is the decided address, not the placeholder", () => {
    expect(CONTACT_EMAIL).toBe(DECIDED);
  });

  it("is no longer marked TODO(founder) in src/lib/site.ts", () => {
    expect(readFileSync(join(ROOT, "src/lib/site.ts"), "utf8")).not.toMatch(/TODO\(founder\)/);
  });

  it("is SECURITY.md's email fallback, after GitHub private vulnerability reporting", () => {
    const security = readFileSync(join(ROOT, "SECURITY.md"), "utf8");
    const github = security.indexOf("private vulnerability reporting");
    const email = security.indexOf(`**${DECIDED}**`);
    expect(github).toBeGreaterThanOrEqual(0);
    expect(email).toBeGreaterThan(github);
    expect(security).not.toMatch(/TODO\(founder\)/);
  });

  it("the placeholder appears in no public file", () => {
    expect(files.length).toBeGreaterThan(30);
    const offenders = files
      .filter((f) => PLACEHOLDER.test(readFileSync(f, "utf8")))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});
