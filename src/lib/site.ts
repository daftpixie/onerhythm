// Which site this build is, and the few public facts every build shares.
//
// ADR 0023 (3 Nov 2026): the public web deploy is LANDING-ONLY until the
// launch gates are met. Building with EXPO_PUBLIC_SITE_MODE=landing gives:
//  - only the routes in LANDING_PATHS render; every other path redirects to
//    "/" from the root layout (app/_layout.tsx);
//  - no Supabase client is ever constructed (src/lib/supabase.ts);
//  - no updates sign-up form; a plain contact line instead.
//
// Read with a direct `process.env.EXPO_PUBLIC_SITE_MODE` member access, never
// destructured: Expo inlines exactly that expression into the production
// bundle, and leaves a live reference in development and in jest.

export type SiteMode = "landing" | "full";

export function getSiteMode(): SiteMode {
  return process.env.EXPO_PUBLIC_SITE_MODE === "landing" ? "landing" : "full";
}

export function isLandingMode(): boolean {
  return getSiteMode() === "landing";
}

/**
 * The only paths the landing build renders. Default-deny: anything not listed
 * here, including a path that matches no route, redirects to "/". The crisis
 * help is a sheet on every screen, not a route, so it needs no entry.
 */
export const LANDING_PATHS: readonly string[] = [
  "/",
  "/privacy-notice",
  "/contact",
  "/help/other-countries",
];

/** True when `pathname` is one the landing build renders. */
export function isLandingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const bare = pathname.split(/[?#]/)[0];
  const normalized = bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  return LANDING_PATHS.includes(normalized);
}

/** The public source repository. Correct once the repository is public. */
export const SOURCE_URL = "https://github.com/daftpixie/onerhythm";

/** The vision document, on GitHub. */
export const VISION_URL = `${SOURCE_URL}/blob/main/docs/vision/OneRhythm_Vision.md`;

/** A paper by the founder, linked from "Who built it" on the landing page. */
export type FounderPaper = {
  /** The visible link text. */
  text: string;
  /** The accessible name. It starts with `text` (SC 2.5.3) and says where it goes. */
  label: string;
  url: string;
};

/**
 * The founder's papers (founder request, 7 Nov 2026): working papers on
 * Zenodo, not peer reviewed. The case report's own title names his diagnosis
 * and procedure, which the landing page does not (ADR 0016 §3), so it is
 * linked by a plain description. Pinned by
 * tests/web/landing-founder-papers.test.tsx.
 */
export const FOUNDER_PAPERS: readonly FounderPaper[] = [
  {
    text: "The Mind Was Never Outside the Cardiac Story",
    label: "The Mind Was Never Outside the Cardiac Story, a paper on Zenodo",
    url: "https://zenodo.org/records/23481586",
  },
  {
    text: "A case report by Matthew J Adams about his own care",
    label: "A case report by Matthew J Adams about his own care, on Zenodo",
    url: "https://zenodo.org/records/23512374",
  },
];

// The public contact address (founder decision, 4 Nov 2026). Hosted by Google
// Workspace, which is recorded as the contact-mailbox processor in
// docs/privacy/subprocessor-inventory.md. Pinned by
// tests/unit/contact-address.test.ts; every other test reads this constant.
export const CONTACT_EMAIL = "matthew@vt-infinite.com";
