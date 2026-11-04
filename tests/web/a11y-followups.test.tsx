// The four a11y items left open by the step 4 review (PR #12), web half.
// Written FAILING first (CLAUDE.md, ADR 0013); founder decision 2026-10-30.
//
//   1. Exactly one `main` landmark per screen, provided by AppShell.
//   2. Visible, programmatically associated labels on the report note and
//      the appeal field. A placeholder or an aria-label alone is not a label.
//   3. Old status messages are cleared before new ones, and on navigation.
//   4. Native focus moves are in tests/components/native-focus.test.tsx.

import { act, type ReactElement } from "react";
import { fireEvent } from "@testing-library/dom";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShell } from "../../src/components/AppShell";
import { StatusRegionProvider, useAnnounce } from "../../src/components/StatusRegion";
import { ReportControl } from "../../src/components/moderation/ReportControl";
import { AppealForm, clearAppealDrafts } from "../../src/components/moderation/AppealForm";
import { moderationUi as M } from "../shared/contracts/moderation-ui";
import { mount } from "./mount";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function inApp(ui: ReactElement, resetKey?: string) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <StatusRegionProvider resetKey={resetKey}>
        <AppShell>{ui}</AppShell>
      </StatusRegionProvider>
    </SafeAreaProvider>
  );
}

const region = () => document.querySelector(`[data-testid='${M.statusRegion.testID}']`) as HTMLElement;
async function wait(ms: number) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

afterEach(() => clearAppealDrafts());

describe("1. one main landmark, from AppShell", () => {
  it("AppShell renders exactly one main, focusable by script, holding the screen", () => {
    const view = mount(inApp(<p>screen body</p>));
    const mains = document.querySelectorAll("main, [role='main']");
    expect(mains).toHaveLength(1);
    const main = view.getByRole("main");
    expect(main.id).not.toBe("");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveTextContent("screen body");
    // The header (crisis control) and footer (contact, status) sit outside it.
    expect(main.querySelector("header")).toBeNull();
    expect(main.closest("header, footer")).toBeNull();
    expect(main.contains(region())).toBe(false);
  });

  it("a moderation page under AppShell still has exactly one main", () => {
    mount(inApp(<AppealForm actionId="m1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    expect(document.querySelectorAll("main, [role='main']")).toHaveLength(1);
  });
});

describe("2. visible labels on the report note and the appeal field", () => {
  function expectVisibleLabel(box: HTMLElement, text: string) {
    // Named by visible text on the page, not by aria-label or a placeholder.
    expect(box).not.toHaveAttribute("aria-label");
    const ids = (box.getAttribute("aria-labelledby") ?? "").split(" ").filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);
    const label = document.getElementById(ids[0]);
    expect(label).not.toBeNull();
    expect(label).toHaveTextContent(text);
    expect(label!.closest("[aria-hidden='true'], [hidden]")).toBeNull();
    // The label comes before the field, so it is seen (and read) first.
    expect(label!.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const placeholder = box.getAttribute("placeholder");
    if (placeholder) expect(placeholder).not.toBe(text);
  }

  it("the report note", () => {
    const view = mount(inApp(<ReportControl subjectKind="post" authorName="Sam" onSubmit={() => Promise.resolve()} />));
    act(() => {
      fireEvent.click(view.getByRole("button", { name: M.report.opener("post", "Sam") }));
    });
    const box = view.getByRole("textbox", { name: M.report.noteLabel });
    expectVisibleLabel(box, M.report.noteLabel);
    // The hint stays a description, separate from the name.
    expect(box.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("the appeal field", () => {
    const view = mount(inApp(<AppealForm actionId="m2" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    expectVisibleLabel(view.getByRole("textbox", { name: M.appeal.statementLabel }), M.appeal.statementLabel);
  });
});

describe("3. old status messages are cleared", () => {
  function Announcer({ say }: { say: string }) {
    const announce = useAnnounce();
    return (
      <button type="button" onClick={() => announce(say)}>
        say
      </button>
    );
  }

  it("a new message empties the region first, then sets the new text", async () => {
    const view = mount(inApp(<Announcer say="Second." />));
    act(() => {
      fireEvent.click(view.getByRole("button", { name: "say" }));
    });
    await wait(M.statusRegion.clearThenSetMs + 20);
    expect(region()).toHaveTextContent("Second.");
    act(() => {
      fireEvent.click(view.getByRole("button", { name: "say" }));
    });
    expect(region().textContent).toBe("");
    await wait(M.statusRegion.clearThenSetMs + 20);
    expect(region()).toHaveTextContent("Second.");
  });

  it("moving to another screen clears a message left from the last one", async () => {
    let render: (key: string) => void = () => {};
    function Harness() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const [key, setKey] = require("react").useState("/posts/1");
      render = setKey;
      return inApp(<Announcer say="Blocked." />, key);
    }
    const view = mount(<Harness />);
    act(() => {
      fireEvent.click(view.getByRole("button", { name: "say" }));
    });
    await wait(M.statusRegion.clearThenSetMs + 20);
    expect(region()).toHaveTextContent("Blocked.");
    act(() => render("/feed"));
    expect(region().textContent).toBe("");
  });

  it("a message still waiting to be set is dropped when the screen changes", async () => {
    let render: (key: string) => void = () => {};
    function Harness() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const [key, setKey] = require("react").useState("/posts/1");
      render = setKey;
      return inApp(<Announcer say="Blocked." />, key);
    }
    const view = mount(<Harness />);
    act(() => {
      fireEvent.click(view.getByRole("button", { name: "say" }));
    });
    act(() => render("/feed"));
    await wait(M.statusRegion.clearThenSetMs + 20);
    expect(region().textContent).toBe("");
  });
});
