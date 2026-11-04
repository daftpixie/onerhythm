// Delete-account flow, under the renderer that actually ships.
//
// This is the surface where the aria-disabled regression lived and where the
// <button disabled> defect lives. Both were invisible to the "rn" project
// because react-test-renderer reports the props a component INTENDED to set.
// Here we read the DOM a browser would receive.

import { act } from "react";
import { DeleteAccountPanel } from "../../src/components/DeleteAccountPanel";
import { mount } from "./mount";

function panel() {
  return mount(
    <DeleteAccountPanel
      onExport={() => {}}
      onDelete={async () => {}}
      onCancel={() => {}}
    />,
  );
}

/** Type into the confirm field the way a member would. */
function typeConfirm(input: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("delete-account trigger, unarmed", () => {
  it("tells a screen-reader user what to do, without claiming to be disabled", () => {
    // The state is NOT carried by aria-disabled. See the comment on the trigger
    // in DeleteAccountPanel and ADR 0014: on react-native-web, aria-disabled on
    // a role="button" element always drags a real `disabled` attribute along
    // with it, and this control is operable anyway — pressing it explains what
    // to do. So the precondition is carried in words, as an accessible
    // description, which says strictly more than "dimmed" ever did.
    const { getByLabelText, getByTestId } = panel();
    const trigger = getByLabelText("Permanently delete my account");

    expect(trigger).not.toHaveAttribute("aria-disabled", "true");
    expect(trigger).toHaveAttribute("aria-describedby", "delete-precondition");

    // The description must actually resolve to the words a member needs, or the
    // reference is a dangling id and announces nothing.
    const described = document.getElementById("delete-precondition");
    expect(described).not.toBeNull();
    expect(described).toHaveTextContent(
      /type the word DELETE in the box above/i,
    );

    // ...and it must NOT live inside the polite live region. Sharing one node
    // between aria-live and aria-describedby makes the same sentence arrive
    // twice through two channels at two different times — the double
    // announcement the a11y reviewer flagged.
    expect(getByTestId("delete-status")).not.toContainElement(described);
  });

  it("does NOT carry a real disabled attribute", () => {
    // PROOF CASE (c): react-native-web "enhances with native semantics" —
    // createDOMProps sets domProps.disabled = true whenever disabled === true
    // AND the element type is button/form/input/select/textarea.
    // accessibilityRole="button" makes this a real <button>, so the control
    // renders <button disabled tabindex="0">.
    //
    // In a browser that is fatal twice over, and tabindex="0" does not save it:
    //  - a disabled button is removed from the Tab order, which is precisely
    //    the keyboard dead-end unavailable() was written to prevent;
    //  - a disabled button receives no click events at all, so the onPress
    //    branch that shows the hint and moves focus to the field is dead —
    //    an unarmed member clicking it gets silence, mouse or keyboard.
    //
    // NOTE: this must be asserted on the ATTRIBUTE. jsdom does not implement
    // the disabled-blocks-focus rule (verified: it happily focuses a disabled
    // button), so a document.activeElement assertion would pass vacuously here
    // while the control stayed unreachable in every real browser.
    const { getByLabelText } = panel();
    expect(getByLabelText("Permanently delete my account")).not.toHaveAttribute(
      "disabled",
    );
  });

  it("stays in the Tab order", () => {
    const { getByLabelText } = panel();
    expect(getByLabelText("Permanently delete my account")).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("explains itself when pressed before it is armed", () => {
    // The behaviour the disabled attribute silently kills.
    const { getByLabelText, getByTestId } = panel();
    const trigger = getByLabelText("Permanently delete my account");

    act(() => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(getByTestId("delete-status")).toHaveTextContent(
      /type the word DELETE in the box above/i,
    );
  });
});

describe("delete-account trigger, armed", () => {
  it("drops aria-disabled once the confirm word is typed", () => {
    const { getByLabelText } = panel();
    const input = getByLabelText("Type DELETE to confirm") as HTMLInputElement;

    typeConfirm(input, "DELETE");

    const trigger = getByLabelText("Permanently delete my account");
    expect(trigger).not.toHaveAttribute("aria-disabled", "true");
    expect(trigger).not.toHaveAttribute("disabled");
  });

  it("puts focus on the SAFE control when the last check opens", () => {
    // The a11y reviewer flagged this as the one safety-critical sequence the
    // web project did not cover. It matters HERE specifically: focus order is
    // exactly what react-test-renderer cannot see, so the native suite's
    // version of this test is checking a callback, not the document.
    const { getByLabelText } = panel();
    const input = getByLabelText("Type DELETE to confirm") as HTMLInputElement;
    typeConfirm(input, "DELETE");

    act(() => {
      getByLabelText("Permanently delete my account").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(document.activeElement).toBe(getByLabelText("Cancel"));
  });

  it("does not delete on a second Enter after arming", () => {
    // A keyboard member who holds/double-taps Enter must not destroy their
    // account: the second keystroke has to land on Cancel, not on confirm.
    const onDelete = jest.fn(async () => {});
    const { getByLabelText } = mount(
      <DeleteAccountPanel
        onExport={() => {}}
        onDelete={onDelete}
        onCancel={() => {}}
      />,
    );
    const input = getByLabelText("Type DELETE to confirm") as HTMLInputElement;
    typeConfirm(input, "DELETE");

    const trigger = getByLabelText("Permanently delete my account");
    act(() => {
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Whatever now holds focus, a repeat activation must not be the delete.
    act(() => {
      (document.activeElement as HTMLElement)?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("accepts the confirm word case-insensitively and trimmed", () => {
    const { getByLabelText, getByTestId } = panel();
    const input = getByLabelText("Type DELETE to confirm") as HTMLInputElement;

    typeConfirm(input, "  delete ");

    expect(getByTestId("delete-status")).toHaveTextContent(/Ready\./i);
  });
});
