// The founder's two papers, linked from "Who built it" (founder request,
// 7 Nov 2026). Rendered in a real DOM, in landing mode, because that is the
// page the public build serves (ADR 0023).
//
// What is pinned, and why:
//  - the two Zenodo records the founder gave, exactly;
//  - each is a real link, with an accessible name that starts with its
//    visible text (SC 2.5.3) and names Zenodo, where it goes;
//  - the case report's link says whose it is, so it still makes sense in a
//    screen reader's list of links, away from the paragraph above it;
//  - both sit inside "Who built it", before "Why it's called OneRhythm";
//  - the words around them say the papers are not peer reviewed and not
//    medical advice, put 988 in the same sentence run as the mention of
//    suicide, and point to the help button, as the crisis paragraph above
//    does;
//  - none of it names the founder's diagnosis, device or procedure
//    (ADR 0016 §3). The case report's own title does, so the page links it by
//    a plain description instead.

import React from "react";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Redirect: () => null,
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/lib/supabase", () => ({ supabase: {} }));

const mockUseAuth = jest.fn();
jest.mock("../../src/lib/auth", () => ({ useAuth: () => mockUseAuth() }));

import { mount } from "./mount";
import HomeScreen from "../../app/index";
import { FOUNDER_PAPERS } from "../../src/lib/site";

const savedMode = process.env.EXPO_PUBLIC_SITE_MODE;
beforeEach(() => {
  process.env.EXPO_PUBLIC_SITE_MODE = "landing";
  mockUseAuth.mockReturnValue({ session: null, loading: false });
});
afterAll(() => {
  if (savedMode === undefined) delete process.env.EXPO_PUBLIC_SITE_MODE;
  else process.env.EXPO_PUBLIC_SITE_MODE = savedMode;
});

/** Collapse whitespace and normalise typographic quotes. */
const norm = (s: string | null | undefined) =>
  (s ?? "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The landing page, and the text of "Who built it" up to the next section. */
function whoBuiltIt() {
  const view = mount(<HomeScreen />);
  const text = norm(view.container.textContent);
  const start = text.indexOf("Who built it");
  const end = text.indexOf("Why it's called OneRhythm");
  return { ...view, text, start, end, section: text.slice(start, end) };
}

const PAPERS_P =
  "OneRhythm's founder, Matthew J Adams, has written about his own life with arrhythmia in two papers. They are long and personal. These are working papers, not peer-reviewed articles, and they are not medical advice. They talk about hard things, including suicide. If you're struggling, in the US you can call or text 988, any time. The help button at the top of every page has crisis resources.";

describe("the founder's papers", () => {
  it("are the two Zenodo records the founder gave, in order", () => {
    expect(FOUNDER_PAPERS.map((p) => p.url)).toEqual([
      "https://zenodo.org/records/23481586",
      "https://zenodo.org/records/23512374",
    ]);
  });

  it.each([0, 1])("paper %i is a real link whose name says where it goes", (i) => {
    const paper = FOUNDER_PAPERS[i];
    const { getByRole } = whoBuiltIt();
    const link = getByRole("link", { name: new RegExp(`^${escapeRe(paper.text)}`) });
    expect(link).toHaveAttribute("href", paper.url);
    // SC 2.5.3: the accessible name starts with the visible text.
    const name = link.getAttribute("aria-label") ?? "";
    expect(name.startsWith(norm(link.textContent))).toBe(true);
    expect(name).toMatch(/Zenodo/);
  });

  it("the case report's link says whose it is, without the paragraph above", () => {
    // A screen reader's list of links shows each link alone, so "he" would
    // leave the listener guessing.
    const caseReport = FOUNDER_PAPERS[1];
    expect(caseReport.text).toContain("Matthew J Adams");
    expect(caseReport.text).not.toMatch(/\bhe\b/i);
  });

  it('both sit inside "Who built it", before "Why it\'s called OneRhythm"', () => {
    const { text, start, end } = whoBuiltIt();
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    for (const paper of FOUNDER_PAPERS) {
      const at = text.indexOf(norm(paper.text));
      expect(at).toBeGreaterThan(start);
      expect(at).toBeLessThan(end);
    }
  });

  it("are introduced plainly, with 988 beside the mention of suicide", () => {
    expect(whoBuiltIt().section).toContain(PAPERS_P);
  });

  it("leave the founder's own words above them unchanged", () => {
    const { section } = whoBuiltIt();
    expect(section).toContain("I live with an arrhythmia. I built OneRhythm on my own");
    expect(section.indexOf("They are the reason this exists.")).toBeLessThan(section.indexOf(PAPERS_P));
  });

  it("do not name the founder's diagnosis, device or procedure (ADR 0016 §3)", () => {
    expect(whoBuiltIt().section).not.toMatch(
      /ARVC|cardiomyopathy|defibrillator|\bICD\b|ablation|pulsed field/i,
    );
  });
});
