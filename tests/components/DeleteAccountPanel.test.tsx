import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { DeleteAccountPanel } from "../../src/components/DeleteAccountPanel";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

function allText(tree: ReturnType<typeof render>): string {
  const walk = (n: { children: unknown[] }): string =>
    n.children
      .map((c) =>
        typeof c === "string" ? c : walk(c as { children: unknown[] }),
      )
      .join(" ");
  return walk(tree.UNSAFE_root as unknown as { children: unknown[] });
}

const noop = () => {};
const props = {
  onExport: noop,
  onDelete: jest.fn().mockResolvedValue(undefined),
  onCancel: noop,
};

describe("DeleteAccountPanel — B13, a destructive flow at WCAG 2.2 AA", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("the type-to-confirm gate", () => {
    it("keeps the destructive control INERT until the word is actually typed", () => {
      const { getByRole, getByLabelText, queryByText } = render(
        <DeleteAccountPanel {...props} />,
      );
      const field = getByLabelText(/type delete to confirm/i);
      for (const near of ["", "DELET", "DELETEE", "delet", "remove", "D E L E T E"]) {
        fireEvent.changeText(field, near);
        // Behavioural, not prop-level: pressing must not open the final
        // confirmation for any near-miss. This used to assert
        // accessibilityState.disabled — a prop that is inert on web, so the
        // assertion could pass while the browser build was broken (ADR 0014).
        fireEvent.press(getByRole("button", { name: /permanently delete/i }));
        expect(queryByText(/last check/i)).toBeNull();
      }
    });

    // AMENDED after the a11y reviewer FALSIFIED the original assertion, which
    // required an exact-case "DELETE". SC 3.3.4 is already satisfied by the
    // "Last check" region, so the typed word is our own belt-and-braces — and
    // `autoCapitalize` is only a soft-keyboard hint, so on a laptop it does
    // nothing. The original rule would have stranded a 65+ member who typed the
    // natural thing, with no way out and no explanation. Case and surrounding
    // whitespace must not decide whether someone can leave.
    it("accepts the word however it is typed or pasted", () => {
      for (const ok of ["DELETE", "delete", "Delete", "DELETE ", " DELETE", " delete "]) {
        const tree = render(<DeleteAccountPanel {...props} />);
        fireEvent.changeText(
          tree.getByLabelText(/type delete to confirm/i),
          ok,
        );
        const button = tree.getByRole("button", {
          name: /permanently delete/i,
        });
        // The control must never carry a literal `disabled` prop. On web that
        // becomes a real disabled attribute on a real <button>, which is out of
        // the Tab order AND receives no clicks — see ADR 0014.
        expect(button.props.disabled).toBeUndefined();
        // Armed means it actually opens the final confirmation.
        fireEvent.press(button);
        expect(tree.queryByText(/last check/i)).not.toBeNull();
        tree.unmount();
      }
    });

    // Also from the reviewer: react-native-web sets tabIndex={-1} when the
    // `disabled` prop is set, dropping the control out of Tab order — a
    // keyboard-only member without a screen reader tabs straight past it and
    // never learns why it is grey.
    //
    // ADR 0014 went further: aria-disabled does NOT keep it reachable either,
    // because on a role="button" element RNW pairs it with a real `disabled`
    // attribute. So the state is carried in words instead, via an accessible
    // description. The DOM-level half of this is
    // tests/web/delete-account.test.tsx; only that one can see the attribute.
    it("stays keyboard-reachable while inert, and explains itself when pressed", () => {
      const focused: string[] = [];
      const tree = render(
        <DeleteAccountPanel
          {...props}
          onFocusForTest={(who: string) => focused.push(who)}
        />,
      );
      const button = tree.getByRole("button", { name: /permanently delete/i });
      // NOT the `disabled` prop — that is what removes it from Tab order.
      expect(button.props.disabled).toBeFalsy();
      // ...and NOT aria-disabled either, which would drag a real disabled
      // attribute onto the <button> on web.
      expect(button.props.accessibilityDisabled).toBeUndefined();
      // The precondition is carried in words, pointed at by description.
      expect(button.props["aria-describedby"]).toBe("delete-precondition");

      fireEvent.press(button);
      // sends the member to the field rather than doing nothing at all
      expect(focused[focused.length - 1]).toBe("field");
      expect(allText(tree)).toMatch(/capital letters are not required/i);
    });

    it("arms the control on an exact match, and announces it politely", () => {
      const { getByRole, getByLabelText, getByTestId } = render(
        <DeleteAccountPanel {...props} />,
      );
      fireEvent.changeText(getByLabelText(/type delete to confirm/i), "DELETE");
      // Armed is observable as behaviour: the final confirmation opens.
      fireEvent.press(getByRole("button", { name: /permanently delete/i }));
      expect(getByTestId("delete-confirm")).toBeTruthy();
      // polite, never assertive — this must not interrupt a screen reader
      expect(getByTestId("delete-status").props.accessibilityLiveRegion).toBe(
        "polite",
      );
    });

    it("does not delete while inert, however hard the control is pressed", () => {
      const onDelete = jest.fn().mockResolvedValue(undefined);
      const { getByRole } = render(
        <DeleteAccountPanel {...props} onDelete={onDelete} />,
      );
      fireEvent.press(getByRole("button", { name: /permanently delete/i }));
      expect(onDelete).not.toHaveBeenCalled();
    });

    it("allows paste and imposes no time limit (SC 2.2.1, 3.3.7)", () => {
      const { getByLabelText } = render(<DeleteAccountPanel {...props} />);
      const field = getByLabelText(/type delete to confirm/i);
      // a paste arrives as a single changeText of the whole string
      fireEvent.changeText(field, "DELETE");
      expect(field.props.value).toBe("DELETE");
      expect(field.props.editable).not.toBe(false);
    });
  });

  describe("the final confirmation region", () => {
    function arm(tree: ReturnType<typeof render>) {
      fireEvent.changeText(
        tree.getByLabelText(/type delete to confirm/i),
        "DELETE",
      );
      fireEvent.press(tree.getByRole("button", { name: /permanently delete/i }));
      return tree;
    }

    it("announces politely and offers a safe way out", () => {
      const tree = arm(render(<DeleteAccountPanel {...props} />));
      expect(tree.getByTestId("delete-confirm").props.accessibilityLiveRegion).toBe(
        "polite",
      );
      expect(tree.getByRole("button", { name: /^cancel$/i })).toBeTruthy();
    });

    // From the reviewer: a live region inserted into the DOM with its text
    // ALREADY inside it is, on most browser/AT pairs, never announced. Only a
    // change WITHIN an already-mounted region is. So the region must exist from
    // first render and gain its text later — otherwise the single most
    // consequential warning in the app is silent.
    it("mounts the live region empty, so its text is a change and not an arrival", () => {
      const tree = render(<DeleteAccountPanel {...props} />);
      const region = tree.getByTestId("delete-confirm");
      expect(region.props.accessibilityLiveRegion).toBe("polite");
      // present before confirming, and carrying no announcement yet
      expect(allText(tree)).not.toMatch(/last check/i);
      arm(tree);
      expect(allText(tree)).toMatch(/last check/i);
    });

    // Also from the reviewer: the trigger used to stay mounted and ENABLED
    // underneath the confirm box, leaving a second, identically alarming
    // destructive control one Tab away from the safe one.
    it("leaves exactly one destructive control on screen while confirming", () => {
      const tree = arm(render(<DeleteAccountPanel {...props} />));
      expect(
        tree.queryByRole("button", { name: /permanently delete/i }),
      ).toBeNull();
      expect(
        tree.getByRole("button", { name: /yes, delete my account/i }),
      ).toBeTruthy();
    });

    it("puts focus on the SAFE control, never the destructive one", () => {
      const focused: string[] = [];
      const tree = render(
        <DeleteAccountPanel
          {...props}
          onFocusForTest={(who: string) => focused.push(who)}
        />,
      );
      arm(tree);
      expect(focused[focused.length - 1]).toBe("cancel");
    });

    it("returns focus to the trigger when dismissed", () => {
      const focused: string[] = [];
      const tree = render(
        <DeleteAccountPanel
          {...props}
          onFocusForTest={(who: string) => focused.push(who)}
        />,
      );
      arm(tree);
      fireEvent.press(tree.getByRole("button", { name: /^cancel$/i }));
      expect(focused[focused.length - 1]).toBe("trigger");
    });

    it("deletes only after the final confirmation", async () => {
      const onDelete = jest.fn().mockResolvedValue(undefined);
      const tree = arm(
        render(<DeleteAccountPanel {...props} onDelete={onDelete} />),
      );
      expect(onDelete).not.toHaveBeenCalled();
      fireEvent.press(tree.getByRole("button", { name: /yes, delete my account/i }));
      await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    });
  });

  describe("export is offered first", () => {
    it("offers the download before the destructive control", () => {
      const onExport = jest.fn();
      const { getByRole } = render(
        <DeleteAccountPanel {...props} onExport={onExport} />,
      );
      fireEvent.press(getByRole("button", { name: /download my data/i }));
      expect(onExport).toHaveBeenCalled();
    });

    it("says a copy can be taken first, in plain words", () => {
      const text = allText(render(<DeleteAccountPanel {...props} />));
      expect(text).toMatch(/want a copy first/i);
    });
  });

  describe("what gets deleted, in plain words", () => {
    it("lists every category the cascade actually removes", () => {
      const text = allText(render(<DeleteAccountPanel {...props} />));
      for (const item of [
        /account/i,
        /posts/i,
        /comments/i,
        /upbeats/i,
        /journey/i,
        /self-ID|tags/i,
        /consent/i,
      ]) {
        expect(text).toMatch(item);
      }
      expect(text).toMatch(/permanent|can't undo|cannot be undone/i);
    });
  });

  // The copy guard. These are exactly the promises that drift back in, and the
  // system cannot keep any of them: there is no backup-purge automation, no
  // SMTP, and no governance or treasury tables for anything to persist in.
  describe("makes no promise the system cannot keep", () => {
    it("claims nothing about backups", () => {
      const text = allText(render(<DeleteAccountPanel {...props} />));
      expect(text).not.toMatch(/backup/i);
      expect(text).not.toMatch(/30 days/i);
    });

    it("promises no confirmation email", () => {
      const text = allText(render(<DeleteAccountPanel {...props} />));
      // WIDENED by the ADR 0013 audit. This previously matched three exact
      // phrasings — /we'll email|we will email|email you when/ — and a
      // deliberate violation reading "when you're signed out, we email you and
      // it's done" sailed straight through it. An assertion that only catches
      // the wordings someone happened to think of is not an invariant.
      //
      // There is no legitimate reason for this panel to say "email" or "inbox"
      // at all: it currently promises nothing, and the honest copy is "we can't
      // send you a confirmation message yet". So forbid the vocabulary outright
      // and let a future SMTP change fail here deliberately.
      expect(text).not.toMatch(/\be-?mails?\b|\binbox\b|we'?ll write|on its way/i);
    });

    it("does not claim we keep anonymized voting or treasury records", () => {
      const text = allText(render(<DeleteAccountPanel {...props} />));
      expect(text).not.toMatch(/anonymi[sz]ed|aggregate|treasury|voting record/i);
    });

    it("uses contribution vocabulary, never donation", () => {
      const text = allText(render(<DeleteAccountPanel {...props} />));
      expect(text).not.toMatch(/donat/i);
    });
  });

  describe("errors and targets", () => {
    it("reports failure in words, in an alert, and stays on the screen", async () => {
      const onDelete = jest.fn().mockRejectedValue(new Error("network down"));
      const tree = render(<DeleteAccountPanel {...props} onDelete={onDelete} />);
      fireEvent.changeText(
        tree.getByLabelText(/type delete to confirm/i),
        "DELETE",
      );
      fireEvent.press(tree.getByRole("button", { name: /permanently delete/i }));
      fireEvent.press(
        tree.getByRole("button", { name: /yes, delete my account/i }),
      );
      const alert = await tree.findByRole("alert");
      expect(alert).toBeTruthy();
      expect(allText(tree)).not.toMatch(/network down|error:|\b500\b/i);
    });

    it("gives every heading a level, so quick-nav can tell title from section", () => {
      const tree = render(<DeleteAccountPanel {...props} />);
      // The RNTL tree exposes a composite AND a host node for the same heading,
      // so dedupe by the text or "exactly one h1" counts each twice.
      const byText = new Map<string, number>();
      for (const h of tree.UNSAFE_root.findAll(
        (n) => n.props?.accessibilityRole === "header",
      )) {
        expect(h.props["aria-level"]).toBeGreaterThan(0);
        byText.set(String(h.props.children), h.props["aria-level"] as number);
      }
      const levels = [...byText.values()];
      expect(levels.length).toBeGreaterThan(1);
      // exactly one page title, and it outranks the sections
      expect(levels.filter((l) => l === 1)).toHaveLength(1);
      expect(Math.max(...levels)).toBeGreaterThan(1);
    });

    it("every interactive control meets 44px", () => {
      const tree = render(<DeleteAccountPanel {...props} />);
      for (const name of [
        /download my data/i,
        /permanently delete/i,
        /^cancel$/i,
      ]) {
        const b = tree.getByRole("button", { name });
        expect(flatten(b.props.style).minHeight).toBeGreaterThanOrEqual(44);
      }
    });

    it("labels the confirm field visibly — never placeholder-as-label", () => {
      const tree = render(<DeleteAccountPanel {...props} />);
      expect(allText(tree)).toMatch(/type delete to confirm/i);
      const field = tree.getByLabelText(/type delete to confirm/i);
      expect(field.props.placeholder ?? "").not.toMatch(/type delete/i);
    });
  });
});
