// The landing copy of 4 November 2026: "Who built it", "Why it's called
// OneRhythm", the closing hope lines, 988 beside any mention of suicide, and a
// link to where the numbers come from. Rendered in a real DOM, in landing mode,
// because that is the page the public build serves (ADR 0023).
//
// The founder's wording is pinned exactly. Apostrophes and quotation marks are
// normalised first, so the page can use typographic ones (’ “ ”) like the rest
// of the copy.

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
import ContactScreen from "../../app/contact";
import PrivacyNoticeScreen from "../../app/privacy-notice";
import OtherCountriesScreen from "../../app/help/other-countries";
import { VISION_URL } from "../../src/lib/site";

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

function page() {
  const view = mount(<HomeScreen />);
  const text = norm(view.container.textContent);
  const h2s = Array.from(view.container.querySelectorAll("h2")).map((h) => norm(h.textContent));
  return { ...view, text, h2s };
}

const WHO_P1 =
  "I live with an arrhythmia. I built OneRhythm on my own, with the help of Claude, an AI assistant, because I couldn't find it when I needed it.";
const WHO_P2 =
  "But I was never really building it alone. Over the past year and a half, people from around the world, from all walks of life, have written to me. They live with arrhythmia, love someone who does, or work in heart care. They told me what helps, what doesn't, and what it feels like when nobody around you understands. When this page says \"we\", it means them. They are the reason this exists.";
const NAME_P =
  "Our diagnoses are different. Our symptoms are different from one person to the next. But heart disease touches all of us — patients, caregivers and professionals alike. Nobody should fight an invisible bear alone.";
const HOPE_1 = "Hope is what built OneRhythm.";
const HOPE_2 = "Hope is what will keep OneRhythm.";

describe("Who built it", () => {
  it('replaces "Built by a patient" with a level-2 "Who built it"', () => {
    const { h2s, text } = page();
    expect(h2s).toContain("Who built it");
    expect(h2s).not.toContain("Built by a patient");
    expect(text).not.toMatch(/Built by a patient/i);
  });

  it("renders both paragraphs exactly, including \"with the help of Claude\"", () => {
    const { text } = page();
    expect(text).toContain(WHO_P1);
    expect(text).toContain(WHO_P2);
    expect(text).toContain("with the help of Claude");
  });

  it("keeps the old first-person line out", () => {
    const { text } = page();
    expect(text).not.toMatch(/I'm building the thing I couldn't find/);
  });
});

describe("Why it's called OneRhythm", () => {
  it('comes right after "Who built it", as a level-2 section', () => {
    const { h2s } = page();
    const who = h2s.indexOf("Who built it");
    expect(who).toBeGreaterThanOrEqual(0);
    expect(h2s[who + 1]).toBe("Why it's called OneRhythm");
  });

  it("renders its paragraph exactly", () => {
    expect(page().text).toContain(NAME_P);
  });
});

describe("the closing hope lines", () => {
  it("render in order, after For partners and builders and before the disclaimer", () => {
    const { text, container } = page();
    const partners = text.indexOf("For partners and builders");
    const one = text.indexOf(HOPE_1);
    const two = text.indexOf(HOPE_2);
    const band = container.querySelector('[data-testid="disclaimer-band"]');
    expect(band).not.toBeNull();
    const disclaimer = text.indexOf(norm(band!.textContent));
    expect(partners).toBeGreaterThanOrEqual(0);
    expect(one).toBeGreaterThan(partners);
    expect(two).toBeGreaterThan(one);
    expect(disclaimer).toBeGreaterThan(two);
  });

  it("are two separate lines, and not headings", () => {
    const { container } = page();
    const blocks = Array.from(container.querySelectorAll("*")).filter(
      (el) => norm(el.textContent) === HOPE_1 || norm(el.textContent) === HOPE_2,
    );
    const lines = new Set(blocks.map((el) => norm(el.textContent)));
    expect(lines).toEqual(new Set([HOPE_1, HOPE_2]));
    for (const el of blocks) {
      expect(el.closest("h1,h2,h3,h4,h5,h6,[role=heading]")).toBeNull();
    }
  });
});

describe("988 sits beside any mention of suicide or self-harm", () => {
  const MENTION = /suicid|self-harm/i;

  /** The innermost elements whose own text mentions suicide or self-harm. */
  function mentionBlocks(container: HTMLElement): Element[] {
    return Array.from(container.querySelectorAll("*")).filter(
      (el) =>
        MENTION.test(el.textContent ?? "") &&
        !Array.from(el.children).some((c) => MENTION.test(c.textContent ?? "")),
    );
  }

  it("the landing page has at least one such paragraph (so the check below is not vacuous)", () => {
    const { container } = mount(<HomeScreen />);
    expect(mentionBlocks(container).length).toBeGreaterThan(0);
  });

  it.each([
    ["the landing page", HomeScreen],
    ["the contact page", ContactScreen],
    ["the privacy notice", PrivacyNoticeScreen],
    ["the help-in-another-country page", OtherCountriesScreen],
  ] as const)("on %s, every such paragraph names 988", (_name, Screen) => {
    const { container } = mount(<Screen />);
    const missing = mentionBlocks(container)
      .map((el) => norm(el.textContent))
      .filter((t) => !t.includes("988"));
    expect(missing).toEqual([]);
  });

  it('"Why this exists" says "In the US, you can call or text 988, any time."', () => {
    expect(page().text).toContain("In the US, you can call or text 988, any time. The help button");
  });
});

describe("where the numbers come from", () => {
  it("links to the vision document's references, says it leaves the site, and is a 44px target", () => {
    const { getByRole, text } = page();
    const link = getByRole("link", { name: /^Where these numbers come from/ });
    expect(link).toHaveAttribute("href", `${VISION_URL}#references`);
    expect(norm(link.textContent)).toContain("Where these numbers come from");
    // The accessible name says it opens another site.
    const name = link.getAttribute("aria-label") ?? link.textContent ?? "";
    expect(name).toMatch(/GitHub/);
    expect(getComputedStyle(link).minHeight).toBe("44px");
    // Placed under the statistics, before the suicide paragraph's section ends.
    expect(text.indexOf("Where these numbers come from")).toBeGreaterThan(text.indexOf("one in eight"));
    expect(text.indexOf("Where these numbers come from")).toBeLessThan(text.indexOf("Who built it"));
  });
});

describe('"we" and the operator\'s promises (governance review, round 1)', () => {
  // "Who built it" defines "we" as the people who wrote to the founder. The
  // promises in "What we will never do" are made by the operator, and member
  // voting is not built, so the section must say both plainly.
  it("says VT Infinite, Inc. makes the promises, and that voting is not built yet", () => {
    const { text } = page();
    const section = text.slice(text.indexOf("What we will never do"), text.indexOf("For partners and builders"));
    expect(section).toContain(
      "VT Infinite, Inc., which runs OneRhythm, makes these promises. Member voting is not built yet. When it opens, every member will have one equal vote.",
    );
    expect(section).toContain("No pay-for-power in governance: when voting opens, one member, one equal vote");
  });
});
