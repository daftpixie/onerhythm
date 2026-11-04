// The landing page, in a real DOM.
//
// This is the only page a stranger sees today and the only one currently
// deployed, so it is the one page where "what the browser receives" is not a
// hypothetical. The plan predicted heading levels would be the first thing the
// real tag names made visible; that prediction is checked here.

import React from "react";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Redirect: () => null,
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/lib/supabase", () => ({ supabase: {} }));

const mockUseAuth = jest.fn();
jest.mock("../../src/lib/auth", () => ({ useAuth: () => mockUseAuth() }));

jest.mock("../../src/lib/updates/subscribe", () => ({
  subscribeToUpdates: jest.fn().mockResolvedValue({ ok: true }),
  looksLikeEmail: jest.requireActual("../../src/lib/updates/subscribe")
    .looksLikeEmail,
}));

import HomeScreen from "../../app/index";
import { mount } from "./mount";

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ session: null, loading: false });
});

describe("landing page headings", () => {
  it("starts at exactly one h1", () => {
    // RNW maps accessibilityRole="header" to <h1> unless aria-level says
    // otherwise, so a page that never sets a level silently becomes a wall of
    // h1s. Only the DOM has a tag name to check this against.
    const { container } = mount(<HomeScreen />);
    const h1s = container.querySelectorAll("h1");
    expect(h1s).toHaveLength(1);
  });

  it("never skips a heading level on the way down", () => {
    const { container } = mount(<HomeScreen />);
    const levels = Array.from(
      container.querySelectorAll("h1,h2,h3,h4,h5,h6"),
    ).map((h) => Number(h.tagName[1]));

    expect(levels.length).toBeGreaterThan(0);
    for (let i = 1; i < levels.length; i++) {
      // A jump from h2 to h4 leaves a screen-reader user's outline with a hole
      // in it. Descending any distance is fine; ascending must be by one.
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });
});

describe("landing page essentials", () => {
  it("shows the crisis affordance", () => {
    // a11y.md: reachable from every screen, and a silent failure to render it
    // is a SAFETY incident. This is the page most strangers will ever see.
    const { getByLabelText } = mount(<HomeScreen />);
    expect(getByLabelText("Need help right now?")).toBeInTheDocument();
  });

  it("carries the wordmark with an accessible name, not a bare glyph", () => {
    const { container } = mount(<HomeScreen />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // The glyph itself is hidden; the name must live on an ancestor.
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.textContent).toMatch(/OneRhythm/);
  });

  it("offers the updates form as the single call to action", () => {
    const { getByRole } = mount(<HomeScreen />);
    expect(
      getByRole("button", { name: "Keep me posted" }),
    ).toBeInTheDocument();
  });

  it("links Open source to the real repository, not to github.com itself", () => {
    // The footer used to point at https://github.com/. Correct once the repo
    // is public; docs/RELEASE_FRESH_HISTORY.md flips visibility before the URL
    // is shared.
    const { getByRole } = mount(<HomeScreen />);
    expect(getByRole("link", { name: "Open source code on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/daftpixie/onerhythm",
    );
  });

  it('names the entity plainly in the footer: "A VT Infinite, Inc. initiative."', () => {
    // CLAUDE.md entity status: OneRhythm is an initiative of VT Infinite, Inc.
    // "A VT Infinite company." read as a separate company or a subsidiary.
    const { container } = mount(<HomeScreen />);
    const text = (container.textContent ?? "").replace(/\s+/g, " ");
    expect(text).toContain("A VT Infinite, Inc. initiative.");
    expect(text).not.toMatch(/A VT Infinite company/);
  });

  it("carries no ad or tracking pixel", () => {
    // Non-negotiable #5. Disclosing health data to a third party is itself a
    // reportable FTC HBNR breach, so the absence is checked in the DOM the
    // browser would actually build.
    const { container } = mount(<HomeScreen />);
    expect(container.querySelectorAll("img")).toHaveLength(0);
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    expect(container.querySelectorAll("script")).toHaveLength(0);
    // ...and this is not passing merely because the page rendered nothing.
    expect((container.textContent ?? "").length).toBeGreaterThan(200);
  });
});
