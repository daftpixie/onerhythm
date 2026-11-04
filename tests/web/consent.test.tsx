// Consent, in a real DOM.
//
// Consent is a legal surface: a control that misreports its state misreports a
// legal state. Withdrawal must be exactly as easy as granting (privacy.md), and
// the focus behaviour around the confirmation is only observable here — the
// native suite can watch a callback, not document.activeElement.

import { act } from "react";
import {
  ConsentManager,
  type ConsentHistoryRow,
  type ConsentTag,
} from "../../src/components/ConsentManager";
import { mount } from "./mount";

// Typed, with no `as` cast anywhere. An earlier version of this fixture was
// cast to `never` to quieten the compiler and silently omitted `id`, which
// react-dom reported as a missing-key warning while the types stayed happy.
// Casting a fixture is how a test starts describing a component that does not
// exist.
const history: ConsentHistoryRow[] = [
  {
    id: "consent-1",
    purpose: "health_self_id",
    policy_version: "2026-01-01",
    granted_at: "2026-04-12T00:00:00Z",
    withdrawn_at: null,
  },
];

const tags: ConsentTag[] = [{ id: "afib", label: "Atrial fibrillation" }];

function consent(overrides: Partial<React.ComponentProps<typeof ConsentManager>> = {}) {
  return mount(
    <ConsentManager
      status="on"
      tags={tags}
      history={history}
      onWithdraw={async () => {}}
      onExport={() => {}}
      onDeleteAccount={() => {}}
      {...overrides}
    />,
  );
}

describe("consent state is reported truthfully", () => {
  it("shows the versioned history with a plain, unambiguous date", () => {
    const { container } = consent();
    const text = container.textContent ?? "";
    // Never 04/12 vs 12/04 — that ambiguity on a legal record is a real harm.
    expect(text).toContain("12 Apr 2026");
    expect(text).toContain("2026-01-01");
  });

  it("offers withdrawal as a real control, not a dead end", () => {
    const { getAllByRole } = consent();
    const names = getAllByRole("button").map((b) =>
      (b.getAttribute("aria-label") ?? b.textContent ?? "").toLowerCase(),
    );
    expect(names.join(" | ")).toMatch(/turn off|withdraw/);
  });

  it("renders no control that has no data model behind it", () => {
    // The wireframe's "Email notifications" toggle is deliberately absent: a
    // toggle with nothing behind it is a control that lies.
    const { container } = consent();
    expect(container.textContent).not.toMatch(/email notifications/i);
  });
});

describe("the withdrawal confirmation", () => {
  function openConfirm(view: ReturnType<typeof consent>) {
    const trigger = view
      .getAllByRole("button")
      .find((b) =>
        /turn off|withdraw/i.test(
          b.getAttribute("aria-label") ?? b.textContent ?? "",
        ),
      )!;
    act(() => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    return trigger;
  }

  it("moves focus to the SAFE control, in the real document", () => {
    const view = consent();
    openConfirm(view);

    // Not a callback — the actual focused element.
    const active = document.activeElement as HTMLElement;
    expect(active).toBeTruthy();
    expect(
      (active.getAttribute("aria-label") ?? active.textContent ?? "")
        .toLowerCase(),
    ).toMatch(/keep|cancel/);
  });

  it("does not withdraw until the confirmation is taken", () => {
    const onWithdraw = jest.fn(async () => {});
    const view = consent({ onWithdraw });
    openConfirm(view);
    expect(onWithdraw).not.toHaveBeenCalled();
  });
});
