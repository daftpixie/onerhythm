import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { AccessibilityInfo, Linking } from "react-native";
import {
  CrisisHelp,
  CrisisHelpBoundary,
  CrisisHelpSheet,
} from "../../src/components/CrisisHelpSheet";
import { crisisHelpSheet as C } from "../shared/contracts/crisis-help-sheet";

describe("CrisisHelpSheet", () => {
  it('renders "Need help right now?" trigger label', () => {
    const { getByText } = render(<CrisisHelpSheet />);
    expect(getByText(/need help right now/i)).toBeTruthy();
  });

  it("shows emergency services guidance when opened", () => {
    const { getByText } = render(<CrisisHelpSheet />);
    const trigger = getByText(/need help right now/i);
    fireEvent.press(trigger);
    expect(
      getByText(/call your local emergency number/i)
    ).toBeTruthy();
  });

  it("shows mental-health crisis resources when opened", () => {
    const { getByText } = render(<CrisisHelpSheet />);
    const trigger = getByText(/need help right now/i);
    fireEvent.press(trigger);
    expect(
      getByText(/mental-health crisis resources/i)
    ).toBeTruthy();
  });

  it("trigger has accessible button role", () => {
    const { getByRole } = render(<CrisisHelpSheet />);
    const trigger = getByRole("button", { name: /need help right now/i });
    expect(trigger).toBeTruthy();
  });

  it("trigger meets 44px minimum touch target", () => {
    const { getByRole } = render(<CrisisHelpSheet />);
    const trigger = getByRole("button", { name: /need help right now/i });
    const style = trigger.props.style;
    const flatStyle = Array.isArray(style)
      ? Object.assign({}, ...style.filter(Boolean))
      : style || {};
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
  });
});

// ---------------------------------------------------------------------------
// Build step 0 (plan §10 step 0, §5.1): tap-to-act crisis actions, the dialog
// contract, focus moves, and a render-failure fallback. A silent failure on
// this surface is a SAFETY incident (a11y.md).
// ---------------------------------------------------------------------------

function flat(style: unknown): Record<string, unknown> {
  return Array.isArray(style)
    ? Object.assign({}, ...style.flat(Infinity).filter(Boolean))
    : ((style as Record<string, unknown>) ?? {});
}

function openSheet() {
  const view = render(<CrisisHelpSheet />);
  fireEvent.press(view.getByRole("button", { name: C.trigger.accessibleName }));
  return view;
}

describe("CrisisHelpSheet — tap-to-act crisis actions", () => {
  let openURL: jest.SpyInstance;
  beforeEach(() => {
    openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });
  afterEach(() => openURL.mockRestore());

  it.each([
    [C.emergency.label, C.emergency.url],
    [C.lifeline.call.label, C.lifeline.call.url],
    [C.lifeline.sms.label, C.lifeline.sms.url],
    [C.resource.text, C.resource.url],
  ])("%s is a labelled link that opens %s", (label, url) => {
    const { getByRole } = openSheet();
    const action = getByRole("link", { name: label });
    fireEvent.press(action);
    expect(openURL).toHaveBeenCalledWith(url);
  });

  it("each crisis action is at least 44px tall", () => {
    const { getByRole } = openSheet();
    for (const label of C.actionOrder) {
      const action = getByRole("link", { name: label });
      expect(flat(action.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
  });

  it("puts the actions in order, emergency first", () => {
    const { getAllByRole } = openSheet();
    const names = getAllByRole("link").map(
      (el) => el.props.accessibilityLabel ?? "",
    );
    expect(names).toEqual(C.actionOrder);
  });

  it("keeps the call and text actions in the same block as the 988 copy", () => {
    const { getByText, getByRole } = openSheet();
    const block = getByText(C.lifeline.text).parent!.parent!;
    const inBlock = (label: string) => {
      const target = getByRole("link", { name: label });
      let node: typeof target | null = target;
      while (node && node !== block) node = node.parent;
      return node === block;
    };
    expect(inBlock(C.lifeline.call.label)).toBe(true);
    expect(inBlock(C.lifeline.sms.label)).toBe(true);
  });
});

describe("CrisisHelpSheet — dialog contract (native)", () => {
  it("marks the sheet modal for VoiceOver", () => {
    const { UNSAFE_root } = openSheet();
    const modalViews = UNSAFE_root.findAll(
      (n) => n.props.accessibilityViewIsModal === C.nativeOnly.viewIsModal,
    );
    expect(modalViews.length).toBeGreaterThan(0);
  });

  it("moves screen-reader focus to the title on open, and back on close", () => {
    const send = jest
      .spyOn(AccessibilityInfo, "sendAccessibilityEvent")
      .mockImplementation(() => {});
    try {
      const view = openSheet();
      expect(send).toHaveBeenCalled();
      const [openTarget, openEvent] = send.mock.calls[send.mock.calls.length - 1];
      expect(openEvent).toBe("focus");
      expect(openTarget).toBeTruthy();

      fireEvent.press(view.getByRole("button", { name: C.close.accessibleName }));
      const [closeTarget, closeEvent] = send.mock.calls[send.mock.calls.length - 1];
      expect(closeEvent).toBe("focus");
      expect(closeTarget).toBeTruthy();
      expect(closeTarget).not.toBe(openTarget);
    } finally {
      send.mockRestore();
    }
  });
});

describe("CrisisHelp — render-failure fallback", () => {
  function Broken(): never {
    throw new Error("sheet failed to render");
  }

  it("still shows plain crisis text and numbers if the sheet throws", () => {
    const quiet = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { getByText, getByRole } = render(
        <CrisisHelpBoundary>
          <Broken />
        </CrisisHelpBoundary>,
      );
      expect(getByText(C.fallback.text)).toBeTruthy();
      for (const a of C.fallback.actions) {
        expect(getByRole("link", { name: a.label })).toBeTruthy();
      }
    } finally {
      quiet.mockRestore();
    }
  });

  it("CrisisHelp renders the normal trigger when nothing fails", () => {
    const { getByRole } = render(<CrisisHelp />);
    expect(getByRole("button", { name: C.trigger.accessibleName })).toBeTruthy();
  });
});

describe("CrisisHelpSheet — no silent failure of an action", () => {
  it("tells the member what to dial if the device cannot open the link", async () => {
    const openURL = jest
      .spyOn(Linking, "openURL")
      .mockRejectedValue(new Error("no handler"));
    try {
      const { getByRole, findByText } = openSheet();
      fireEvent.press(getByRole("link", { name: C.emergency.label }));
      const line = await findByText(C.openFailed);
      expect(line).toBeTruthy();
      // Announced: it sits inside a polite live region that was already
      // mounted (a region inserted with its text is often not read).
      let node: typeof line | null = line;
      while (node && node.props.accessibilityLiveRegion !== "polite") node = node.parent;
      expect(node).not.toBeNull();
    } finally {
      openURL.mockRestore();
    }
  });
});

describe("CrisisHelpSheet — every action stays reachable", () => {
  it("puts the sheet contents in a ScrollView, so large text cannot push actions off-screen", () => {
    const { UNSAFE_root, getByRole } = openSheet();
    const scroll = UNSAFE_root.findAll(
      (n) => (n.type as { displayName?: string })?.displayName === "ScrollView" ||
        (n.type as { name?: string })?.name === "ScrollView",
    );
    expect(scroll.length).toBeGreaterThan(0);
    const action = getByRole("link", { name: C.emergency.label });
    let node: typeof action | null = action;
    while (node && !scroll.includes(node)) node = node.parent;
    expect(node).not.toBeNull();
  });
});

describe("CrisisHelpSheet — the failure message", () => {
  it("has a polite live region mounted before any failure", () => {
    const { UNSAFE_root } = openSheet();
    expect(
      UNSAFE_root.findAll((n) => n.props.accessibilityLiveRegion === "polite").length,
    ).toBeGreaterThan(0);
  });

  it("is cleared when the sheet is opened again", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("x"));
    try {
      const view = openSheet();
      fireEvent.press(view.getByRole("link", { name: C.emergency.label }));
      await view.findByText(C.openFailed);
      fireEvent.press(view.getByRole("button", { name: C.close.accessibleName }));
      fireEvent.press(view.getByRole("button", { name: C.trigger.accessibleName }));
      expect(view.queryByText(C.openFailed)).toBeNull();
    } finally {
      openURL.mockRestore();
    }
  });
});
