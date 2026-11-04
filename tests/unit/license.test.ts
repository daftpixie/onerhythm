// The project is licensed under Apache-2.0 (ADR 0024, founder decision of
// 4 November 2026). Nothing was ever published under MIT: the repository was
// private until the release commit.
//
// WHY a test: a license is a legal statement to every reader and partner. A
// stray "MIT-licensed" line in the README or on the landing page would tell a
// partner's lawyer something untrue. GitHub only reports "Apache License 2.0"
// when LICENSE holds the plain license text, so the name-and-mark notice lives
// in NOTICE, not in LICENSE.
import { existsSync, readFileSync } from "fs";
import { join, relative } from "path";
import { flat, publicFiles, ROOT } from "../shared/public-files";

const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

// The entity-wording scope, plus the files that state the license to a
// contributor or a partner.
const files = publicFiles(["CLAUDE.md", "NOTICE", "docs/vision/OneRhythm_Vision.md"]);

const SAYS_MIT = /\bMIT[- ]licen[cs](e|ed)\b|\bunder the MIT\b|\bMIT, ©/i;
const MIT_GRANT = /Permission is hereby granted, free of charge/;

describe("license: Apache-2.0", () => {
  it("the MIT pattern catches the old wording and allows the new", () => {
    expect(SAYS_MIT.test("open source, under the MIT License.")).toBe(true);
    expect(SAYS_MIT.test("The code is MIT-licensed today.")).toBe(true);
    expect(SAYS_MIT.test("MIT, © 2026 VT Infinite, Inc.")).toBe(true);
    expect(SAYS_MIT.test("planned member support, MIT-licensed.")).toBe(true);
    expect(SAYS_MIT.test("The code is under the Apache License 2.0.")).toBe(false);
    expect(SAYS_MIT.test("Apache-2.0 §5 covers contributions.")).toBe(false);
  });

  it("LICENSE is the Apache License 2.0 text, with no MIT text in it", () => {
    const text = read("LICENSE");
    expect(text).toMatch(/^\s*Apache License\s*\n\s*Version 2\.0, January 2004/);
    expect(text).toContain("TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION");
    expect(text).toContain("END OF TERMS AND CONDITIONS");
    expect(text).not.toMatch(/MIT License/);
    expect(text).not.toMatch(MIT_GRANT);
  });

  it('package.json says "Apache-2.0"', () => {
    expect(JSON.parse(read("package.json")).license).toBe("Apache-2.0");
  });

  it("NOTICE exists, names the project and VT Infinite, Inc., and keeps the name-and-mark notice", () => {
    expect(existsSync(join(ROOT, "NOTICE"))).toBe(true);
    const notice = read("NOTICE");
    expect(notice).toMatch(/^OneRhythm\b/);
    expect(notice).toContain("Copyright 2026 VT Infinite, Inc.");
    expect(notice).toMatch(/1R mark/);
    expect(notice).toMatch(/trademark/i);
  });

  it("scans a meaningful set of files, including the ones that state the license", () => {
    const rel = files.map((f) => relative(ROOT, f));
    expect(rel.length).toBeGreaterThan(30);
    expect(rel).toEqual(
      expect.arrayContaining(["README.md", "CONTRIBUTING.md", "CLAUDE.md", "app/index.tsx"]),
    );
  });

  it('no public file says "MIT License" or "MIT-licensed"', () => {
    const offenders = files
      .filter((f) => SAYS_MIT.test(flat(readFileSync(f, "utf8"))))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});
