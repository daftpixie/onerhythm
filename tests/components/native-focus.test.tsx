// Native focus moves (iOS and Android) for the moderation surfaces, and the
// visible field labels, under the rn renderer. Item 4 (and the native half of
// item 2) of the a11y follow-ups left open by the step 4 review (PR #12).
// Written FAILING first (CLAUDE.md, ADR 0013).
//
// On the web, focus moves with DOM focus (tests/web/moderation-ui.test.tsx).
// On native there is no DOM focus; a screen reader moves when it gets the
// accessibility "focus" event, as the crisis sheet already does
// (CrisisHelpSheet.test.tsx). These pin the SAME moves as the web: panel open,
// Send, Remove, and the fallback when the opener is gone. The manual
// VoiceOver/TalkBack pass (G7) still has to confirm what a reader does with
// them.

import { useState, type ReactNode } from "react";
import { AccessibilityInfo, Text } from "react-native";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ReportControl } from "../../src/components/moderation/ReportControl";
import { BlockControl } from "../../src/components/moderation/BlockControl";
import { AppealForm, clearAppealDrafts } from "../../src/components/moderation/AppealForm";
import { MutedWordsSettings } from "../../src/components/moderation/MutedWordsSettings";
import { setMutedWordsOwner } from "../../src/lib/moderation/mutedWords";
import { moderationUi as M } from "../shared/contracts/moderation-ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Target = { props: Record<string, any> } | null;

/** The text inside a host node's children, flattened. */
function textOf(node: Target): string {
  const walk = (c: any): string =>
    c == null || typeof c === "boolean" ? "" : Array.isArray(c) ? c.map(walk).join("") : typeof c === "object" ? walk(c.props?.children) : String(c);
  return walk(node?.props.children);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

let send: jest.SpyInstance;
beforeEach(() => {
  send = jest.spyOn(AccessibilityInfo, "sendAccessibilityEvent").mockImplementation(() => {});
});
afterEach(() => {
  send.mockRestore();
  clearAppealDrafts();
});

/** A host node's accessible name. Pressable hands aria-label to its native view as accessibilityLabel. */
const nameOf = (node: Target) => node?.props.accessibilityLabel ?? node?.props["aria-label"];

/** The last node the screen reader was sent to. */
function lastFocus(): Target {
  const calls = send.mock.calls.filter((c) => c[1] === "focus");
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][0] as Target;
}

describe("Report panel (native)", () => {
  const opener = M.report.opener("post", "Sam");
  const mountReport = (onSubmit = () => Promise.resolve()) =>
    render(<ReportControl subjectKind="post" authorName="Sam" onSubmit={onSubmit} />);

  it("open moves the screen reader to the panel heading", () => {
    const view = mountReport();
    fireEvent.press(view.getByRole("button", { name: opener }));
    const target = lastFocus();
    expect(target?.props.role).toBe("heading");
    expect(textOf(target)).toBe(M.report.panelHeading("post"));
  });

  it("Cancel moves it back to the opener", () => {
    const view = mountReport();
    fireEvent.press(view.getByRole("button", { name: opener }));
    fireEvent.press(view.getByRole("button", { name: M.report.cancel }));
    expect(nameOf(lastFocus())).toBe(opener);
  });

  it("a successful Send moves it back to the opener", async () => {
    const view = mountReport();
    fireEvent.press(view.getByRole("button", { name: opener }));
    fireEvent.press(view.getByRole("radio", { name: M.report.reasonLabel }));
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: M.report.send }));
    });
    expect(nameOf(lastFocus())).toBe(opener);
  });

  it("Send with no reason moves it to the first reason", async () => {
    const view = mountReport();
    fireEvent.press(view.getByRole("button", { name: opener }));
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: M.report.send }));
    });
    const target = lastFocus();
    expect(target?.props.role).toBe("radio");
  });
});

describe("Block panel (native)", () => {
  it("open moves to the heading; Cancel moves back to the opener", () => {
    const view = render(<BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />);
    fireEvent.press(view.getByRole("button", { name: M.block.opener("Sam") }));
    expect(textOf(lastFocus())).toBe(M.block.panelHeading("Sam"));
    fireEvent.press(view.getByRole("button", { name: M.block.cancel }));
    expect(nameOf(lastFocus())).toBe(M.block.opener("Sam"));
  });

  it("when blocking hides the opener, the screen reader goes to the named fallback", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useFocusTarget } = require("../../src/components/moderation/panel");
    function Heading({ children }: { children: ReactNode }) {
      const ref = useFocusTarget("list-heading");
      return (
        <Text ref={ref} role="heading">
          {children}
        </Text>
      );
    }
    function Feed() {
      const [hidden, setHidden] = useState(false);
      return (
        <>
          <Heading>Posts</Heading>
          {!hidden && (
            <BlockControl
              memberName="Sam"
              fallbackFocusId="list-heading"
              onBlock={async () => setHidden(true)}
            />
          )}
        </>
      );
    }
    const view = render(<Feed />);
    fireEvent.press(view.getByRole("button", { name: M.block.opener("Sam") }));
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: M.block.confirm }));
    });
    expect(view.queryByRole("button", { name: M.block.opener("Sam") })).toBeNull();
    expect(textOf(lastFocus())).toBe("Posts");
  });
});

describe("Appeal page (native)", () => {
  it("Send moves to the saved message; an empty Send moves to the field", async () => {
    const view = render(<AppealForm actionId="n1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />);
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: M.appeal.submit }));
    });
    expect(lastFocus()?.props.accessibilityLabelledBy ?? lastFocus()?.props["aria-labelledby"]).toBeTruthy();
    fireEvent.changeText(view.getByLabelText(M.appeal.statementLabel), "Please look again.");
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: M.appeal.submit }));
    });
    expect(textOf(lastFocus())).toBe(M.appeal.saved);
  });
});

describe("Muted words (native)", () => {
  beforeEach(() => setMutedWordsOwner("member-native-test"));
  afterEach(() => setMutedWordsOwner(null));

  it("Remove moves the screen reader to the field, never nowhere", async () => {
    const view = render(<MutedWordsSettings />);
    await waitFor(() => expect(view.getByText("No words yet.")).toBeTruthy());
    fireEvent.changeText(view.getByLabelText("A word or phrase to hide"), "ablation");
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: "Add" }));
    });
    await act(async () => {
      fireEvent.press(view.getByRole("button", { name: "Remove 'ablation'" }));
    });
    const target = lastFocus();
    expect(target?.props.accessibilityLabelledBy ?? target?.props["aria-labelledby"]).toBeTruthy();
    expect(target?.props.onChangeText).toBeDefined();
  });
});

describe("visible labels (native)", () => {
  function labelText(view: ReturnType<typeof render>, field: Target): string {
    const id = field?.props.accessibilityLabelledBy ?? field?.props["aria-labelledby"];
    expect(id).toBeTruthy();
    const label = view.UNSAFE_root.findAll((n) => n.props.nativeID === id && typeof n.type !== "string");
    expect(label.length).toBeGreaterThan(0);
    return textOf(label[0] as Target);
  }

  it("the report note is labelled by visible text, not an aria-label", () => {
    const view = render(<ReportControl subjectKind="post" authorName="Sam" onSubmit={() => Promise.resolve()} />);
    fireEvent.press(view.getByRole("button", { name: M.report.opener("post", "Sam") }));
    const field = view.getByLabelText(M.report.noteLabel);
    expect(field.props["aria-label"]).toBeUndefined();
    expect(labelText(view, field as Target)).toBe(M.report.noteLabel);
  });

  it("the appeal field is labelled by visible text, not an aria-label", () => {
    const view = render(<AppealForm actionId="n2" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />);
    const field = view.getByLabelText(M.appeal.statementLabel);
    expect(field.props["aria-label"]).toBeUndefined();
    expect(labelText(view, field as Target)).toBe(M.appeal.statementLabel);
  });
});
