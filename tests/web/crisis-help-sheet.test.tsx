// The crisis affordance, under the renderer that ships.
//
// This surface already had one silent hiding failure on web (the 🆘 in the
// sheet title). a11y.md is explicit that a silent failure here is a SAFETY
// incident, not a UI bug — so it is the first surface to get a DOM-level test.

import { act } from "react";
import { within } from "@testing-library/dom";
import { Linking } from "react-native";
import {
  CrisisHelpBoundary,
  CrisisHelpSheet,
} from "../../src/components/CrisisHelpSheet";
import { AppShell } from "../../src/components/AppShell";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { crisisHelpSheet as C } from "../shared/contracts/crisis-help-sheet";
import { mount } from "./mount";

/**
 * Open the sheet and return queries over the WHOLE document.
 *
 * react-native-web's <Modal> renders through a portal appended to
 * document.body, not into the mount container — so container-scoped queries
 * find the trigger and nothing else. Worth stating out loud: this is also why
 * the sheet has no dialog semantics or focus trap here (see the nativeOnly
 * field in the contract).
 */
function open(view: ReturnType<typeof mount>) {
  act(() => {
    view
      .getByLabelText(C.trigger.accessibleName)
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  finishAnimations();
  return within(document.body);
}

/**
 * Do what a browser does when the sheet's slide animation ends.
 *
 * react-native-web's <Modal> only turns on role="dialog", its focus trap and
 * Escape-to-close in its onShow, which runs on the `animationend` event (or at
 * once when animationType is "none", i.e. under reduced motion). jsdom runs no
 * CSS animations, so it never fires that event. Without this, every dialog
 * assertion would be testing jsdom, not the component. React's listener name
 * depends on vendor-prefix detection, so both spellings are sent; the Modal
 * ignores an event that is not aimed at its own animation element.
 */
function finishAnimations() {
  act(() => {
    for (const host of Array.from(document.body.children)) {
      const anim = host.firstElementChild;
      if (!anim) continue;
      for (const type of ["animationend", "webkitAnimationEnd"]) {
        anim.dispatchEvent(new Event(type, { bubbles: true }));
      }
    }
  });
}

describe("crisis trigger", () => {
  it("renders icon AND text, never icon alone", () => {
    const { container, getByText } = mount(<CrisisHelpSheet />);
    expect(getByText(C.trigger.label)).toBeInTheDocument();
    expect(container.textContent).toContain(C.trigger.glyph);
  });

  it("announces without the glyph in its accessible name", () => {
    const { getByLabelText } = mount(<CrisisHelpSheet />);
    const trigger = getByLabelText(C.trigger.accessibleName);
    expect(trigger).toHaveAttribute("aria-label", C.trigger.accessibleName);
    expect(trigger.getAttribute("aria-label")).not.toContain(C.trigger.glyph);
  });

  it("is a real button in the Tab order", () => {
    const { getByLabelText } = mount(<CrisisHelpSheet />);
    const trigger = getByLabelText(C.trigger.accessibleName);
    expect(trigger).toHaveAttribute("role", "button");
    expect(trigger).not.toHaveAttribute("disabled");
    expect(trigger).toHaveAttribute("tabindex", "0");
  });
});

describe("crisis sheet contents", () => {
  it("gives emergency guidance first, then peer-support framing", () => {
    const sheet = open(mount(<CrisisHelpSheet />));

    const text = document.body.textContent ?? "";
    for (const line of C.body) expect(text).toContain(line);
    expect(text).toContain(C.disclaimer);

    // Order matters: emergency services before "peer support".
    expect(text.indexOf(C.body[0])).toBeLessThan(text.indexOf(C.disclaimer));
    expect(sheet.getByText(C.body[0])).toBeInTheDocument();
  });

  it("does not speak the glyph in the title", () => {
    // The original web defect: importantForAccessibility is dropped by RNW's
    // <Text> allowlist in silence, so the glyph was announced. The fix puts an
    // explicit accessibilityLabel on the PARENT, which overrides the subtree.
    const sheet = open(mount(<CrisisHelpSheet />));

    // The trigger carries the SAME accessible name (correctly — it must also
    // not speak the glyph), so select the sheet title by its element: RNW
    // renders <Text> as a div, and the trigger Pressable as a button.
    const titles = sheet.getAllByLabelText(C.title.accessibleName);
    const title = titles.find((el) => el.tagName === "DIV");
    expect(title).toBeDefined();
    expect(title).toHaveTextContent(C.title.visibleText);
    expect(title!.getAttribute("aria-label")).toBe(C.title.accessibleName);
    expect(title!.getAttribute("aria-label")).not.toContain(C.trigger.glyph);
  });

  it("offers the crisis resource as a link control", () => {
    const sheet = open(mount(<CrisisHelpSheet />));

    const link = sheet.getByText(C.resource.text);
    expect(link).toBeInTheDocument();
    expect(link.closest(`[role="${C.webOnly.resourceRole}"]`)).not.toBeNull();
  });

  it("offers a close control with an accessible name", () => {
    const sheet = open(mount(<CrisisHelpSheet />));
    expect(sheet.getByLabelText(C.close.accessibleName)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Build step 0 (plan §10 step 0, §5.1), under the renderer that ships.
// ---------------------------------------------------------------------------

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function dialog(): HTMLElement {
  const d = document.body.querySelector<HTMLElement>(`[role="${C.webOnlyDialog.role}"]`);
  if (!d) throw new Error("no dialog in the document");
  return d;
}

/** The element whose aria-labelledby/aria-label names `el`, resolved. */
function accessibleNameOf(el: HTMLElement): string {
  const ids = el.getAttribute("aria-labelledby");
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => {
        const ref = document.getElementById(id);
        return ref?.getAttribute("aria-label") ?? ref?.textContent ?? "";
      })
      .join(" ");
  }
  return el.getAttribute("aria-label") ?? "";
}

describe("crisis sheet — tap-to-act actions", () => {
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
  ])("%s is a focusable link control that opens %s", (label, url) => {
    const sheet = open(mount(<CrisisHelpSheet />));
    const action = sheet.getByText(label).closest<HTMLElement>('[role="link"]');
    expect(action).not.toBeNull();
    expect(action).toHaveAttribute("tabindex", "0");
    expect(action!.closest('[aria-hidden="true"]')).toBeNull();
    click(action!);
    expect(openURL).toHaveBeenCalledWith(url);
  });

  it("lists the crisis actions in reading order, emergency first", () => {
    open(mount(<CrisisHelpSheet />));
    const names = Array.from(dialog().querySelectorAll('[role="link"]')).map(
      (el) => el.textContent,
    );
    expect(names).toEqual(C.actionOrder);
  });

  it("keeps the 988 copy and its call/text actions in one block", () => {
    const sheet = open(mount(<CrisisHelpSheet />));
    const block = sheet.getByText(C.lifeline.text).parentElement!;
    expect(within(block).getByText(C.lifeline.call.label)).toBeInTheDocument();
    expect(within(block).getByText(C.lifeline.sms.label)).toBeInTheDocument();
  });
});

describe("crisis sheet — dialog contract", () => {
  it("is a modal dialog named by its title, without the glyph", () => {
    open(mount(<CrisisHelpSheet />));
    const d = dialog();
    expect(d).toHaveAttribute("aria-modal", C.webOnlyDialog.ariaModal);
    expect(accessibleNameOf(d)).toBe(C.dialog.accessibleName);
  });

  it("moves focus into the sheet on open, onto its title", () => {
    open(mount(<CrisisHelpSheet />));
    expect(dialog().contains(document.activeElement)).toBe(true);
    const titleId = dialog().getAttribute("aria-labelledby")!;
    expect(document.activeElement).toBe(document.getElementById(titleId));
  });

  it("does not put focus on a call action first (no accidental call)", () => {
    open(mount(<CrisisHelpSheet />));
    expect(document.activeElement?.getAttribute("role")).not.toBe("link");
  });

  it("returns focus to the trigger on close", () => {
    const view = mount(<CrisisHelpSheet />);
    const sheet = open(view);
    click(sheet.getByLabelText(C.close.accessibleName));
    finishAnimations(); // the slide-out, as in a browser
    expect(document.activeElement).toBe(
      view.getByLabelText(C.trigger.accessibleName),
    );
  });

  it("closes on Escape and returns focus to the trigger", () => {
    const view = mount(<CrisisHelpSheet />);
    open(view);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keyup", { key: "Escape", bubbles: true }),
      );
    });
    finishAnimations(); // the slide-out, as in a browser
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(
      view.getByLabelText(C.trigger.accessibleName),
    );
  });
});

describe("crisis help — render-failure fallback", () => {
  function Broken(): never {
    throw new Error("sheet failed to render");
  }

  it("shows plain crisis text and tap-to-act numbers if the sheet throws", () => {
    const quiet = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const view = mount(
        <CrisisHelpBoundary>
          <Broken />
        </CrisisHelpBoundary>,
      );
      expect(view.getByText(C.fallback.text)).toBeInTheDocument();
      for (const a of C.fallback.actions) {
        const link = view.getByText(a.label).closest('[role="link"]');
        expect(link).not.toBeNull();
        expect(link).toHaveAttribute("tabindex", "0");
      }
    } finally {
      quiet.mockRestore();
    }
  });
});

describe("AppShell header", () => {
  it("is a banner landmark holding the crisis trigger", () => {
    // AppShell uses SafeAreaView, which needs the provider the app root has.
    const view = mount(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 400, height: 800 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <AppShell>
          <></>
        </AppShell>
      </SafeAreaProvider>,
    );
    const banner =
      view.container.querySelector("header") ??
      view.container.querySelector('[role="banner"]');
    expect(banner).not.toBeNull();
    expect(
      within(banner as HTMLElement).getByLabelText(C.trigger.accessibleName),
    ).toBeInTheDocument();
  });
});
