// Moderation surfaces under the renderer that ships (ADR 0022, Proposed).
//
// Written FAILING before anything is built (CLAUDE.md, ADR 0013): T5, T12,
// T14, T15, T20 and T21 from plan §6, against ADR 0022's recommended option —
// inline panels and pages, no modal. Build step 4 makes them pass without
// editing them. If the founder changes ADR 0022, these change with it first.
//
// Target sizes are in tests/components/moderation-targets.test.tsx (the rn
// renderer exposes styles; jsdom has no layout). The focus ring and "no
// animation" rules are in tests/unit/moderation-ui-static.test.ts.
//
// Each test loads its component on demand through `load()`, so a missing
// component fails that test with "not built yet", not the whole file on an
// import error.

import { act, useState, type ReactElement } from "react";
import { fireEvent, within } from "@testing-library/dom";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShell } from "../../src/components/AppShell";
import { moderationUi as M } from "../shared/contracts/moderation-ui";
import { mount } from "./mount";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyComponent = (props: any) => ReactElement | null;

/** Load something build step 4 creates. Fails this test if it is missing. */
function loadModule(module: keyof typeof M.modules): Record<string, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`../../${M.modules[module]}`);
  } catch {
    throw new Error(`Not built yet (build step 4, ADR 0022): ${M.modules[module]}`);
  }
}
function load(module: keyof typeof M.modules, name: string): AnyComponent {
  const component = loadModule(module)[name];
  if (typeof component !== "function") {
    throw new Error(`${M.modules[module]} does not export ${name}`);
  }
  return component as AnyComponent;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

afterEach(() => {
  // The appeal draft store lives in memory for the app session; reset it so
  // tests do not share drafts. Nothing to do before step 4 builds it.
  try {
    const clear = loadModule("appealForm").clearAppealDrafts;
    if (typeof clear === "function") (clear as () => void)();
  } catch {
    /* not built yet */
  }
});

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

/** The app root as it will be: provider, status region, AppShell. */
function inApp(ui: ReactElement) {
  const StatusRegionProvider = load("statusRegion", "StatusRegionProvider");
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <StatusRegionProvider>
        <AppShell>{ui}</AppShell>
      </StatusRegionProvider>
    </SafeAreaProvider>
  );
}

function press(el: Element) {
  act(() => {
    fireEvent.click(el);
  });
}
async function pressAsync(el: Element) {
  await act(async () => {
    fireEvent.click(el);
  });
}
function keyDown(el: Element, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    fireEvent.keyDown(el, { key, ...init });
  });
}
function keyUp(el: Element, key: string) {
  act(() => {
    fireEvent.keyUp(el, { key });
  });
}
function type(el: Element, value: string) {
  act(() => {
    fireEvent.change(el, { target: { value } });
  });
}

/**
 * Do what a browser does when the crisis sheet's slide animation ends: its
 * dialog role, focus trap and Escape handling turn on only then (see
 * crisis-help-sheet.test.tsx, which this copies).
 */
function finishAnimations() {
  act(() => {
    for (const host of Array.from(document.body.children)) {
      const anim = host.firstElementChild;
      if (!anim) continue;
      for (const t of ["animationend", "webkitAnimationEnd"]) {
        anim.dispatchEvent(new Event(t, { bubbles: true }));
      }
    }
  });
}

/** Wait out the status region's clear-then-set gap (real timers). */
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, M.statusRegion.clearThenSetMs + 20));
  });
}

function region() {
  return document.querySelector(`[data-testid='${M.statusRegion.testID}']`);
}

/** The header crisis control is in the tree, visible to assistive technology, and in the Tab order. */
function expectCrisisReachable() {
  const header = document.querySelector("header");
  expect(header).not.toBeNull();
  const trigger = within(header as HTMLElement).queryByRole("button", { name: M.crisisTrigger });
  const fallbackLinks = within(header as HTMLElement).queryAllByRole("link");
  // Either the sheet's trigger or, if it failed to render, the fallback's links.
  const reachable = trigger ? [trigger] : fallbackLinks;
  expect(reachable.length).toBeGreaterThan(0);
  for (const el of reachable) {
    expect(el.closest("[aria-hidden='true']")).toBeNull();
    expect(el.closest("[inert]")).toBeNull();
    expect(el).toHaveAttribute("tabindex", "0");
  }
  // ADR 0022: no moderation surface is modal, so nothing makes the header inert.
  expect(document.querySelector("[aria-modal='true']")).toBeNull();
}

const reportControl = (onSubmit: () => Promise<void> = () => Promise.resolve()) => {
  const ReportControl = load("reportControl", "ReportControl");
  return <ReportControl subjectKind="post" authorName="Sam" onSubmit={onSubmit} />;
};
const openReport = (view: ReturnType<typeof mount>) => {
  const opener = view.getByRole("button", { name: M.report.opener("post", "Sam") });
  press(opener);
  return opener;
};
const reportPanel = (view: ReturnType<typeof mount>) =>
  view.getByRole("group", { name: M.report.panelHeading("post") });

// ---------------------------------------------------------------------------
// T21 — status messages through ONE root region, present before any change.
// ---------------------------------------------------------------------------
describe("T21: status messages", () => {
  it("mounts one polite status region at the root before anything happens", () => {
    mount(inApp(<></>));
    const r = region();
    expect(r).not.toBeNull();
    expect(r).toHaveAttribute("role", "status");
    expect(r).toHaveAttribute("aria-live", "polite");
    expect(r!.textContent).toBe("");
    expect(document.querySelectorAll("[role='status']")).toHaveLength(1);
  });

  it("announces the saved report in the root region, never inside the panel", async () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    press(view.getByRole("radio", { name: M.report.reasonLabel }));
    await pressAsync(view.getByRole("button", { name: M.report.send }));
    await settle();
    expect(region()).toHaveTextContent(M.report.saved);
    expect(region()!.closest("header, main, [role='group']")).toBeNull();
  });

  it("re-announces an identical message: cleared, then set after a short gap", async () => {
    jest.useFakeTimers();
    try {
      const view = mount(inApp(reportControl()));
      for (let i = 0; i < 2; i++) {
        openReport(view);
        press(view.getByRole("radio", { name: M.report.reasonLabel }));
        await pressAsync(view.getByRole("button", { name: M.report.send }));
        expect(region()!.textContent).toBe("");
        act(() => {
          jest.advanceTimersByTime(M.statusRegion.clearThenSetMs);
        });
        expect(region()).toHaveTextContent(M.report.saved);
      }
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows a failed send as an alert inside the open panel, and keeps the note", async () => {
    const view = mount(inApp(reportControl(() => Promise.reject(new Error("offline")))));
    openReport(view);
    press(view.getByRole("radio", { name: M.report.reasonLabel }));
    type(view.getByRole("textbox", { name: M.report.noteLabel }), "Please look at this.");
    await pressAsync(view.getByRole("button", { name: M.report.send }));
    expect(within(reportPanel(view)).getByRole("alert")).toHaveTextContent(M.report.failed);
    expect(view.getByRole("textbox", { name: M.report.noteLabel })).toHaveValue("Please look at this.");
  });

  it("announces 'Blocked.' even though the post (and the opener) is gone", async () => {
    const BlockControl = load("blockControl", "BlockControl");
    function Feed() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <h2 id="feed-heading" tabIndex={-1}>
            Posts
          </h2>
          {shown && (
            <BlockControl memberName="Sam" fallbackFocusId="feed-heading" onBlock={() => Promise.resolve(setShown(false))} />
          )}
        </>
      );
    }
    const view = mount(inApp(<Feed />));
    press(view.getByRole("button", { name: M.block.opener("Sam") }));
    await pressAsync(view.getByRole("button", { name: M.block.confirm }));
    await settle();
    expect(region()).toHaveTextContent(M.block.done);
  });

  it("announces the saved appeal", async () => {
    const AppealForm = load("appealForm", "AppealForm");
    const view = mount(inApp(<AppealForm actionId="a1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    type(view.getByRole("textbox", { name: M.appeal.statementLabel }), "It was on topic.");
    await pressAsync(view.getByRole("button", { name: M.appeal.submit }));
    await settle();
    expect(region()).toHaveTextContent(M.appeal.saved);
  });
});

// ---------------------------------------------------------------------------
// T20 — the inline panel contract (ADR 0022).
// ---------------------------------------------------------------------------
describe("T20: inline panel contract", () => {
  it("the opener shows the visible word Report, and its name says what is reported", () => {
    const view = mount(inApp(reportControl()));
    const opener = view.getByRole("button", { name: M.report.opener("post", "Sam") });
    expect(opener).toHaveTextContent(M.report.visible);
  });

  it("the opener says it is expanded and which panel it controls", () => {
    const view = mount(inApp(reportControl()));
    const opener = view.getByRole("button", { name: M.report.opener("post", "Sam") });
    expect(opener).toHaveAttribute("aria-expanded", "false");
    press(opener);
    expect(opener).toHaveAttribute("aria-expanded", "true");
    const panel = reportPanel(view);
    expect(panel.id).not.toBe("");
    expect(opener.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("focus moves to the panel heading itself on open", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    const heading = within(reportPanel(view)).getByRole("heading", { name: M.report.panelHeading("post") });
    expect(document.activeElement).toBe(heading);
    expect(heading).toHaveAttribute("tabindex", "-1");
  });

  it("Escape on keydown closes the panel and returns focus to the opener", () => {
    const view = mount(inApp(reportControl()));
    const opener = openReport(view);
    keyDown(document.activeElement!, "Escape");
    expect(view.queryByRole("group", { name: M.report.panelHeading("post") })).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("Escape on keyup alone does not close the panel", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    keyUp(document.activeElement!, "Escape");
    expect(reportPanel(view)).toBeInTheDocument();
  });

  it("Escape closes from the note and from a radio, too", () => {
    const view = mount(inApp(reportControl()));
    const opener = openReport(view);
    keyDown(view.getByRole("textbox", { name: M.report.noteLabel }), "Escape");
    expect(document.activeElement).toBe(opener);
    press(opener);
    keyDown(view.getByRole("radio", { name: M.report.reasonLabel }), "Escape");
    expect(document.activeElement).toBe(opener);
  });

  it("Escape during text composition (an IME) does not close the panel", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    keyDown(view.getByRole("textbox", { name: M.report.noteLabel }), "Escape", { isComposing: true });
    expect(reportPanel(view)).toBeInTheDocument();
  });

  it("Escape that closes the crisis sheet leaves the panel open and the note intact", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    type(view.getByRole("textbox", { name: M.report.noteLabel }), "Draft.");
    const header = document.querySelector("header") as HTMLElement;
    const trigger = within(header).getByRole("button", { name: M.crisisTrigger });
    press(trigger);
    finishAnimations();
    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
    // As in a browser: keydown inside the sheet, then the keyup the sheet acts on.
    keyDown(document.activeElement ?? dialog!, "Escape");
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keyup", { key: "Escape", bubbles: true }));
    });
    finishAnimations();
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(reportPanel(view)).toBeInTheDocument();
    expect(view.getByRole("textbox", { name: M.report.noteLabel })).toHaveValue("Draft.");
  });

  it("an Escape another handler already used does not close the panel", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    const note = view.getByRole("textbox", { name: M.report.noteLabel });
    const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    event.preventDefault();
    act(() => {
      note.dispatchEvent(event);
    });
    expect(reportPanel(view)).toBeInTheDocument();
  });

  it("Cancel closes and returns focus to the opener", () => {
    const view = mount(inApp(reportControl()));
    const opener = openReport(view);
    press(view.getByRole("button", { name: M.report.cancel }));
    expect(document.activeElement).toBe(opener);
  });

  it("an accidental close keeps the chosen reason and the note (SC 3.3.7)", () => {
    const view = mount(inApp(reportControl()));
    const opener = openReport(view);
    press(view.getByRole("radio", { name: M.report.reasonLabel }));
    type(view.getByRole("textbox", { name: M.report.noteLabel }), "Draft note.");
    keyDown(document.activeElement!, "Escape");
    press(opener);
    expect(view.getByRole("radio", { name: M.report.reasonLabel })).toBeChecked();
    expect(view.getByRole("textbox", { name: M.report.noteLabel })).toHaveValue("Draft note.");
  });

  it("a successful send clears the draft", async () => {
    const view = mount(inApp(reportControl()));
    const opener = openReport(view);
    press(view.getByRole("radio", { name: M.report.reasonLabel }));
    type(view.getByRole("textbox", { name: M.report.noteLabel }), "Sent note.");
    await pressAsync(view.getByRole("button", { name: M.report.send }));
    press(opener);
    expect(view.getByRole("textbox", { name: M.report.noteLabel })).toHaveValue("");
    expect(view.getByRole("radio", { name: M.report.reasonLabel })).not.toBeChecked();
  });

  it("after a successful send, focus returns to the opener, never to body", async () => {
    const view = mount(inApp(reportControl()));
    const opener = openReport(view);
    press(view.getByRole("radio", { name: M.report.reasonLabel }));
    await pressAsync(view.getByRole("button", { name: M.report.send }));
    expect(document.activeElement).toBe(opener);
  });

  it("sending with no reason shows the error, marks the group, and focuses the first radio", async () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    type(view.getByRole("textbox", { name: M.report.noteLabel }), "Kept.");
    await pressAsync(view.getByRole("button", { name: M.report.send }));
    const group = view.getByRole("radiogroup", { name: M.report.reasonsLegend });
    expect(group).toHaveAttribute("aria-invalid", "true");
    const describedBy = group.getAttribute("aria-describedby") ?? "";
    expect(describedBy).not.toBe("");
    expect(document.getElementById(describedBy.split(" ")[0])).toHaveTextContent(M.report.noReason);
    expect(document.activeElement).toBe(within(group).getAllByRole("radio")[0]);
    expect(view.getByRole("textbox", { name: M.report.noteLabel })).toHaveValue("Kept.");
  });

  it("the note has its hint as a description", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    expect(view.getByRole("textbox", { name: M.report.noteLabel })).toHaveAccessibleDescription(M.report.noteHint);
  });

  it("the reasons are a radio group with a legend", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    expect(view.getByRole("radiogroup", { name: M.report.reasonsLegend })).toBeInTheDocument();
  });

  it("two open panels have distinct ids", () => {
    const ReportControl = load("reportControl", "ReportControl");
    const view = mount(
      inApp(
        <>
          <ReportControl subjectKind="post" authorName="Sam" onSubmit={() => Promise.resolve()} />
          <ReportControl subjectKind="comment" authorName="Lee" onSubmit={() => Promise.resolve()} />
        </>,
      ),
    );
    press(view.getByRole("button", { name: M.report.opener("post", "Sam") }));
    press(view.getByRole("button", { name: M.report.opener("comment", "Lee") }));
    const a = view.getByRole("group", { name: M.report.panelHeading("post") });
    const b = view.getByRole("group", { name: M.report.panelHeading("comment") });
    expect(a.id).not.toBe(b.id);
  });

  it("Block: when the opener is gone, focus goes to the named fallback, never to body", async () => {
    const BlockControl = load("blockControl", "BlockControl");
    function Feed() {
      const [shown, setShown] = useState(true);
      return (
        <>
          <h2 id="feed-heading" tabIndex={-1}>
            Posts
          </h2>
          {shown && (
            <BlockControl memberName="Sam" fallbackFocusId="feed-heading" onBlock={() => Promise.resolve(setShown(false))} />
          )}
        </>
      );
    }
    const view = mount(inApp(<Feed />));
    press(view.getByRole("button", { name: M.block.opener("Sam") }));
    await pressAsync(view.getByRole("button", { name: M.block.confirm }));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.id).toBe("feed-heading");
  });

  it("Block: when the opener stays, focus returns to it", async () => {
    const BlockControl = load("blockControl", "BlockControl");
    const view = mount(inApp(<BlockControl memberName="Sam" fallbackFocusId="none" onBlock={() => Promise.resolve()} />));
    const opener = view.getByRole("button", { name: M.block.opener("Sam") });
    press(opener);
    await pressAsync(view.getByRole("button", { name: M.block.confirm }));
    expect(document.activeElement).toBe(opener);
  });

  it("Block: Cancel returns focus to the opener", () => {
    const BlockControl = load("blockControl", "BlockControl");
    const view = mount(inApp(<BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />));
    const opener = view.getByRole("button", { name: M.block.opener("Sam") });
    press(opener);
    press(view.getByRole("button", { name: M.block.cancel }));
    expect(document.activeElement).toBe(opener);
  });

  it("Block: says what happens in three lines, and offers only Block and Cancel (SC 3.3.8)", () => {
    const BlockControl = load("blockControl", "BlockControl");
    const view = mount(inApp(<BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />));
    press(view.getByRole("button", { name: M.block.opener("Sam") }));
    const panel = view.getByRole("group", { name: M.block.panelHeading("Sam") });
    for (const line of M.block.explanation) expect(panel).toHaveTextContent(line);
    expect(within(panel).getAllByRole("button").map((b) => b.textContent?.trim())).toEqual([M.block.confirm, M.block.cancel]);
    for (const role of ["textbox", "checkbox", "slider", "spinbutton"] as const) {
      expect(within(panel).queryByRole(role)).toBeNull();
    }
    expect(view.getByRole("button", { name: M.block.confirm })).toHaveAccessibleDescription(
      new RegExp(M.block.explanation[0]),
    );
  });

  it("Show gate: closed hides the post; Show reveals it, becomes Hide, and keeps focus", () => {
    const CrisisShowGate = load("crisisShowGate", "CrisisShowGate");
    const view = mount(inApp(<CrisisShowGate><p>ZZ-POST-TEXT</p></CrisisShowGate>));
    expect(view.container).toHaveTextContent(M.showGate.text);
    expect(view.queryByText("ZZ-POST-TEXT")).toBeNull();
    const button = view.getByRole("button", { name: M.showGate.show });
    expect(button).toHaveAttribute("aria-expanded", "false");
    act(() => button.focus()); // as a real click or keypress would
    press(button);
    expect(view.getByText("ZZ-POST-TEXT")).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveTextContent(M.showGate.hide);
    expect(document.activeElement).toBe(button);
    // The post comes after the button, in reading order.
    expect(button.compareDocumentPosition(view.getByText("ZZ-POST-TEXT")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    act(() => button.focus());
    press(button);
    expect(view.queryByText("ZZ-POST-TEXT")).toBeNull();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(button);
  });

  it("the appeal draft survives leaving the page and coming back (in memory only)", () => {
    const AppealForm = load("appealForm", "AppealForm");
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    try {
      const first = mount(inApp(<AppealForm actionId="a1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
      type(first.getByRole("textbox", { name: M.appeal.statementLabel }), "My draft.");
      first.unmount();
      const second = mount(inApp(<AppealForm actionId="a1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
      expect(second.getByRole("textbox", { name: M.appeal.statementLabel })).toHaveValue("My draft.");
      expect(setItem).not.toHaveBeenCalled();
    } finally {
      setItem.mockRestore();
    }
  });

  it("the appeal draft is cleared on sign-out, and the page says a closed app loses it", () => {
    const AppealForm = load("appealForm", "AppealForm");
    const clear = loadModule("appealForm").clearAppealDrafts as () => void;
    expect(typeof clear).toBe("function");
    const first = mount(inApp(<AppealForm actionId="s1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    expect(first.container).toHaveTextContent(M.appeal.lostOnClose);
    type(first.getByRole("textbox", { name: M.appeal.statementLabel }), "Private words.");
    first.unmount();
    act(() => clear());
    const second = mount(inApp(<AppealForm actionId="s1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    expect(second.getByRole("textbox", { name: M.appeal.statementLabel })).toHaveValue("");
  });

  it("an empty appeal says what is missing and keeps focus on the field", async () => {
    const AppealForm = load("appealForm", "AppealForm");
    const view = mount(inApp(<AppealForm actionId="e1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    await pressAsync(view.getByRole("button", { name: M.appeal.submit }));
    const field = view.getByRole("textbox", { name: M.appeal.statementLabel });
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription(new RegExp(M.appeal.empty));
    expect(document.activeElement).toBe(field);
  });

  it("the appeal warns politely at 90% and at the limit", async () => {
    const AppealForm = load("appealForm", "AppealForm");
    const view = mount(inApp(<AppealForm actionId="a2" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    type(view.getByRole("textbox", { name: M.appeal.statementLabel }), "x".repeat(M.appeal.warnAt));
    await settle();
    expect(region()).toHaveTextContent(M.appeal.charsLeft(M.appeal.maxChars - M.appeal.warnAt));
    type(view.getByRole("textbox", { name: M.appeal.statementLabel }), "x".repeat(M.appeal.maxChars));
    await settle();
    expect(region()).toHaveTextContent(M.appeal.charsLeft(0));
  });

  it("no moderation panel is modal", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    expect(document.querySelector("[aria-modal='true']")).toBeNull();
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T5 — the crisis control survives every moderation state built in step 4.
// Locked thread and muted post: step 4 (with PostCard and muted words).
// Public log and floor pages: step 6. Each adds its case here (ADR 0022).
// ---------------------------------------------------------------------------
describe("T5: the crisis control in every moderation state", () => {
  it("with the Report panel open", () => {
    const view = mount(inApp(reportControl()));
    openReport(view);
    expectCrisisReachable();
  });

  it("with the Block panel open", () => {
    const BlockControl = load("blockControl", "BlockControl");
    const view = mount(inApp(<BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />));
    press(view.getByRole("button", { name: M.block.opener("Sam") }));
    expectCrisisReachable();
  });

  it("on the appeal page, gate unmet and met", () => {
    const AppealForm = load("appealForm", "AppealForm");
    for (const G2 of ["unmet", "met"] as const) {
      const view = mount(inApp(<AppealForm actionId="a3" gates={{ G1: "unmet", G2 }} onSubmit={() => Promise.resolve()} />));
      expectCrisisReachable();
      view.unmount();
    }
  });

  it("with a removal notice shown, to the author and to others", () => {
    const RemovalNotice = load("removalNotice", "RemovalNotice");
    for (const viewer of ["author", "other"] as const) {
      const view = mount(inApp(<RemovalNotice viewer={viewer} floorItemText="Dangerous medical misinformation" crisis={false} onAskAgain={() => {}} />));
      expectCrisisReachable();
      view.unmount();
    }
  });

  it("with the Show gate closed and open", () => {
    const CrisisShowGate = load("crisisShowGate", "CrisisShowGate");
    const view = mount(inApp(<CrisisShowGate><p>post text</p></CrisisShowGate>));
    expectCrisisReachable();
    press(view.getByRole("button", { name: M.showGate.show }));
    expectCrisisReachable();
  });

  it("on the moderator console, with an item open", () => {
    const ModeratorConsole = load("moderatorConsole", "ModeratorConsole");
    const view = mount(inApp(<ModeratorConsole items={[queueItem(1)]} onAction={() => Promise.resolve()} />));
    press(view.getAllByRole("button", { name: new RegExp(`^${M.queue.open}`) })[0]);
    expectCrisisReachable();
  });

  it("with the post-submit crisis panel shown", () => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    expectCrisisReachable();
  });

  it("with a panel open while the crisis sheet fails to render: the fallback links stay in the header", () => {
    // Panels never animate, so they never call useReducedMotion (ADR 0022);
    // the crisis sheet does. Making it throw breaks only the sheet.
    const quiet = jest.spyOn(console, "error").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const motion = require("../../src/hooks/useReducedMotion");
    const broken = jest.spyOn(motion, "useReducedMotion").mockImplementation(() => {
      throw new Error("sheet failed to render");
    });
    try {
      const view = mount(inApp(reportControl()));
      openReport(view);
      expectCrisisReachable();
      const header = document.querySelector("header") as HTMLElement;
      expect(header.textContent).toContain("988");
      expect(within(header).queryByRole("button", { name: M.crisisTrigger })).toBeNull();
    } finally {
      broken.mockRestore();
      quiet.mockRestore();
    }
  });

  it("crisis adjacency: a removal notice for a crisis post carries 988 in its own block", () => {
    const RemovalNotice = load("removalNotice", "RemovalNotice");
    const view = mount(inApp(<RemovalNotice viewer="author" floorItemText="Dangerous medical misinformation" crisis={true} onAskAgain={() => {}} />));
    const notice = view.getByRole("group", { name: M.removal.noticeLabel });
    expect(notice.closest("header")).toBeNull();
    expect(notice).toHaveTextContent(M.removal.author);
    const hrefs = Array.from(notice.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining([M.crisisAdjacency.call988, M.crisisAdjacency.text988]));
  });

  it("a removal notice for a non-crisis post carries no 988 block", () => {
    const RemovalNotice = load("removalNotice", "RemovalNotice");
    const view = mount(inApp(<RemovalNotice viewer="author" floorItemText="Dangerous medical misinformation" crisis={false} onAskAgain={() => {}} />));
    const notice = view.getByRole("group", { name: M.removal.noticeLabel });
    expect(notice.querySelector(`a[href='${M.crisisAdjacency.call988}']`)).toBeNull();
  });

  it("'Ask us to look again' calls back", () => {
    const RemovalNotice = load("removalNotice", "RemovalNotice");
    const onAskAgain = jest.fn();
    const view = mount(inApp(<RemovalNotice viewer="author" floorItemText="x" crisis={false} onAskAgain={onAskAgain} />));
    press(view.getByRole("button", { name: M.removal.askAgain }));
    expect(onAskAgain).toHaveBeenCalledTimes(1);
  });

  it("others see 'Removed' as a list item with text, and never the rule", () => {
    const RemovalNotice = load("removalNotice", "RemovalNotice");
    const view = mount(inApp(<RemovalNotice viewer="other" floorItemText="ZZ-FLOOR-ITEM" crisis={false} onAskAgain={() => {}} />));
    expect(view.getByRole("listitem")).toHaveTextContent(M.removal.other);
    expect(document.body.textContent).not.toContain("ZZ-FLOOR-ITEM");
  });

  it("the appeal page promises nothing while G2 is unmet", () => {
    const AppealForm = load("appealForm", "AppealForm");
    const view = mount(inApp(<AppealForm actionId="a4" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    expect(view.getByRole("heading", { name: M.appeal.heading, level: 1 })).toBeInTheDocument();
    expect(view.container).toHaveTextContent(M.appeal.panelUnmet);
  });

  it("the contact link sits in the same place on every surface (SC 3.2.6)", () => {
    const surfaces: Array<() => ReactElement> = [
      () => reportControl(),
      () => {
        const BlockControl = load("blockControl", "BlockControl");
        return <BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />;
      },
      () => {
        const AppealForm = load("appealForm", "AppealForm");
        return <AppealForm actionId="a5" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />;
      },
      () => {
        const ModeratorConsole = load("moderatorConsole", "ModeratorConsole");
        return <ModeratorConsole items={[]} onAction={() => Promise.resolve()} />;
      },
      () => {
        const RemovalNotice = load("removalNotice", "RemovalNotice");
        return <RemovalNotice viewer="author" floorItemText="x" crisis={false} onAskAgain={() => {}} />;
      },
    ];
    for (const make of surfaces) {
      const view = mount(inApp(make()));
      const footer = view.getByRole(M.contact.landmark);
      expect(within(footer).getAllByRole("link", { name: M.contact.label })).toHaveLength(1);
      expect(view.getAllByRole("link", { name: M.contact.label })).toHaveLength(1);
      view.unmount();
    }
  });
});

// ---------------------------------------------------------------------------
// T12 — crisis resources shown at once to the author, whatever the gate.
// ---------------------------------------------------------------------------
describe("T12: post-submit crisis resources", () => {
  const C = M.postSubmitCrisis;
  const realFetch = globalThis.fetch;

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    globalThis.fetch = realFetch;
  });

  it.each(["unmet", "met"] as const)("shows tap-to-act 988 and emergency links on first render (G1 %s)", (G1) => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const view = mount(inApp(<PostSubmitCrisisPanel gates={{ G1 }} />));
    for (const action of [C.call988, C.text988, C.emergency]) {
      expect(view.getByRole("link", { name: action.label })).toHaveAttribute("href", action.url);
    }
    expect(view.getByRole("link", { name: C.otherCountry.label })).toHaveAttribute("href", C.otherCountry.href);
  });

  it("takes focus on its heading when it appears", () => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const view = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    expect(document.activeElement).toBe(view.getByRole("heading", { name: C.heading }));
  });

  it("is not an alert or a live region (focus already reads it; no double announcement)", () => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const view = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    const heading = view.getByRole("heading", { name: C.heading });
    expect(heading.closest("[role='alert'], [aria-live]")).toBeNull();
  });

  it("is never timed or auto-dismissed", () => {
    jest.useFakeTimers();
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const view = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    act(() => {
      jest.advanceTimersByTime(60 * 60 * 1000);
    });
    expect(view.getByRole("heading", { name: C.heading })).toBeInTheDocument();
  });

  it("says nobody will contact them only while G1 is unmet", () => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const unmet = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    expect(unmet.container).toHaveTextContent(C.nobodyWillContact);
    unmet.unmount();
    const met = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "met" }} />));
    expect(met.container).not.toHaveTextContent(C.nobodyWillContact);
  });

  it("sends nothing and stores nothing, even when a link is used", () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    const cookieBefore = document.cookie;
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const view = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    press(view.getByRole("link", { name: C.otherCountry.label }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe(cookieBefore);
  });

  it("any external link opens with noopener noreferrer", () => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    const view = mount(inApp(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
    const links = view.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(4);
    for (const a of links) {
      if (/^https?:/.test(a.getAttribute("href") ?? "")) {
        expect(a.getAttribute("rel") ?? "").toMatch(/noopener/);
        expect(a.getAttribute("rel") ?? "").toMatch(/noreferrer/);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// T15 — Realtime never steals focus or reorders.
// ---------------------------------------------------------------------------
function queueItem(n: number) {
  return {
    id: `item-${n}`,
    category: `Possible dangerous medical misinformation ${n}`,
    tierLabel: "Safety floor (Tier 3)",
    ageText: `waiting ${n} hours`,
  };
}
type Item = ReturnType<typeof queueItem>;

describe("T15: the queue under Realtime", () => {
  /** A queue fed by "Realtime": the test changes its items from outside. */
  function liveQueue(initial: Item[], which: "moderationQueue" | "moderatorConsole" = "moderationQueue") {
    const Queue = load(which, which === "moderationQueue" ? "ModerationQueue" : "ModeratorConsole");
    let setItems: (f: (xs: Item[]) => Item[]) => void = () => {};
    function Live() {
      const [items, set] = useState(initial);
      setItems = set;
      return <Queue items={items} onAction={() => Promise.resolve()} />;
    }
    const view = mount(inApp(<Live />));
    const opens = () => view.getAllByRole("button", { name: new RegExp(`^${M.queue.open}`) });
    const update = (f: (xs: Item[]) => Item[]) => act(() => setItems(f));
    return { view, opens, update };
  }

  it("keeps focus when another reviewer handles a different item", () => {
    const { opens, update } = liveQueue([queueItem(1), queueItem(2), queueItem(3), queueItem(4)]);
    act(() => opens()[2].focus());
    const focused = document.activeElement;
    update((xs) => xs.filter((x) => x.id !== "item-1"));
    expect(document.activeElement).toBe(focused);
  });

  it("when the focused item is handled elsewhere, says so and moves focus to the next item, never body", async () => {
    const { opens, update } = liveQueue([queueItem(1), queueItem(2), queueItem(3), queueItem(4)]);
    act(() => opens()[2].focus());
    update((xs) => xs.filter((x) => x.id !== "item-3"));
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(opens()[2]);
    await settle();
    expect(region()).toHaveTextContent(M.queue.handled);
  });

  it("keeps a typed reason when the open item is handled elsewhere", async () => {
    const { view, opens, update } = liveQueue([queueItem(1), queueItem(2)], "moderatorConsole");
    press(opens()[0]);
    type(view.getByRole("textbox", { name: M.console.reasonLabel }), "My reason.");
    update((xs) => xs.filter((x) => x.id !== "item-1"));
    expect(view.getByRole("textbox", { name: M.console.reasonLabel })).toHaveValue("My reason.");
    await settle();
    expect(region()).toHaveTextContent(M.queue.handled);
  });

  it("inserts new items only when the moderator chooses Show, announcing a count, not each one", async () => {
    const { view, opens, update } = liveQueue([queueItem(1), queueItem(2), queueItem(3)]);
    act(() => opens()[2].focus());
    const focused = document.activeElement;
    const orderBefore = opens().map((b) => b.closest("li")?.textContent);

    update((xs) => [queueItem(7), ...xs]);
    update((xs) => [queueItem(8), ...xs]);
    update((xs) => [queueItem(9), ...xs]);

    expect(document.activeElement).toBe(focused);
    expect(opens().map((b) => b.closest("li")?.textContent)).toEqual(orderBefore);
    await settle();
    expect(region()!.textContent).toBe("3 new items");
    const show = view.getByRole("button", { name: M.queue.newItems(3) });
    act(() => show.focus());
    press(show);
    expect(opens()).toHaveLength(6);
    // ADR 0022: after Show, focus moves to the first new item's Open button.
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(opens()[0]);
    expect(opens()[0].closest("li")).toHaveTextContent(queueItem(9).category);
  });

  it("offers 'Pause live updates', and while paused announces nothing", async () => {
    const { view, update } = liveQueue([queueItem(1)]);
    const pause = view.getByRole("button", { name: M.queue.pause });
    press(pause);
    expect(pause).toHaveAttribute("aria-pressed", "true");
    update((xs) => [queueItem(2), ...xs]);
    await settle();
    expect(region()!.textContent).toBe("");
    // Control: un-paused, the same wait does show the count, so the empty
    // region above is the pause working, not the wait being too short.
    press(pause);
    expect(pause).toHaveAttribute("aria-pressed", "false");
    update((xs) => [queueItem(3), ...xs]);
    await settle();
    expect(region()!.textContent).not.toBe("");
  });

  it("shows age as static text and never a reporter, note or count", () => {
    const ModerationQueue = load("moderationQueue", "ModerationQueue");
    const view = mount(inApp(<ModerationQueue items={[queueItem(3)]} />));
    expect(view.container).toHaveTextContent("waiting 3 hours");
    expect(view.container.textContent ?? "").not.toMatch(/reporter|\d+ reports?|reports? \(\d/i);
  });
});

// ---------------------------------------------------------------------------
// T14 — axe on every new surface and state, plus the console's landmarks and
// skip link. axe runs on the whole document so page-level rules apply.
// ---------------------------------------------------------------------------
describe("T14: axe and console structure", () => {
  // Two rules are off, both because jsdom has no layout: color-contrast
  // (checked in tests/unit/contrast.test.ts) and target-size (checked in
  // tests/components/moderation-targets.test.tsx). Every other rule, page-level
  // ones included, stays on.
  beforeAll(() => {
    // jsdom starts with no lang and no title; a real page has both.
    document.documentElement.lang = "en";
    document.title = "OneRhythm test page";
  });

  /**
   * A non-page surface sits inside a page; give it the page's h1. The page's
   * one main comes from AppShell (a11y follow-up 1, founder 2026-10-30), so a
   * second one here would be a duplicate main, which axe still checks for.
   */
  const inPage = (ui: ReactElement) => (
    <>
      <h1>Test page</h1>
      {ui}
    </>
  );

  async function axeViolations() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axe = require("axe-core");
    const result = await axe.run(document, {
      rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
    });
    return result.violations.map((v: { id: string; nodes: unknown[] }) => `${v.id} (${v.nodes.length})`);
  }

  const states: Array<[string, () => Promise<void> | void]> = [
    ["Report panel open", () => {
      const view = mount(inApp(inPage(reportControl())));
      openReport(view);
    }],
    ["Report panel after a failed send", async () => {
      const view = mount(inApp(inPage(reportControl(() => Promise.reject(new Error("offline"))))));
      openReport(view);
      press(view.getByRole("radio", { name: M.report.reasonLabel }));
      await pressAsync(view.getByRole("button", { name: M.report.send }));
    }],
    ["Report panel with the no-reason error", async () => {
      const view = mount(inApp(inPage(reportControl())));
      openReport(view);
      await pressAsync(view.getByRole("button", { name: M.report.send }));
    }],
    ["Block panel open", () => {
      const BlockControl = load("blockControl", "BlockControl");
      const view = mount(inApp(inPage(<BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />)));
      press(view.getByRole("button", { name: M.block.opener("Sam") }));
    }],
    ["Removal notice, author, crisis", () => {
      const RemovalNotice = load("removalNotice", "RemovalNotice");
      mount(inApp(inPage(<RemovalNotice viewer="author" floorItemText="Dangerous medical misinformation" crisis={true} onAskAgain={() => {}} />)));
    }],
    ["Removal notice, other members", () => {
      const RemovalNotice = load("removalNotice", "RemovalNotice");
      mount(inApp(inPage(<ul><RemovalNotice viewer="other" floorItemText="x" crisis={false} onAskAgain={() => {}} /></ul>)));
    }],
    ["Appeal page, G2 unmet", () => {
      const AppealForm = load("appealForm", "AppealForm");
      mount(inApp(<AppealForm actionId="a6" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    }],
    ["Appeal page, G2 met", () => {
      const AppealForm = load("appealForm", "AppealForm");
      mount(inApp(<AppealForm actionId="a7" gates={{ G1: "met", G2: "met" }} onSubmit={() => Promise.resolve()} />));
    }],
    ["Show gate, open", () => {
      const CrisisShowGate = load("crisisShowGate", "CrisisShowGate");
      const view = mount(inApp(inPage(<CrisisShowGate><p>post text</p></CrisisShowGate>)));
      press(view.getByRole("button", { name: M.showGate.show }));
    }],
    ["Post-submit crisis panel", () => {
      const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
      mount(inApp(inPage(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />)));
    }],
    ["Console with items, one open, new items waiting", () => {
      const ModeratorConsole = load("moderatorConsole", "ModeratorConsole");
      let push: () => void = () => {};
      function Live() {
        const [items, set] = useState([queueItem(1), queueItem(2), queueItem(3)]);
        push = () => set((xs) => [queueItem(4), ...xs]);
        return <ModeratorConsole items={items} onAction={() => Promise.resolve()} />;
      }
      const view = mount(inApp(<Live />));
      press(view.getAllByRole("button", { name: new RegExp(`^${M.queue.open}`) })[0]);
      act(() => push());
    }],
  ];

  it.each(states)("%s: no axe violations", async (_name, setUp) => {
    await setUp();
    expect(await axeViolations()).toEqual([]);
  });

  it("the console has navigation and main landmarks, and a working skip link first", () => {
    const ModeratorConsole = load("moderatorConsole", "ModeratorConsole");
    const view = mount(inApp(<ModeratorConsole items={[queueItem(1)]} onAction={() => Promise.resolve()} />));
    expect(view.getByRole("navigation", { name: M.console.navLabel })).toBeInTheDocument();
    const main = view.getByRole("main");
    expect(main.id).not.toBe("");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(within(main).getByRole("heading", { name: M.queue.heading })).toBeInTheDocument();
    const skip = view.getByRole("link", { name: M.console.skipLink });
    const focusables = Array.from(
      view.container.querySelectorAll<HTMLElement>("a[href], button, [tabindex='0']"),
    ).filter((el) => !el.closest("header"));
    expect(focusables[0]).toBe(skip);
    expect(skip.getAttribute("href")).toBe(`#${main.id}`);
    press(skip);
    expect(document.activeElement).toBe(main);
  });
});
