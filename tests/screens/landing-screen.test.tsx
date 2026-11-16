import React from "react";
import { View } from "react-native";
import Svg from "react-native-svg";
import { render } from "@testing-library/react-native";

const mockRedirect = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/lib/supabase", () => ({ supabase: {} }));

const mockUseAuth = jest.fn();
jest.mock("../../src/lib/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../src/lib/updates/subscribe", () => ({
  subscribeToUpdates: jest.fn().mockResolvedValue({ ok: true }),
  looksLikeEmail: jest.requireActual("../../src/lib/updates/subscribe")
    .looksLikeEmail,
}));

import HomeScreen from "../../app/index";

const signedOut = { session: null, user: null, loading: false, signOut: jest.fn() };
const signedIn = {
  session: { user: { id: "u1" } },
  user: { id: "u1" },
  loading: false,
  signOut: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue(signedOut);
});

function text(tree: unknown): string {
  return JSON.stringify(tree);
}

describe("landing — who sees it", () => {
  it("redirects a signed-in member to the feed", () => {
    mockUseAuth.mockReturnValue(signedIn);
    render(<HomeScreen />);
    expect(mockRedirect).toHaveBeenCalledWith("/feed");
  });

  it("shows the landing page to a signed-out visitor", () => {
    const { getByRole, toJSON } = render(<HomeScreen />);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(
      getByRole("header", { name: "You are not alone with your heart." }),
    ).toBeTruthy();
    expect(toJSON()).toBeTruthy();
  });

  it("does not redirect while the session is still loading", () => {
    mockUseAuth.mockReturnValue({ ...signedOut, loading: true });
    render(<HomeScreen />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});

describe("landing — the safety floor", () => {
  it("renders a crisis affordance with icon AND text", () => {
    const { getByRole, toJSON } = render(<HomeScreen />);
    // Reachable from every screen (a11y.md); a silent failure to render this
    // is a SAFETY incident, not a UI bug. AppShell carries the global 🆘 and
    // wireframe B1 puts a second one in the footer.
    //
    // Both halves are checked: the accessible name (what a screen reader
    // announces) and the icon in the rendered output (what a sighted reader
    // scans for). The icon is asserted against the tree rather than the found
    // node, because a test-renderer node is circular and cannot be serialized.
    expect(getByRole("button", { name: "Need help right now?" })).toBeTruthy();
    expect(text(toJSON())).toMatch(/🆘/);
  });

  it("tells the reader to call local emergency services in an emergency", () => {
    const { toJSON } = render(<HomeScreen />);
    expect(text(toJSON())).toMatch(/emergency/i);
  });

  it("says plainly that this is not medical advice", () => {
    const { toJSON } = render(<HomeScreen />);
    expect(text(toJSON())).toMatch(/not medical advice/i);
  });
});

describe("landing — honest framing", () => {
  it("no longer offers an open-books page (ADR 0016)", () => {
    // The /transparency page was removed pre-launch as premature. This is not
    // a decorative absence check: the link was a real affordance and its
    // return, without the Phase 4 conditions being met, is the regression.
    const { queryByRole, toJSON } = render(<HomeScreen />);
    expect(queryByRole("link", { name: /open books/i })).toBeNull();
    expect(text(toJSON())).not.toMatch(/open books|transparency/i);
  });

  it("states the proposed entity status and current contribution boundary", () => {
    const { toJSON } = render(<HomeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/conversion.*proposed.*not been filed/i);
    expect(body).toMatch(/not a separate 501\(c\)\(3\)/i);
    expect(body).toMatch(/not be tax-deductible/i);
  });

  it("never uses donation vocabulary (ADR 0007)", () => {
    const { toJSON } = render(<HomeScreen />);
    expect(text(toJSON())).not.toMatch(/donat/i);
  });

  it("says the platform is not open yet rather than implying it is", () => {
    const { toJSON } = render(<HomeScreen />);
    expect(text(toJSON())).toMatch(/not open yet|isn't open yet/i);
  });

  it("keeps both halves of the what-this-is / what-this-is-NOT promise", () => {
    const { getByRole, toJSON } = render(<HomeScreen />);
    expect(getByRole("header", { name: "What this is" })).toBeTruthy();
    expect(getByRole("header", { name: "What this is NOT" })).toBeTruthy();
    expect(text(toJSON())).toMatch(/not a place for diagnosis or ECG reading/i);
  });

  it("carries pooled population figures, not the retired single-study ones", () => {
    // ADR 0016. The page used to cite ~88% anxiety and ~71% depression from a
    // single 222-person study. Those are pinned as ABSENT so a future edit
    // cannot quietly restore them, and the pooled replacements are pinned as
    // present so this test cannot pass against a page with no numbers at all.
    const { toJSON } = render(<HomeScreen />);
    const body = text(toJSON());
    expect(body).not.toMatch(/88\s*%|71\s*%/);
    expect(body).toMatch(/50 million/);
    expect(body).toMatch(/anxiety in about one in eight people with atrial fibrillation/i);
    expect(body).toMatch(/one in five/i);
  });

  it("keeps crisis resources alongside the suicide line without generalized prevalence", () => {
    // The adjacency IS the safety property: a reader who meets that sentence
    // must not have to scroll to find out what to do about it. Asserting they
    // are in one <Text> is what makes this a real check rather than a
    // both-somewhere-on-the-page check.
    const { getByText, toJSON } = render(<HomeScreen />);
    expect(
      getByText(/thoughts of suicide[\s\S]*crisis resources/i),
    ).toBeTruthy();
    expect(text(toJSON())).not.toMatch(/one in five people with symptoms/i);
  });

  it("does not name the founder's own diagnosis or device", () => {
    // ADR 0016. The point of "Who built it" (was "Built by a patient") stands without disclosing
    // one person's condition on a public front door. The population figure
    // above may still say "implanted defibrillator" — this is about the
    // first-person copy, so it is matched in the first person.
    const { toJSON } = render(<HomeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/I live with an arrhythmia/i);
    expect(body).not.toMatch(/ARVC/i);
    expect(body).not.toMatch(/I have [^"]{0,60}(defibrillator|ICD)/i);
    expect(body).not.toMatch(/my (defibrillator|ICD|ablation)/i);
  });

  it("carries no hype, urgency, or growth-hacking language", () => {
    const { toJSON } = render(<HomeScreen />);
    const body = text(toJSON());
    expect(body).not.toMatch(
      /revolution|game.chang|world.class|cutting.edge|limited time|act now|don't miss|hurry/i,
    );
  });
});

describe("landing — the email form and its promises", () => {
  it("offers the updates form", () => {
    const { getByLabelText } = render(<HomeScreen />);
    expect(getByLabelText("Your email address")).toBeTruthy();
  });

  it("links the marketing privacy notice next to the form", () => {
    const { getByRole } = render(<HomeScreen />);
    expect(getByRole("link", { name: /privacy notice/i })).toBeTruthy();
  });

  it("promises no ads, no selling data, no paywalls, no pay-for-power", () => {
    const { toJSON } = render(<HomeScreen />);
    const body = text(toJSON());
    expect(body).toMatch(/no ads/i);
    expect(body).toMatch(/never sell/i);
    expect(body).toMatch(/no paywalls/i);
  });
});

describe("landing — the reading measure (v3 follow-up #5)", () => {
  it("caps the content column so wide screens do not produce 90ch lines", () => {
    const { UNSAFE_getAllByType } = render(<HomeScreen />);
    const capped = UNSAFE_getAllByType(View).some((node: { props: { style?: unknown } }) => {
      const style = Array.isArray(node.props.style)
        ? Object.assign({}, ...node.props.style.filter(Boolean))
        : (node.props.style as { maxWidth?: number } | undefined);
      return (
        !!style &&
        typeof style.maxWidth === "number" &&
        style.maxWidth > 0 &&
        style.maxWidth <= 760
      );
    });
    expect(capped).toBe(true);
  });
});

describe("landing — the mark (v3 follow-up #3)", () => {
  it("uses the shared Wordmark rather than hand-rolling the lockup", () => {
    const { UNSAFE_getAllByType } = render(<HomeScreen />);
    // The v3 mark is inline SVG. A hand-rolled <Text>One</Text><Text>Rhythm</Text>
    // has no SVG in it — and the one on this page had lost the accent entirely.
    expect(UNSAFE_getAllByType(Svg).length).toBeGreaterThan(0);
  });
});
