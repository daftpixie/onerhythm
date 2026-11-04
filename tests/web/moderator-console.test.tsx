// The moderator console beyond ADR 0022's suite (build step 5; plan §4.2,
// §5.5; ADR 0019 Q4 and Q9; ADR 0021). Under the renderer that ships.
//
// Written FAILING before the console is built (CLAUDE.md, ADR 0013). ADR 0022
// deferred two of these by name: "Show this content" for crisis items and the
// session-expiry warning with "Stay signed in". The rest pin the action form:
// a reason every time, exactly one cited rule (moderate() needs it), Tier 3
// never routed to a vote, bans only on the safety floor with an end date
// within max_ban_term and a second person, and honest copy while G4 is unmet.

import { act, type ReactElement } from "react";
import { fireEvent, within } from "@testing-library/dom";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppShell } from "../../src/components/AppShell";
import { moderationUi as M } from "../shared/contracts/moderation-ui";
import { moderatorConsole as C } from "../shared/contracts/moderator-console";
import { mount } from "./mount";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyComponent = (props: any) => ReactElement | null;
function load(path: string, name: string): AnyComponent {
  let mod: Record<string, unknown>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require(`../../${path}`);
  } catch {
    throw new Error(`Not built yet (build step 5): ${path}`);
  }
  if (typeof mod[name] !== "function") throw new Error(`${path} does not export ${name}`);
  return mod[name] as AnyComponent;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const CONSOLE = "src/components/moderation/ModeratorConsole";

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function inApp(ui: ReactElement) {
  const StatusRegionProvider = load("src/components/StatusRegion", "StatusRegionProvider");
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
function type(el: Element, value: string) {
  act(() => {
    fireEvent.change(el, { target: { value } });
  });
}
async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, M.statusRegion.clearThenSetMs + 20));
  });
}
const region = () => document.querySelector(`[data-testid='${M.statusRegion.testID}']`);

type Key = "crisis" | "dangerous_misinfo" | "harassment" | "spam" | "tier1";
function item(n: number, key: Key = "dangerous_misinfo", subjectKind: "post" | "comment" = "post") {
  const tier = key === "tier1" ? 1 : 3;
  return {
    id: `item-${n}`,
    category: `Category ${key} ${n}`,
    categoryKey: key,
    tier,
    tierLabel: tier === 3 ? "Safety floor (Tier 3)" : "Community guidelines (Tier 1)",
    subjectKind,
    ageText: `waiting ${n} hours`,
  };
}

const FLOOR = [
  { id: "f1", text: "Dangerous medical misinformation" },
  { id: "f2", text: "Harassment or threats" },
];

function consoleWith(props: Record<string, unknown> = {}) {
  const ModeratorConsole = load(CONSOLE, "ModeratorConsole");
  const onAction = jest.fn<Promise<void>, [string, unknown]>(() => Promise.resolve());
  const view = mount(
    inApp(
      <ModeratorConsole
        items={[item(1)]}
        onAction={onAction}
        floorItems={FLOOR}
        maxBanTermDays={null}
        gates={{ G1: "unmet" }}
        {...props}
      />,
    ),
  );
  const open = (i = 0) => press(view.getAllByRole("button", { name: new RegExp(`^${M.queue.open}`) })[i]);
  return { view, onAction, open };
}

const radio = (view: ReturnType<typeof mount>, name: string) => view.getByRole("radio", { name });
const reasonBox = (view: ReturnType<typeof mount>) => view.getByRole("textbox", { name: M.console.reasonLabel });

describe("the console page", () => {
  it("has one level-1 heading and says actions are under the moderator name", () => {
    const { view } = consoleWith();
    expect(view.getByRole("heading", { level: 1, name: C.pageHeading })).toBeInTheDocument();
    expect(view.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(view.container).toHaveTextContent(C.pseudonymNote);
  });

  it("an empty queue says so in words", () => {
    const { view } = consoleWith({ items: [] });
    expect(view.getByRole("heading", { name: M.queue.heading })).toBeInTheDocument();
    expect(view.container).toHaveTextContent("Nothing is waiting.");
  });
});

describe("gate-aware: no console while G4 is unmet", () => {
  it("says plainly that no moderators are appointed, and shows no queue or action", () => {
    const ConsoleUnavailable = load(CONSOLE, "ConsoleUnavailable");
    const view = mount(inApp(<ConsoleUnavailable reason="no_moderators" />));
    expect(view.getByRole("heading", { level: 1, name: C.pageHeading })).toBeInTheDocument();
    expect(view.container).toHaveTextContent(C.noModerators);
    expect(view.queryByRole("heading", { name: M.queue.heading })).toBeNull();
    expect(view.queryByRole("button", { name: /^Open/ })).toBeNull();
    expect(view.queryByRole("textbox")).toBeNull();
  });

  it("a member without a grant is told they have no access, not shown an empty queue", () => {
    const ConsoleUnavailable = load(CONSOLE, "ConsoleUnavailable");
    const view = mount(inApp(<ConsoleUnavailable reason="not_a_moderator" />));
    expect(view.container).toHaveTextContent(C.notAModerator);
    expect(view.container).not.toHaveTextContent("Nothing is waiting.");
  });

  it("the access decision never opens the console while G4 is unmet, whatever the queue call says", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { consoleAccess } = require("../../src/lib/moderation/console");
    expect(consoleAccess({ G4: "unmet", queue: "ok" })).toBe("no_moderators");
    expect(consoleAccess({ G4: "unmet", queue: "refused" })).toBe("no_moderators");
    expect(consoleAccess({ G4: "met", queue: "refused" })).toBe("not_a_moderator");
    expect(consoleAccess({ G4: "met", queue: "ok" })).toBe("ready");
  });

  it("the crisis control and the contact link are there in every unavailable state", () => {
    const ConsoleUnavailable = load(CONSOLE, "ConsoleUnavailable");
    for (const reason of ["no_moderators", "not_a_moderator"]) {
      const view = mount(inApp(<ConsoleUnavailable reason={reason} />));
      const header = document.querySelector("header") as HTMLElement;
      expect(within(header).getByRole("button", { name: M.crisisTrigger })).toBeInTheDocument();
      expect(view.getAllByRole("link", { name: M.contact.label })).toHaveLength(1);
      view.unmount();
    }
  });
});

describe("Show this content (plan §5.5, moderator care)", () => {
  it.each(["crisis", "harassment"] as const)("a %s item's content is behind Show, never auto-expanded", async (key) => {
    const loadContent = jest.fn(() => Promise.resolve("ZZ-POST-WORDS"));
    const { view, open } = consoleWith({ items: [item(1, key)], loadContent });
    await act(async () => open());
    expect(document.body.textContent).not.toContain("ZZ-POST-WORDS");
    const show = view.getByRole("button", { name: C.showContent });
    expect(show).toHaveAttribute("aria-expanded", "false");
    const controls = show.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    act(() => show.focus());
    await pressAsync(show);
    const hide = view.getByRole("button", { name: C.hideContent });
    expect(hide).toBe(show);
    expect(hide).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(controls as string)).toHaveTextContent("ZZ-POST-WORDS");
    expect(document.activeElement).toBe(hide);
    press(hide);
    expect(document.body.textContent).not.toContain("ZZ-POST-WORDS");
  });

  it("an item with no category key fails closed: its content is behind Show", async () => {
    const loadContent = jest.fn(() => Promise.resolve("ZZ-POST-WORDS"));
    const { categoryKey: _drop, ...bare } = item(1);
    const { view, open } = consoleWith({ items: [bare], loadContent });
    await act(async () => open());
    expect(document.body.textContent).not.toContain("ZZ-POST-WORDS");
    expect(view.getByRole("button", { name: C.showContent })).toBeInTheDocument();
  });

  it("other categories show their content in the pane", async () => {
    const loadContent = jest.fn(() => Promise.resolve("ZZ-POST-WORDS"));
    const { open } = consoleWith({ items: [item(1, "spam")], loadContent });
    await act(async () => open());
    expect(document.body.textContent).toContain("ZZ-POST-WORDS");
  });

  it("an opened crisis item carries a one-line link to 988 for the moderator", () => {
    const { view, open } = consoleWith({ items: [item(1, "crisis")] });
    open();
    const care = view.getByText(C.careLine).closest("[role='group'], div") as HTMLElement;
    const hrefs = Array.from(care.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining([C.care988.call, C.care988.text]));
  });

  it("the queue list never shows content, only the category in words", async () => {
    const loadContent = jest.fn(() => Promise.resolve("ZZ-POST-WORDS"));
    const { view } = consoleWith({ items: [item(1, "spam"), item(2, "crisis")], loadContent });
    await settle();
    const queue = view.getByRole("list", { name: M.queue.heading });
    expect(queue.textContent).not.toContain("ZZ-POST-WORDS");
    expect(loadContent).not.toHaveBeenCalled();
  });
});

describe("the action form", () => {
  it("Apply with nothing chosen says what is missing, marks it, and calls nothing", async () => {
    const { view, onAction, open } = consoleWith();
    open();
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).not.toHaveBeenCalled();
    const group = view.getByRole("radiogroup", { name: C.actionLegend });
    expect(group).toHaveAttribute("aria-invalid", "true");
    const describedBy = group.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(describedBy.split(" ")[0])).toHaveTextContent(C.errors.noAction);
    expect(document.activeElement).toBe(radio(view, C.actions.noAction));
  });

  it("every action needs a reason; the reason box has a visible label and keeps what was typed", async () => {
    const { view, onAction, open } = consoleWith();
    open();
    press(radio(view, C.actions.noAction));
    press(radio(view, FLOOR[0].text));
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).not.toHaveBeenCalled();
    const box = reasonBox(view);
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box.getAttribute("aria-describedby") ?? "").not.toBe("");
    expect(document.activeElement).toBe(box);
    expect(view.container).toHaveTextContent(C.errors.noReason);
    // A visible label, not a placeholder or an aria-label alone.
    const labelId = box.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId as string)).toHaveTextContent(M.console.reasonLabel);
  });

  it("every action cites exactly one rule (moderate() refuses otherwise)", async () => {
    const { view, onAction, open } = consoleWith();
    open();
    press(radio(view, C.actions.noAction));
    type(reasonBox(view), "Checked; it is fine.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).not.toHaveBeenCalled();
    expect(view.getByRole("radiogroup", { name: C.ruleLegend })).toHaveAttribute("aria-invalid", "true");
    expect(view.container).toHaveTextContent(C.errors.noRule);

    press(radio(view, FLOOR[1].text));
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith("item-1", {
      kind: "no_action",
      reason: "Checked; it is fine.",
      floorItemId: "f2",
    });
  });

  it("a successful action is announced, and the parent removing the item is not 'another reviewer'", async () => {
    const { view, onAction, open } = consoleWith({ items: [item(1), item(2)] });
    open();
    press(radio(view, C.actions.remove));
    press(radio(view, FLOOR[0].text));
    type(reasonBox(view), "Says to stop a prescribed medicine.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).toHaveBeenCalledWith("item-1", {
      kind: "remove",
      reason: "Says to stop a prescribed medicine.",
      floorItemId: "f1",
    });
    await settle();
    expect(region()).toHaveTextContent(C.applied);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("a failed action keeps the reason and says so in an alert inside the pane", async () => {
    const { view, open } = consoleWith({ onAction: () => Promise.reject(new Error("offline")) });
    open();
    press(radio(view, C.actions.noAction));
    press(radio(view, FLOOR[0].text));
    type(reasonBox(view), "My reason.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(view.getByRole("alert")).toHaveTextContent(C.failed);
    expect(reasonBox(view)).toHaveValue("My reason.");
  });

  it("Tier 3 is never routed to a vote: no panel, ballot or vote control anywhere", () => {
    const { view, open } = consoleWith({ items: [item(1), item(2, "crisis")] });
    for (const i of [0, 1]) {
      open(i);
      const controls = [...view.queryAllByRole("button"), ...view.queryAllByRole("radio")];
      for (const c of controls) {
        expect(c.textContent ?? "").not.toMatch(/vote|panel|ballot/i);
        expect(c.getAttribute("aria-label") ?? "").not.toMatch(/vote|panel|ballot/i);
      }
    }
  });

  it("a Tier 1 item is never removed or banned, and cites a community guideline, not the floor", async () => {
    const { view, onAction, open } = consoleWith({ items: [item(1, "tier1")], maxBanTermDays: 30 });
    open();
    expect(view.queryByRole("radio", { name: C.actions.remove })).toBeNull();
    expect(view.queryByRole("radio", { name: C.actions.ban })).toBeNull();
    expect(view.queryByRole("radio", { name: FLOOR[0].text })).toBeNull();
    expect(view.getByRole("radiogroup", { name: C.tier1RuleLegend })).toBeInTheDocument();
    press(radio(view, C.actions.requestEdit));
    press(radio(view, C.tier1Rules.unkind));
    type(reasonBox(view), "Name-calling in the second line.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).toHaveBeenCalledWith("item-1", {
      kind: "request_edit",
      reason: "Name-calling in the second line.",
      tier1Rule: "unkind",
    });
  });

  it("a crisis item is never removed, banned or locked", () => {
    const { view, open } = consoleWith({ items: [item(1, "crisis")], maxBanTermDays: 30 });
    open();
    for (const name of [C.actions.remove, C.actions.ban, C.actions.lock]) {
      expect(view.queryByRole("radio", { name })).toBeNull();
    }
  });

  it("'Send crisis resources' is offered for a crisis item only once G1 is met", () => {
    const unmet = consoleWith({ items: [item(1, "crisis")], gates: { G1: "unmet" } });
    unmet.open();
    expect(unmet.view.queryByRole("radio", { name: C.actions.sendCrisis })).toBeNull();
    unmet.view.unmount();
    const met = consoleWith({ items: [item(1, "crisis")], gates: { G1: "met" } });
    met.open();
    expect(met.view.getByRole("radio", { name: C.actions.sendCrisis })).toBeInTheDocument();
  });

  it("a comment can't be locked; only a thread can", () => {
    const { view, open } = consoleWith({ items: [item(1, "dangerous_misinfo", "comment")] });
    open();
    expect(view.queryByRole("radio", { name: C.actions.lock })).toBeNull();
  });
});

describe("bans (Q9): safety floor only, a second person, an end date, max_ban_term", () => {
  it("while max_ban_term is not set, no ban can be proposed, and the pane says why", () => {
    const { view, open } = consoleWith({ maxBanTermDays: null });
    open();
    expect(view.queryByRole("radio", { name: C.actions.ban })).toBeNull();
    expect(view.container).toHaveTextContent(C.banUnavailable);
  });

  it("offers only lengths within max_ban_term, says a second moderator confirms, and sends an end date", async () => {
    const { view, onAction, open } = consoleWith({ maxBanTermDays: 7 });
    open();
    press(radio(view, C.actions.ban));
    expect(view.container).toHaveTextContent(C.banSecondPerson);
    const lengths = within(view.getByRole("radiogroup", { name: C.banLengthLegend }))
      .getAllByRole("radio")
      .map((r) => r.getAttribute("aria-label") ?? r.textContent);
    expect(lengths.length).toBeGreaterThan(0);
    for (const l of lengths) {
      const days = Number((l ?? "").match(/\d+/)?.[0]);
      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(7);
    }
    press(radio(view, FLOOR[1].text));
    type(reasonBox(view), "Repeated threats after a warning.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).not.toHaveBeenCalled();
    expect(view.container).toHaveTextContent(C.errors.noBanLength);

    const before = Date.now();
    press(within(view.getByRole("radiogroup", { name: C.banLengthLegend })).getAllByRole("radio")[0]);
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(onAction).toHaveBeenCalledTimes(1);
    const [id, action] = onAction.mock.calls[0] as [string, { kind: string; floorItemId: string; endsAt: string }];
    expect(id).toBe("item-1");
    expect(action.kind).toBe("temporary_ban");
    expect(action.floorItemId).toBe("f2");
    const ends = Date.parse(action.endsAt);
    expect(ends).toBeGreaterThan(before);
    expect(ends).toBeLessThanOrEqual(Date.now() + 7 * 24 * 3600 * 1000);
  });
});

describe("session expiry (plan §5.5; SC 2.2.1)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function advance(ms: number) {
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  }

  it("warns at least 20 seconds ahead with 'Stay signed in', never moves focus, and keeps the typed reason", async () => {
    const onStaySignedIn = jest.fn(() => Promise.resolve());
    const { view, open } = consoleWith({ sessionExpiresAt: Date.now() + 120_000, onStaySignedIn });
    open();
    type(reasonBox(view), "Half-written reason.");
    act(() => reasonBox(view).focus());

    advance(120_000 - C.expiry.warnAheadMs - 1_000);
    expect(view.queryByRole("button", { name: C.expiry.stay })).toBeNull();

    advance(1_000);
    expect(C.expiry.warnAheadMs).toBeGreaterThanOrEqual(C.expiry.minWarnAheadMs);
    expect(view.getByRole("button", { name: C.expiry.stay })).toBeInTheDocument();
    expect(view.container).toHaveTextContent(C.expiry.warning);
    expect(document.activeElement).toBe(reasonBox(view));

    await act(async () => {
      fireEvent.click(view.getByRole("button", { name: C.expiry.stay }));
    });
    expect(onStaySignedIn).toHaveBeenCalledTimes(1);
    expect(view.queryByRole("button", { name: C.expiry.stay })).toBeNull();
    expect(reasonBox(view)).toHaveValue("Half-written reason.");
  });

  it("a new expiry time (after Stay signed in) is warned about again", () => {
    const ModeratorConsole = load(CONSOLE, "ModeratorConsole");
    const props = { items: [item(1)], onAction: () => Promise.resolve(), floorItems: FLOOR, maxBanTermDays: null, gates: { G1: "unmet" } };
    let setExpiry: (t: number) => void = () => {};
    function Live() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const [t, set] = require("react").useState(Date.now() + 90_000);
      setExpiry = set;
      return <ModeratorConsole {...props} sessionExpiresAt={t} onStaySignedIn={() => Promise.resolve()} />;
    }
    const view = mount(inApp(<Live />));
    advance(31_000);
    expect(view.getByRole("button", { name: C.expiry.stay })).toBeInTheDocument();
    act(() => setExpiry(Date.now() + 3_600_000));
    expect(view.queryByRole("button", { name: C.expiry.stay })).toBeNull();
    advance(3_600_000 - C.expiry.warnAheadMs);
    expect(view.getByRole("button", { name: C.expiry.stay })).toBeInTheDocument();
  });
});

describe("axe on the console's step 5 states", () => {
  beforeAll(() => {
    document.documentElement.lang = "en";
    document.title = "OneRhythm test page";
  });
  async function axeViolations() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axe = require("axe-core");
    const result = await axe.run(document, {
      rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
    });
    return result.violations.map((v: { id: string; nodes: unknown[] }) => `${v.id} (${v.nodes.length})`);
  }

  it("crisis item open, content shown, with errors", async () => {
    const { view, open } = consoleWith({ items: [item(1, "crisis")], loadContent: () => Promise.resolve("words") });
    await act(async () => open());
    await pressAsync(view.getByRole("button", { name: C.showContent }));
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(await axeViolations()).toEqual([]);
  });

  it("ban chosen, lengths shown", async () => {
    const { view, open } = consoleWith({ maxBanTermDays: 30 });
    open();
    press(radio(view, C.actions.ban));
    expect(await axeViolations()).toEqual([]);
  });

  it.each(["no_moderators", "not_a_moderator"])("unavailable: %s", async (reason) => {
    const ConsoleUnavailable = load(CONSOLE, "ConsoleUnavailable");
    mount(inApp(<ConsoleUnavailable reason={reason} />));
    expect(await axeViolations()).toEqual([]);
  });
});

describe("privacy review round 1 (step 5)", () => {
  function deferred() {
    let resolve: (s: string) => void = () => {};
    const promise = new Promise<string>((r) => (resolve = r));
    return { promise, resolve };
  }

  it("a late response for an item no longer open never shows in the open item's pane", async () => {
    const calls: Record<string, ReturnType<typeof deferred>> = {};
    const loadContent = jest.fn((id: string) => {
      calls[id] = deferred();
      return calls[id].promise;
    });
    const { open } = consoleWith({ items: [item(1, "crisis"), item(2, "spam")], loadContent });
    open(0);
    open(1);
    await act(async () => calls["item-2"].resolve("ZZ-SPAM-WORDS"));
    await act(async () => calls["item-1"].resolve("ZZ-CRISIS-WORDS"));
    expect(document.body.textContent).toContain("ZZ-SPAM-WORDS");
    expect(document.body.textContent).not.toContain("ZZ-CRISIS-WORDS");
  });

  it("an unrecognised category fails closed: its content is behind Show", async () => {
    const loadContent = jest.fn(() => Promise.resolve("ZZ-POST-WORDS"));
    const odd = { ...item(1), categoryKey: "something_new" };
    const { view, open } = consoleWith({ items: [odd], loadContent });
    await act(async () => open());
    expect(document.body.textContent).not.toContain("ZZ-POST-WORDS");
    expect(view.getByRole("button", { name: C.showContent })).toBeInTheDocument();
  });

  it("after Apply, the item's text is gone from the page", async () => {
    const loadContent = jest.fn(() => Promise.resolve("ZZ-POST-WORDS"));
    const { view, open } = consoleWith({ items: [item(1, "spam")], loadContent });
    await act(async () => open());
    expect(document.body.textContent).toContain("ZZ-POST-WORDS");
    press(radio(view, C.actions.noAction));
    press(radio(view, FLOOR[0].text));
    type(reasonBox(view), "Fine.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    expect(document.body.textContent).not.toContain("ZZ-POST-WORDS");
  });

  it("the queue does not claim live updates it does not have", () => {
    const { view } = consoleWith({ live: false, onRefresh: () => Promise.resolve(["item-1"]) });
    expect(view.container.textContent).not.toMatch(/Live updates are on/);
    expect(view.container).toHaveTextContent("Live updates aren't on yet. Choose Check for new items.");
    expect(view.queryByRole("button", { name: M.queue.pause })).toBeNull();
    expect(view.getByRole("button", { name: "Check for new items" })).toBeInTheDocument();
  });
});

describe("governance review round 1 notes (step 5)", () => {
  it("a ban is announced as proposed, not applied, since a second moderator must confirm it", async () => {
    const { view, open } = consoleWith({ maxBanTermDays: 7 });
    open();
    press(radio(view, C.actions.ban));
    press(radio(view, FLOOR[1].text));
    press(within(view.getByRole("radiogroup", { name: C.banLengthLegend })).getAllByRole("radio")[0]);
    type(reasonBox(view), "Repeated threats.");
    await pressAsync(view.getByRole("button", { name: C.apply }));
    await settle();
    expect(region()).toHaveTextContent("Ban proposed. It starts only when a second moderator confirms it.");
    expect(region()).not.toHaveTextContent(C.applied);
  });

  it("a Tier 1 item offers no lock: every grant is interim before elections, and moderate() refuses it", () => {
    const { view, open } = consoleWith({ items: [item(1, "tier1")] });
    open();
    expect(view.queryByRole("radio", { name: C.actions.lock })).toBeNull();
  });

  it("an unrecognised category offers only safe actions: no removal, lock or ban", () => {
    const odd = { ...item(1), categoryKey: "something_new" };
    const { view, open } = consoleWith({ items: [odd], maxBanTermDays: 30 });
    open();
    const names = within(view.getByRole("radiogroup", { name: C.actionLegend }))
      .getAllByRole("radio")
      .map((r) => r.getAttribute("aria-label"));
    expect(names).toEqual([C.actions.noAction, C.actions.escalate]);
  });
});

describe("a11y review round 1 (step 5)", () => {
  it("after Stay signed in, focus goes to the page heading, never body", async () => {
    jest.useFakeTimers();
    try {
      const { view } = consoleWith({ sessionExpiresAt: Date.now() + 30_000, onStaySignedIn: () => Promise.resolve() });
      const stay = view.getByRole("button", { name: C.expiry.stay });
      act(() => stay.focus());
      await act(async () => {
        fireEvent.click(stay);
      });
      expect(document.activeElement).toBe(view.getByRole("heading", { level: 1, name: C.pageHeading }));
    } finally {
      jest.useRealTimers();
    }
  });

  it("a check that finds nothing new says so", async () => {
    const { view } = consoleWith({ live: false, onRefresh: () => Promise.resolve(["item-1"]) });
    await pressAsync(view.getByRole("button", { name: "Check for new items" }));
    await settle();
    expect(region()).toHaveTextContent("No new items.");
  });

  it("a check that fails says so in an alert, and a later good check clears it", async () => {
    let fail = true;
    const onRefresh = () => (fail ? Promise.reject(new Error("offline")) : Promise.resolve(["item-1"]));
    const { view } = consoleWith({ live: false, onRefresh });
    await pressAsync(view.getByRole("button", { name: "Check for new items" }));
    expect(view.getByRole("alert")).toHaveTextContent("We couldn't check for new items. Please try again.");
    fail = false;
    await pressAsync(view.getByRole("button", { name: "Check for new items" }));
    expect(view.queryByRole("alert")).toBeNull();
  });

  it("Open on the item already open moves focus to its pane heading", () => {
    const { view, open } = consoleWith({ items: [item(1), item(2)] });
    open(0);
    const opener = view.getAllByRole("button", { name: /^Open/ })[0];
    act(() => opener.focus());
    press(opener);
    expect(document.activeElement).toBe(view.getByRole("heading", { level: 2, name: item(1).category }));
  });

  it("an item handled elsewhere can be closed, and focus goes back to the queue", () => {
    const ModeratorConsole = load(CONSOLE, "ModeratorConsole");
    let setItems: (xs: ReturnType<typeof item>[]) => void = () => {};
    function Live() {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const [xs, set] = require("react").useState([item(1), item(2)]);
      setItems = set;
      return <ModeratorConsole items={xs} onAction={() => Promise.resolve()} floorItems={FLOOR} />;
    }
    const view = mount(inApp(<Live />));
    press(view.getAllByRole("button", { name: /^Open/ })[0]);
    act(() => setItems([item(2)]));
    press(view.getByRole("button", { name: "Close this item" }));
    expect(view.queryByRole("heading", { level: 2, name: item(1).category })).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
  });

  it("the reason's hint is part of its description", () => {
    const { view, open } = consoleWith();
    open();
    const ids = (reasonBox(view).getAttribute("aria-describedby") ?? "").split(" ");
    const text = ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
    expect(text).toMatch(/Say what you saw and why/);
  });
});
