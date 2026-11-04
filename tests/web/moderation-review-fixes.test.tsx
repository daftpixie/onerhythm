// Review round 1 on build step 4 (a11y, privacy, governance), pinned before
// the fixes. Under the renderer that ships.
import { act } from "react";
import { fireEvent } from "@testing-library/dom";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShell } from "../../src/components/AppShell";
import { StatusRegionProvider } from "../../src/components/StatusRegion";
import { AppealForm } from "../../src/components/moderation/AppealForm";
import { MutedWordsSettings } from "../../src/components/moderation/MutedWordsSettings";
import { RemovalNotice } from "../../src/components/moderation/RemovalNotice";
import { ReportControl } from "../../src/components/moderation/ReportControl";
import { mount } from "./mount";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
const inApp = (ui: React.ReactElement) => (
  <SafeAreaProvider initialMetrics={METRICS}>
    <StatusRegionProvider>
      <AppShell>{ui}</AppShell>
    </StatusRegionProvider>
  </SafeAreaProvider>
);
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 150));
  });
}

describe("governance: no copy promises an answer while the gates are unmet (ADR 0021 §2)", () => {
  it.each([
    [1, { G1: "unmet", G2: "unmet" }],
    [3, { G1: "unmet", G2: "unmet" }],
  ] as const)("tier %s, gates unmet: no 'you'll see the answer', and it says we can't say when", (tier, gates) => {
    const view = mount(inApp(<AppealForm actionId={`g${tier}`} tier={tier} gates={gates} onSubmit={() => Promise.resolve()} />));
    expect(view.container.textContent ?? "").not.toMatch(/see the answer/i);
    expect(view.container).toHaveTextContent(/can't say when/);
  });
});

describe("a11y: focus is never lost to body", () => {
  it("after a successful appeal Send, focus lands on the saved message", async () => {
    const view = mount(inApp(<AppealForm actionId="f1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
    const field = view.getByRole("textbox", { name: "What should we know?" });
    act(() => {
      fireEvent.change(field, { target: { value: "Please look again." } });
    });
    await act(async () => {
      fireEvent.click(view.getByRole("button", { name: "Send" }));
    });
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toHaveTextContent("Your request is saved.");
  });

  it("after removing a muted word, focus goes to the word field", async () => {
    const view = mount(inApp(<MutedWordsSettings />));
    await settle();
    act(() => {
      fireEvent.change(view.getByRole("textbox", { name: "A word or phrase to hide" }), { target: { value: "zzword" } });
    });
    await act(async () => {
      fireEvent.click(view.getByRole("button", { name: "Add" }));
    });
    await settle();
    const remove = view.getByRole("button", { name: "Remove 'zzword'" });
    act(() => remove.focus());
    await act(async () => {
      fireEvent.click(remove);
    });
    await settle();
    expect(document.activeElement).toBe(view.getByRole("textbox", { name: "A word or phrase to hide" }));
  });
});

describe("a11y: the removal notice", () => {
  it("offers 'Ask us to look again' only when there is an action to ask about", () => {
    const view = mount(inApp(<RemovalNotice viewer="author" floorItemText="Dangerous medical misinformation" crisis={false} />));
    expect(view.queryByRole("button", { name: "Ask us to look again" })).toBeNull();
  });

  it("never prints an empty rule ('rules: .')", () => {
    const view = mount(inApp(<RemovalNotice viewer="author" floorItemText="" crisis={false} onAskAgain={() => {}} />));
    expect(view.container.textContent ?? "").not.toMatch(/rules: \./);
    expect(view.container.textContent ?? "").not.toMatch(/rules: a safety rule/);
  });
});

describe("a11y: links stay in the app on web (an appeal draft must survive)", () => {
  it("'Contact us' is a real link whose click does not trigger a full page load", () => {
    const view = mount(inApp(<></>));
    const link = view.getByRole("link", { name: "Contact us" });
    expect(link).toHaveAttribute("href", "/contact");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      link.dispatchEvent(click);
    });
    expect(click.defaultPrevented).toBe(true);
  });
});

describe("governance: the report panel says the review team is not set up yet (G1)", () => {
  it("states it in the panel, without a promise", () => {
    const view = mount(inApp(<ReportControl subjectKind="post" authorName="Sam" onSubmit={() => Promise.resolve()} />));
    act(() => {
      fireEvent.click(view.getByRole("button", { name: "Report this post by Sam" }));
    });
    const panel = view.getByRole("group", { name: "Report this post" });
    expect(panel).toHaveTextContent("We save every report. We haven't set up our review team yet, so we can't say when someone will look at it.");
  });
});
