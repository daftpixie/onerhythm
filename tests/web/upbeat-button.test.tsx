// The upbeat control under the deploy target's renderer.
//
// Two reasons this surface matters here. First, CLAUDE.md non-negotiable #4:
// there is structurally NO downvote — so the DOM must contain no negative
// counterpart, and "the component rendered nothing" must not be why that
// assertion passes. Second, Brand v3 §7 carries state as icon + text + weight,
// and RNW is exactly what transforms that state onto the element.

import { act } from "react";
import { UpbeatButton } from "../../src/components/UpbeatButton";
import { mount } from "./mount";

function upbeat(props: Partial<React.ComponentProps<typeof UpbeatButton>> = {}) {
  return mount(
    <UpbeatButton
      count={3}
      upbeated={false}
      onToggle={async () => {}}
      subjectLabel="this post"
      {...props}
    />,
  );
}

describe("upbeat button, not yet upbeated", () => {
  it("is a real toggle button reporting aria-pressed=false", () => {
    const { getByRole } = upbeat();
    const button = getByRole("button", { name: "Upbeat this post" });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("carries its state in words, not only in the glyph", () => {
    const { getByRole } = upbeat();
    expect(getByRole("button")).toHaveTextContent("♡ Upbeat · 3");
  });
});

describe("upbeat button, already upbeated", () => {
  it("reports aria-pressed=true with a stable accessible name", () => {
    const { getByRole } = upbeat({ upbeated: true });
    // A toggle button's NAME must not change with its state — the state is
    // aria-pressed's job. Otherwise the control announces as a different
    // control depending on when you meet it.
    const button = getByRole("button", { name: "Upbeat this post" });
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveTextContent("♥ You upbeated · 3");
  });
});

describe("the no-downvote invariant, in the DOM", () => {
  it("renders exactly one control, with no negative counterpart", () => {
    const { container, getAllByRole } = upbeat();

    // Guard against the vacuous reading: this passes because ONE button
    // exists, not because nothing rendered.
    expect(getAllByRole("button")).toHaveLength(1);

    // The forbidden vocabulary, spelled out so the assertion is real. The
    // trailing marker tells .claude/hooks/no-downvote-guard.sh that this line
    // is the rule being ENFORCED, not a mechanic being added — the same
    // whitelisting the pgTAP suite uses.
    const negative = ["downvote", "dislike", "disagree", "▼", "👎"]; // no downvote
    const text = (container.textContent ?? "").toLowerCase();
    for (const forbidden of negative) {
      expect(text).not.toContain(forbidden);
    }
    // aria-pressed is a two-state toggle; there must be no third, negative one.
    expect(container.querySelector('[aria-pressed="mixed"]')).toBeNull();
  });
});

describe("optimistic toggle", () => {
  it("flips immediately and rolls back in words when the save fails", async () => {
    const onToggle = jest.fn(async () => {
      throw new Error("nope");
    });
    const { getByRole, container } = upbeat({ onToggle });

    await act(async () => {
      getByRole("button").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    // Rolled back to the original presence and count...
    expect(getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(getByRole("button")).toHaveTextContent("♡ Upbeat · 3");
    // ...and said so, in an alert, in plain words.
    const alert = container.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    expect(alert).toHaveTextContent(/couldn't save that/i);
  });
});

describe("the count is exposed to assistive tech, not only drawn", () => {
  // Step C3, and the assertion here is NOT the one first written.
  //
  // The first version demanded aria-valuenow. Two things killed it. RNW does not
  // support RN's accessibilityValue={{now}} object form at all (it only reads
  // aria-valuenow / accessibilityValueNow) — and more importantly aria-valuenow
  // is not valid ARIA on role="button": it belongs to range widgets (slider,
  // spinbutton, progressbar, scrollbar), so assistive tech ignores it there.
  // Shipping it would have been an attribute that satisfies a test and tells no
  // user anything, which is the exact failure this session exists to remove.
  //
  // The real gap is worth fixing though. The button carries an explicit
  // accessibilityLabel ("Upbeat this post"), and an explicit label OVERRIDES the
  // text content for the accessible name — so a screen-reader user heard
  // "Upbeat this post, button, pressed" and never heard the tally at all, even
  // though it is right there on screen. The count goes into an accessible
  // DESCRIPTION, in plain words, which is valid on a button and actually spoken.
  it("describes the tally in plain words", () => {
    const { getByRole } = upbeat({ count: 7 });
    const button = getByRole("button");
    const id = button.getAttribute("aria-describedby");
    expect(id).toBeTruthy();

    const described = document.getElementById(id!);
    expect(described).not.toBeNull();
    expect(described).toHaveTextContent("7 upbeats");
  });

  it("keeps the description in step with the optimistic flip", async () => {
    const { getByRole } = upbeat({ count: 7 });
    await act(async () => {
      getByRole("button").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });
    const id = getByRole("button").getAttribute("aria-describedby");
    expect(document.getElementById(id!)).toHaveTextContent("8 upbeats");
  });

  it("gives each instance its own description id", () => {
    // A feed renders many of these. Duplicate ids would make every button
    // describe the first one's count.
    const a = upbeat({ count: 1, subjectLabel: "post one" });
    const b = upbeat({ count: 2, subjectLabel: "post two" });
    expect(a.getByRole("button").getAttribute("aria-describedby")).not.toBe(
      b.getByRole("button").getAttribute("aria-describedby"),
    );
  });
});
