// Public copy must not describe VT Infinite, Inc. as a public benefit
// corporation, and must not call member support "donations".
//
// WHY: the PBC conversion is drafted and NOT filed (ADR 0007, as corrected on
// 2026-09-26). Copy that states otherwise is a legal problem, not a style one.
// Contributions are not tax-deductible, so "donation" implies a status we do
// not have. Mentioning the *proposed* conversion honestly is fine — the landing
// page does ("A conversion to a Delaware public benefit corporation is proposed
// but has not been filed") — so this test blocks the assertion, not the words.
//
// Scope: everything a member, visitor, email recipient or security researcher
// reads. Historical decision records (docs/adr, .claude/plans) are excluded on
// purpose: they record what was believed at the time and carry status notes.
import { readFileSync } from "fs";
import { relative } from "path";
import { flat, publicFiles, ROOT } from "../shared/public-files";

const files = publicFiles();

// Asserting the status: "a (Delaware) public benefit corporation", except when
// it is the object of "conversion to" (the honest, proposed-not-filed wording).
const ASSERTS_PBC = /(?<!conversion to )\ba (delaware )?public benefit corporation\b/i;
const PBC_ABBREVIATION = /\bPBC\b/;
const DONATION_FUNDED = /\bdonation-funded\b/i;
// "A VT Infinite company." reads as a subsidiary or a separate company.
// OneRhythm is an initiative of VT Infinite, Inc. (CLAUDE.md, entity status);
// the footer says "A VT Infinite, Inc. initiative." (founder decision, 4 Nov 2026).
const VT_COMPANY = /\bA VT Infinite company\b/i;

describe("entity wording in public copy", () => {
  it("the patterns catch real violations and allow the honest wording", () => {
    // Proven against the exact sentences this test was written to remove, so a
    // later edit cannot quietly turn it into a test that passes on anything.
    expect(ASSERTS_PBC.test("run by VT Infinite, Inc., a Delaware public benefit corporation.")).toBe(true);
    expect(ASSERTS_PBC.test("— OneRhythm (VT Infinite, Inc., a Delaware Public Benefit Corporation)")).toBe(true);
    expect(DONATION_FUNDED.test("This is a pre-launch, donation-funded public benefit")).toBe(true);
    expect(PBC_ABBREVIATION.test("VT Infinite, Inc. (PBC, d/b/a OneRhythm)")).toBe(true);
    expect(VT_COMPANY.test("A VT Infinite company.")).toBe(true);
    expect(VT_COMPANY.test("A VT Infinite, Inc. initiative.")).toBe(false);
    expect(
      ASSERTS_PBC.test(
        "A conversion to a Delaware public benefit corporation is proposed but has not been filed.",
      ),
    ).toBe(false);
  });

  it("scans a meaningful set of files", () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files.map((f) => relative(ROOT, f))).toEqual(
      expect.arrayContaining([
        "app/privacy-notice.tsx",
        "app/index.tsx",
        "SECURITY.md",
        "supabase/functions/send-confirmation-email/index.ts",
      ]),
    );
  });

  it.each([
    ["asserts PBC status", ASSERTS_PBC],
    ["uses the PBC abbreviation", PBC_ABBREVIATION],
    ['says "donation-funded"', DONATION_FUNDED],
    ['says "A VT Infinite company"', VT_COMPANY],
  ])("no public file %s", (_label, pattern) => {
    const offenders = files
      .filter((f) => pattern.test(flat(readFileSync(f, "utf8"))))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});
