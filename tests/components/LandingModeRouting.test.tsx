// The landing-only public build (ADR 0023): every route except the landing
// set redirects to "/", and the redirect lives in the ROUTER LAYOUT — not in
// hidden links, and not in each screen.
//
// This renders the REAL root layout (app/_layout.tsx) inside expo-router's own
// test router. The route list is read from the app/ directory at test time, so
// a route added later is covered without anyone remembering to list it here:
// the allow-list is default-deny, and so is this test.
//
// Each route file is replaced by a stub that records when it renders. A
// redirect that still mounted the member screen for a frame would let that
// screen's effects run (and call Supabase), so "never rendered" is asserted,
// not just "ended up at /".
import React from "react";
import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { Text } from "react-native";
import { renderRouter, screen } from "expo-router/testing-library";
import { crisisHelpSheet as C } from "../shared/contracts/crisis-help-sheet";

jest.mock("@expo-google-fonts/atkinson-hyperlegible", () => ({
  useFonts: () => [true, null],
  AtkinsonHyperlegible_400Regular: 1,
  AtkinsonHyperlegible_700Bold: 2,
}));
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(async () => {}),
}));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("../../global.css", () => ({}), { virtual: true });

// If anything constructs a Supabase client in landing mode, this test fails.
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

const APP = join(__dirname, "..", "..", "app");

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...routeFiles(p));
    else if (/\.tsx?$/.test(name)) out.push(relative(APP, p).replace(/\.tsx?$/, ""));
  }
  return out;
}

/** "posts/[id]" -> "/posts/sample-1"; "index" -> "/"; "journey/index" -> "/journey". */
function sampleUrl(route: string): string {
  const path = route
    .split("/")
    .filter((seg) => seg !== "index" && !/^\(.*\)$/.test(seg))
    .map((seg) => (/^\[.*\]$/.test(seg) ? "sample-1" : seg))
    .join("/");
  return "/" + path;
}

const ROUTES = routeFiles(APP).filter(
  (r) => !r.split("/").some((seg) => seg.startsWith("_") || seg.startsWith("+")),
);
/** Special routes (+not-found) load for real: what they draw is the point. */
const SPECIAL = routeFiles(APP).filter((r) => r.split("/").some((seg) => seg.startsWith("+")));

/** The landing build's allow-list, as the founder decided it (3 Nov 2026). */
const LANDING_URLS = ["/", "/privacy-notice", "/contact", "/help/other-countries"];

const rendered: string[] = [];

function routeMap() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RootLayout = require("../../app/_layout").default;
  const map: Record<string, React.ComponentType> = { _layout: RootLayout };
  for (const route of SPECIAL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    map[route] = require(join(APP, route)).default;
  }
  for (const route of ROUTES) {
    const url = sampleUrl(route);
    map[route] = function Stub() {
      rendered.push(url);
      return <Text>{`route ${url}`}</Text>;
    };
  }
  return map;
}

const MEMBER_URLS = ROUTES.map(sampleUrl).filter((u) => !LANDING_URLS.includes(u));

const ORIGINAL_MODE = process.env.EXPO_PUBLIC_SITE_MODE;

beforeEach(() => {
  rendered.length = 0;
  mockCreateClient.mockClear();
});
afterEach(() => {
  if (ORIGINAL_MODE === undefined) delete process.env.EXPO_PUBLIC_SITE_MODE;
  else process.env.EXPO_PUBLIC_SITE_MODE = ORIGINAL_MODE;
});

describe("the route list this test reads", () => {
  it("finds the member routes, so the redirect test below is not empty", () => {
    // A test that loops over nothing passes on anything (ADR 0013).
    expect(MEMBER_URLS).toEqual(
      expect.arrayContaining([
        "/sign-in",
        "/feed",
        "/communities",
        "/compose",
        "/onboarding",
        "/moderation",
        "/journey",
        "/settings/consent",
        "/updates/confirm",
        "/appeal/sample-1",
        "/members/sample-1/journey",
      ]),
    );
    expect(MEMBER_URLS.length).toBeGreaterThanOrEqual(18);
    for (const u of LANDING_URLS) {
      expect(ROUTES.map(sampleUrl)).toContain(u);
    }
  });
});

describe("landing mode (EXPO_PUBLIC_SITE_MODE=landing)", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SITE_MODE = "landing";
  });

  it.each(MEMBER_URLS)("redirects %s to / without ever rendering it", async (url) => {
    const view = renderRouter(routeMap(), { initialUrl: url });
    await screen.findByText("route /");
    expect(view.getPathname()).toBe("/");
    expect(rendered).not.toContain(url);
    // Crisis help survives the redirect.
    expect(screen.getByRole("button", { name: C.trigger.accessibleName })).toBeTruthy();
  });

  it("redirects a path that matches no route at all", async () => {
    const view = renderRouter(routeMap(), { initialUrl: "/no-such-page" });
    await screen.findByText("route /");
    expect(view.getPathname()).toBe("/");
  });

  it.each(LANDING_URLS)("renders %s, with crisis help", async (url) => {
    const view = renderRouter(routeMap(), { initialUrl: url });
    await screen.findByText(`route ${url}`);
    expect(view.getPathname()).toBe(url);
    expect(screen.getByRole("button", { name: C.trigger.accessibleName })).toBeTruthy();
  });

  it("never constructs a Supabase client while routing", async () => {
    for (const url of [...LANDING_URLS, "/feed", "/sign-in"]) {
      const view = renderRouter(routeMap(), { initialUrl: url });
      await screen.findByText(/^route \//);
      view.unmount();
    }
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe("the member build (flag unset) — the control", () => {
  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_SITE_MODE;
    // The member build needs a client; createClient above is a fake.
    process.env.EXPO_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "sb_publishable_test";
  });
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("does not redirect member routes, which proves the test above can fail", async () => {
    const view = renderRouter(routeMap(), { initialUrl: "/feed" });
    await screen.findByText("route /feed");
    expect(view.getPathname()).toBe("/feed");
    expect(rendered).toContain("/feed");
  });

  it("draws an unknown path inside the shell, with crisis help", async () => {
    // Without app/+not-found.tsx, expo-router draws its own "Unmatched Route"
    // page outside the root layout: no header, so no crisis help.
    renderRouter(routeMap(), { initialUrl: "/no-such-page" });
    await screen.findByText("We can't find that page");
    expect(screen.getByRole("button", { name: C.trigger.accessibleName })).toBeTruthy();
  });
});

describe("the redirect notice (a11y review round 1)", () => {
  it("is a polite status message, so a screen reader hears why the page changed", () => {
    process.env.EXPO_PUBLIC_SITE_MODE = "landing";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const src = require("fs").readFileSync(join(APP, "_layout.tsx"), "utf8");
    const notice = src.slice(src.indexOf("function RouteGate"), src.indexOf("export default"));
    expect(notice).toMatch(/role="status"/);
    expect(notice).toMatch(/Taking you to the home page/);
  });
});
