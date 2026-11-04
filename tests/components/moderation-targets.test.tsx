// Target sizes on the moderation surfaces (ADR 0022, Proposed; plan §5; WCAG
// 2.5.8). Every button, link and radio row is at least 44px tall and wide.
//
// Under the rn renderer, as PostCard.test.tsx does: jsdom has no layout, so the
// web project cannot measure size. Written FAILING before anything is built;
// build step 4 makes it pass. Each case loads its component on demand, so a
// missing component fails that case with "not built yet".
import React, { type ReactElement } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { moderationUi as M } from "../shared/contracts/moderation-ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyComponent = (props: any) => ReactElement | null;
function load(module: keyof typeof M.modules, name: string): AnyComponent {
  let mod: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(`../../${M.modules[module]}`);
  } catch {
    throw new Error(`Not built yet (build step 4, ADR 0022): ${M.modules[module]}`);
  }
  if (typeof mod[name] !== "function") throw new Error(`${M.modules[module]} does not export ${name}`);
  return mod[name] as AnyComponent;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function flatten(style: unknown): Record<string, number> {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).flat(Infinity as 1).filter(Boolean))
    : (style as Record<string, number>) || {};
}

/** Every pressable control in the tree meets the 44px minimum in both directions. */
function expectTargets(view: ReturnType<typeof render>) {
  const controls = [
    ...view.queryAllByRole("button"),
    ...view.queryAllByRole("link"),
    ...view.queryAllByRole("radio"),
  ];
  expect(controls.length).toBeGreaterThan(0);
  // Collect every miss, named, so a failure says which control is too small.
  const tooSmall = controls
    .map((c) => {
      const s = flatten(c.props.style);
      const name = c.props.accessibilityLabel ?? c.props["aria-label"] ?? "(unnamed)";
      const h = s.minHeight ?? s.height ?? 0;
      const w = s.minWidth ?? s.width ?? 0;
      return h >= M.minTargetPx && w >= M.minTargetPx ? null : `${name}: ${w}x${h}`;
    })
    .filter(Boolean);
  expect(tooSmall).toEqual([]);
}

const item = (n: number) => ({ id: `i${n}`, category: `c${n}`, tierLabel: "t", ageText: `waiting ${n} hours` });

describe("moderation targets are at least 44px", () => {
  it("Report: opener, each reason row, Send and Cancel", () => {
    const ReportControl = load("reportControl", "ReportControl");
    const view = render(<ReportControl subjectKind="post" authorName="Sam" onSubmit={() => Promise.resolve()} />);
    fireEvent.press(view.getByRole("button", { name: M.report.opener("post", "Sam") }));
    expectTargets(view);
  });

  it("Block: opener, Block and Cancel", () => {
    const BlockControl = load("blockControl", "BlockControl");
    const view = render(<BlockControl memberName="Sam" fallbackFocusId="x" onBlock={() => Promise.resolve()} />);
    fireEvent.press(view.getByRole("button", { name: M.block.opener("Sam") }));
    expectTargets(view);
  });

  it("Removal notice: Ask us to look again, and the crisis links", () => {
    const RemovalNotice = load("removalNotice", "RemovalNotice");
    expectTargets(render(<RemovalNotice viewer="author" floorItemText="x" crisis={true} onAskAgain={() => {}} />));
  });

  it("Appeal page: Send", () => {
    const AppealForm = load("appealForm", "AppealForm");
    expectTargets(render(<AppealForm actionId="a1" gates={{ G1: "unmet", G2: "unmet" }} onSubmit={() => Promise.resolve()} />));
  });

  it("Show gate: Show, and Hide once open", () => {
    const CrisisShowGate = load("crisisShowGate", "CrisisShowGate");
    const view = render(<CrisisShowGate>{null}</CrisisShowGate>);
    expectTargets(view);
    fireEvent.press(view.getByRole("button", { name: M.showGate.show }));
    expectTargets(view);
  });

  it("Post-submit crisis panel: 988, 911 and other-country links", () => {
    const PostSubmitCrisisPanel = load("postSubmitCrisisPanel", "PostSubmitCrisisPanel");
    expectTargets(render(<PostSubmitCrisisPanel gates={{ G1: "unmet" }} />));
  });

  it("Queue: Open, Pause live updates, and 'N new items — Show'", () => {
    const ModerationQueue = load("moderationQueue", "ModerationQueue");
    const view = render(<ModerationQueue items={[item(1)]} />);
    expectTargets(view);
    view.rerender(<ModerationQueue items={[item(2), item(1)]} />);
    expect(view.getByRole("button", { name: M.queue.newItems(1) })).toBeTruthy();
    expectTargets(view);
  });

  it("Console: Open, and the item pane's actions", () => {
    const ModeratorConsole = load("moderatorConsole", "ModeratorConsole");
    const view = render(<ModeratorConsole items={[item(1), item(2)]} onAction={() => Promise.resolve()} />);
    fireEvent.press(view.getAllByRole("button", { name: new RegExp(`^${M.queue.open}`) })[0]);
    expectTargets(view);
  });

  it("Contact us", () => {
    const ContactLink = load("contactLink", "ContactLink");
    expectTargets(render(<ContactLink />));
  });
});
