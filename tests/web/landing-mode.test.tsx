// The landing-only public build (ADR 0023), in a real DOM.
//
// What this pins, for EXPO_PUBLIC_SITE_MODE=landing:
//  - no Supabase client is ever constructed, with no EXPO_PUBLIC_SUPABASE_*
//    variables set, on any page the landing build serves;
//  - the updates sign-up form is not rendered, and a plain contact line (a
//    mailto link, not a form) takes its place;
//  - the footer's "Open source" link points at the real repository;
//  - the "For partners and builders" section exists, links to the vision
//    document, and carries no numbers (ADR 0016's statistics rules);
//  - crisis help is on every page.
//
// Supabase is NOT mocked at the module level here. The real src/lib/supabase
// and the real AuthProvider run; only createClient underneath them is a spy.
import React, { act } from "react";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Redirect: () => null,
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => "/",
}));

const mockCreateClient = jest.fn(() => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => Promise.resolve(),
  },
  from: () => ({}),
}));
jest.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...(args as [])),
}));

import { SafeAreaProvider } from "react-native-safe-area-context";
import { mount } from "./mount";
import { AuthProvider } from "../../src/lib/auth";
import { AppShell } from "../../src/components/AppShell";
import HomeScreen from "../../app/index";
import ContactScreen from "../../app/contact";
import PrivacyNoticeScreen from "../../app/privacy-notice";
import OtherCountriesScreen from "../../app/help/other-countries";
import { CONTACT_EMAIL } from "../../src/lib/site";

const REPO_URL = "https://github.com/daftpixie/onerhythm";
const VISION_URL = "https://github.com/daftpixie/onerhythm/blob/main/docs/vision/OneRhythm_Vision.md";
// The address is pinned once, in tests/unit/contact-address.test.ts.
const CONTACT = CONTACT_EMAIL;

const saved = {
  mode: process.env.EXPO_PUBLIC_SITE_MODE,
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

beforeEach(() => {
  process.env.EXPO_PUBLIC_SITE_MODE = "landing";
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  mockCreateClient.mockClear();
});

afterAll(() => {
  const restore = (k: string, v: string | undefined) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  };
  restore("EXPO_PUBLIC_SITE_MODE", saved.mode);
  restore("EXPO_PUBLIC_SUPABASE_URL", saved.url);
  restore("EXPO_PUBLIC_SUPABASE_ANON_KEY", saved.key);
});

function load() {
  return { AuthProvider, HomeScreen, ContactScreen, PrivacyNoticeScreen, OtherCountriesScreen };
}

/** Wait for effects that resolve promises (auth's getSession, the gates read). */
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("no Supabase in the landing build", () => {
  it("imports the Supabase module with no EXPO_PUBLIC_SUPABASE_* set, without throwing", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    expect(() => require("../../src/lib/supabase")).not.toThrow();
  });

  it("constructs no client on any page the landing build serves", async () => {
    const m = load();
    for (const Page of [m.HomeScreen, m.ContactScreen, m.PrivacyNoticeScreen, m.OtherCountriesScreen]) {
      const view = mount(
        <m.AuthProvider>
          <Page />
        </m.AuthProvider>,
      );
      await settle();
      view.unmount();
    }
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("refuses, loudly, if code reaches for the client anyway", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabase } = require("../../src/lib/supabase");
    expect(() => supabase.from("posts")).toThrow(/landing/i);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("control: the member build does construct the client, so the spy works", () => {
    process.env.EXPO_PUBLIC_SITE_MODE = "";
    process.env.EXPO_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabase } = require("../../src/lib/supabase");
    void supabase.auth;
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });
});

describe("the landing page, sign-up off", () => {
  it("does not render the updates form", async () => {
    const m = load();
    const { container, queryByRole } = mount(
      <m.AuthProvider>
        <m.HomeScreen />
      </m.AuthProvider>,
    );
    await settle();
    expect(queryByRole("button", { name: "Keep me posted" })).toBeNull();
    expect(container.querySelectorAll("input, textarea, form")).toHaveLength(0);
    // ...and not because the page rendered nothing.
    expect((container.textContent ?? "").length).toBeGreaterThan(200);
  });

  it("shows a plain contact line instead: a mailto link with the address as its text", async () => {
    const m = load();
    const { container } = mount(
      <m.AuthProvider>
        <m.HomeScreen />
      </m.AuthProvider>,
    );
    await settle();
    const links = Array.from(container.querySelectorAll(`a[href="mailto:${CONTACT}"]`));
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].textContent).toContain(CONTACT);
  });

  it("does not promise to email the reader when it opens", async () => {
    // With no list, "leave your email and we'll tell you" would be untrue.
    const m = load();
    const { container } = mount(
      <m.AuthProvider>
        <m.HomeScreen />
      </m.AuthProvider>,
    );
    await settle();
    expect(container.textContent).not.toMatch(/leave your email/i);
  });
});

describe("the landing page footer", () => {
  it("links Open source to the real repository", async () => {
    const m = load();
    const { getByRole } = mount(
      <m.AuthProvider>
        <m.HomeScreen />
      </m.AuthProvider>,
    );
    await settle();
    const link = getByRole("link", { name: "Open source code on GitHub" });
    expect(link).toHaveAttribute("href", REPO_URL);
  });
});

describe("For partners and builders", () => {
  async function section() {
    const m = load();
    const view = mount(
      <m.AuthProvider>
        <m.HomeScreen />
      </m.AuthProvider>,
    );
    await settle();
    const heading = view.getByRole("heading", { name: "For partners and builders" });
    return { view, heading };
  }

  it("is a level-2 section of the page", async () => {
    const { heading } = await section();
    expect(heading.tagName).toBe("H2");
  });

  it("links to the vision document on GitHub", async () => {
    const { view } = await section();
    const link = view.getByRole("link", { name: /vision/i });
    expect(link).toHaveAttribute("href", VISION_URL);
  });

  it("adds no numbers (ADR 0016)", async () => {
    const { heading } = await section();
    // The section is the heading's parent block.
    const block = heading.parentElement as HTMLElement;
    const text = block.textContent ?? "";
    expect(text.length).toBeGreaterThan(80);
    expect(text).not.toMatch(/\d/);
  });

  it("asks for no money", async () => {
    const { heading } = await section();
    const text = (heading.parentElement as HTMLElement).textContent ?? "";
    expect(text).not.toMatch(/donat|contribut|fund|invest|support us|\$/i);
  });
});

describe("crisis help on every landing page", () => {
  it.each(["HomeScreen", "ContactScreen", "PrivacyNoticeScreen", "OtherCountriesScreen"] as const)(
    "%s renders inside the shell with the crisis control",
    async (name) => {
      const m = load();
      const Page = m[name];
      const { getAllByLabelText } = mount(
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 1024, height: 768 },
            insets: { top: 0, left: 0, right: 0, bottom: 0 },
          }}
        >
          <m.AuthProvider>
            <AppShell>
              <Page />
            </AppShell>
          </m.AuthProvider>
        </SafeAreaProvider>,
      );
      await settle();
      // The header's control, plus the footer's on the home page.
      expect(getAllByLabelText("Need help right now?").length).toBeGreaterThanOrEqual(1);
    },
  );
});

describe("the contact page in landing mode", () => {
  it("shows the same contact line and no reporting copy (there is nothing to report yet)", async () => {
    const m = load();
    const { container } = mount(
      <m.AuthProvider>
        <m.ContactScreen />
      </m.AuthProvider>,
    );
    await settle();
    expect(container.querySelector(`a[href="mailto:${CONTACT}"]`)).not.toBeNull();
    expect(container.textContent).not.toMatch(/Use "Report"/);
    expect(container.textContent).toMatch(/988/);
    expect(container.querySelectorAll("input, textarea, form")).toHaveLength(0);
  });
});

describe("the privacy notice in landing mode", () => {
  it("says plainly that the updates list is closed and nothing is collected", async () => {
    // The notice describes the updates list. With sign-up off it must not
    // read as if the site is collecting addresses today.
    const { container } = mount(<PrivacyNoticeScreen />);
    await settle();
    expect(container.textContent).toMatch(/updates list is closed/i);
    // Privacy review round 1: "collects no email addresses" overclaimed —
    // emailing us hands over an address, and the host sees IP addresses.
    expect(container.textContent).toMatch(/has no form and sets no cookies/i);
    expect(container.textContent).toMatch(/if you email us, we receive your address/i);
    expect(container.textContent).toMatch(/IP address/i);
    expect(container.textContent).not.toMatch(/collects no email addresses/i);
  });

  it("names the contact mailbox's host, which receives every message", async () => {
    // Decision 6 of 4 Nov 2026: the mailbox is hosted by Google Workspace, an
    // infrastructure processor (docs/privacy/subprocessor-inventory.md). A
    // reader deciding whether to email us should know who else handles it.
    const { container } = mount(<PrivacyNoticeScreen />);
    await settle();
    const text = (container.textContent ?? "").replace(/\s+/g, " ");
    expect(text).toMatch(/Our email is hosted by Google Workspace/);
    expect(text).toMatch(/every message/i);
  });
});

describe("a11y review round 1 (ADR 0023)", () => {
  it("the vision link is a 44px primary target", async () => {
    const { getByRole } = mount(<AuthProvider><HomeScreen /></AuthProvider>);
    await settle();
    const link = getByRole("link", { name: /vision/i });
    expect(getComputedStyle(link).minHeight).toBe("44px");
  });

  it("the second contact link says what it is for, so a link list is not two identical names", async () => {
    const { getAllByRole } = mount(<AuthProvider><HomeScreen /></AuthProvider>);
    await settle();
    const names = getAllByRole("link")
      .filter((a) => (a.getAttribute("href") ?? "").startsWith("mailto:"))
      .map((a) => a.getAttribute("aria-label") ?? a.textContent);
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
  });

  it("the privacy link does not name an updates list that is closed", async () => {
    const { getByRole } = mount(<AuthProvider><HomeScreen /></AuthProvider>);
    await settle();
    expect(getByRole("link", { name: "Read the privacy notice" })).toBeInTheDocument();
  });
});

describe("review round 1 — claims that must be true today", () => {
  async function page() {
    const v = mount(<AuthProvider><HomeScreen /></AuthProvider>);
    await settle();
    return v.container.textContent ?? "";
  }

  it("does not say the code or the floors are already public (governance)", async () => {
    const text = await page();
    expect(text).not.toMatch(/all of the code is public/i);
    expect(text).not.toMatch(/written down where anyone can see them/i);
  });

  it("does not promise 'never share', which the privacy floor does not say (privacy)", async () => {
    const text = await page();
    expect(text).not.toMatch(/never sell or share your data/i);
    expect(text).toMatch(/We never sell your data/);
  });
});
