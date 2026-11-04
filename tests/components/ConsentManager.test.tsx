import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  ConsentManager,
  type ConsentHistoryRow,
} from "../../src/components/ConsentManager";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

function allText(tree: ReturnType<typeof render>): string {
  const walk = (n: { children: unknown[] }): string =>
    n.children
      .map((c) =>
        typeof c === "string" ? c : walk(c as { children: unknown[] }),
      )
      .join(" ");
  return walk(tree.UNSAFE_root as unknown as { children: unknown[] });
}

const history: ConsentHistoryRow[] = [
  {
    id: "c1",
    purpose: "health_self_id",
    policy_version: "v1",
    granted_at: "2026-04-12T10:00:00.000Z",
    withdrawn_at: null,
  },
  {
    id: "c2",
    purpose: "health_self_id",
    policy_version: "v0",
    granted_at: "2026-01-03T10:00:00.000Z",
    withdrawn_at: "2026-04-11T09:00:00.000Z",
  },
];

const base = {
  status: "on" as const,
  tags: [{ id: "t1", label: "AFib" }],
  history,
  onWithdraw: jest.fn().mockResolvedValue(undefined),
  onExport: jest.fn(),
  onDeleteAccount: jest.fn(),
};

describe("ConsentManager — B14, the full consent surface", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows per-purpose status and the member's current tags", () => {
    const tree = render(<ConsentManager {...base} />);
    expect(allText(tree)).toMatch(/health self-identification/i);
    expect(allText(tree)).toMatch(/\bOn\b/);
    expect(allText(tree)).toMatch(/AFib/);
  });

  describe("versioned consent history", () => {
    it("shows every record with the policy version agreed to", () => {
      const text = allText(render(<ConsentManager {...base} />));
      expect(text).toMatch(/policy v1/i);
      expect(text).toMatch(/policy v0/i);
    });

    it("keeps withdrawn records visible, marked as withdrawn", () => {
      const text = allText(render(<ConsentManager {...base} />));
      expect(text).toMatch(/withdrawn/i);
    });

    it("renders a heading for the history section", () => {
      const { getByRole } = render(<ConsentManager {...base} />);
      expect(getByRole("header", { name: /consent history/i })).toBeTruthy();
    });
  });

  describe("turning health self-ID off", () => {
    it("asks for confirmation before purging tags — no instant destruction", () => {
      const onWithdraw = jest.fn().mockResolvedValue(undefined);
      const tree = render(<ConsentManager {...base} onWithdraw={onWithdraw} />);
      fireEvent.press(
        tree.getByRole("button", { name: /turn off (and|&) remove my tags/i }),
      );
      expect(onWithdraw).not.toHaveBeenCalled();
      expect(allText(tree)).toMatch(/remove your health tags\?/i);
    });

    it("says exactly what goes and what stays", () => {
      const tree = render(<ConsentManager {...base} />);
      fireEvent.press(
        tree.getByRole("button", { name: /turn off (and|&) remove my tags/i }),
      );
      const text = allText(tree);
      expect(text).toMatch(/delete your (diagnosis|health)/i);
      expect(text).toMatch(/posts and account stay/i);
    });

    it("announces the confirmation politely and focuses the SAFE control", () => {
      const focused: string[] = [];
      const tree = render(
        <ConsentManager
          {...base}
          onFocusForTest={(who: string) => focused.push(who)}
        />,
      );
      fireEvent.press(
        tree.getByRole("button", { name: /turn off (and|&) remove my tags/i }),
      );
      expect(
        tree.getByTestId("withdraw-confirm").props.accessibilityLiveRegion,
      ).toBe("polite");
      expect(focused[focused.length - 1]).toBe("keep");
    });

    it("withdraws only after confirming", () => {
      const onWithdraw = jest.fn().mockResolvedValue(undefined);
      const tree = render(<ConsentManager {...base} onWithdraw={onWithdraw} />);
      fireEvent.press(
        tree.getByRole("button", { name: /turn off (and|&) remove my tags/i }),
      );
      fireEvent.press(tree.getByRole("button", { name: /remove my tags/i }));
      expect(onWithdraw).toHaveBeenCalledTimes(1);
    });

    it("offers Keep as plainly as Remove (no dark pattern)", () => {
      const tree = render(<ConsentManager {...base} />);
      fireEvent.press(
        tree.getByRole("button", { name: /turn off (and|&) remove my tags/i }),
      );
      const keep = tree.getByRole("button", { name: /keep them/i });
      const remove = tree.getByRole("button", { name: /remove my tags/i });
      expect(flatten(keep.props.style).minHeight).toBeGreaterThanOrEqual(44);
      expect(flatten(remove.props.style).minHeight).toBeGreaterThanOrEqual(44);
    });
  });

  describe("links to the other rights", () => {
    it("offers download and delete", () => {
      const onExport = jest.fn();
      const onDeleteAccount = jest.fn();
      const tree = render(
        <ConsentManager
          {...base}
          onExport={onExport}
          onDeleteAccount={onDeleteAccount}
        />,
      );
      fireEvent.press(tree.getByRole("button", { name: /download my data/i }));
      fireEvent.press(tree.getByRole("button", { name: /delete my account/i }));
      expect(onExport).toHaveBeenCalled();
      expect(onDeleteAccount).toHaveBeenCalled();
    });
  });

  describe("builds no control that lies", () => {
    // consent_purpose has exactly one value. An "Email notifications" toggle
    // would be a switch wired to nothing.
    it("does not render an email-notifications toggle", () => {
      const tree = render(<ConsentManager {...base} />);
      expect(
        tree.queryByRole("button", { name: /email notification/i }),
      ).toBeNull();
      expect(tree.queryByRole("switch", { name: /email/i })).toBeNull();
    });
  });

  describe("the off state", () => {
    it("does not offer to turn off what is already off", () => {
      const tree = render(
        <ConsentManager {...base} status="off" tags={[]} />,
      );
      expect(
        tree.queryByRole("button", { name: /turn off/i }),
      ).toBeNull();
      expect(allText(tree)).toMatch(/\bOff\b/);
    });

    it("still shows the history after withdrawal", () => {
      const tree = render(<ConsentManager {...base} status="off" tags={[]} />);
      expect(allText(tree)).toMatch(/policy v1/i);
    });
  });
});
