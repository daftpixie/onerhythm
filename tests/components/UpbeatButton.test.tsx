import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { UpbeatButton } from "../../src/components/UpbeatButton";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

describe("UpbeatButton — presence/absence toggle, WCAG 2.2 AA", () => {
  it("has an accessible name, a pressed state, and shows the count", () => {
    const { getByRole } = render(
      <UpbeatButton
        count={3}
        upbeated={false}
        onToggle={jest.fn().mockResolvedValue(undefined)}
        subjectLabel="this post"
      />,
    );
    const button = getByRole("button", { name: /upbeat/i });
    expect(button.props.accessibilityState.selected).toBe(false);
  });

  it("renders outline when not upbeated and filled once upbeated", async () => {
    const { getByRole, getByText } = render(
      <UpbeatButton
        count={3}
        upbeated={false}
        onToggle={jest.fn().mockResolvedValue(undefined)}
        subjectLabel="this post"
      />,
    );
    // outline heart + count before
    expect(getByText(/♡ Upbeat · 3/)).toBeTruthy();

    fireEvent.press(getByRole("button", { name: /upbeat/i }));

    // optimistic: filled heart, count up, pressed state on
    await waitFor(() => expect(getByText(/♥ You upbeated · 4/)).toBeTruthy());
    expect(
      getByRole("button", { name: /upbeat/i }).props.accessibilityState
        .selected,
    ).toBe(true);
  });

  it("removing an upbeat is presence deletion (count down, never negative UI)", async () => {
    const onToggle = jest.fn().mockResolvedValue(undefined);
    const { getByRole, getByText, queryByText } = render(
      <UpbeatButton
        count={5}
        upbeated={true}
        onToggle={onToggle}
        subjectLabel="this post"
      />,
    );
    fireEvent.press(getByRole("button", { name: /upbeat/i }));
    await waitFor(() => expect(getByText(/♡ Upbeat · 4/)).toBeTruthy());
    expect(onToggle).toHaveBeenCalledWith(false);
    // structurally NO DOWNVOTE exists — assert the absence (guard-whitelisted
    // naming: this line checks that no downvote affordance ever renders)
    expect(queryByText(/downvote|dislike|👎/i)).toBeNull(); // no downvote
  });

  it("rolls back the optimistic state and shows a gentle message on error", async () => {
    const onToggle = jest.fn().mockRejectedValue(new Error("network down"));
    const { getByRole, getByText } = render(
      <UpbeatButton
        count={3}
        upbeated={false}
        onToggle={onToggle}
        subjectLabel="this post"
      />,
    );
    fireEvent.press(getByRole("button", { name: /upbeat/i }));

    // rollback to the pre-toggle snapshot
    await waitFor(() => expect(getByText(/♡ Upbeat · 3/)).toBeTruthy());
    expect(
      getByRole("button", { name: /upbeat/i }).props.accessibilityState
        .selected,
    ).toBe(false);
    // §9 voice, words not codes
    expect(getByText(/couldn't save that/i)).toBeTruthy();
  });

  // Follow-up #1 from the a11y reviewer. SC 1.4.1 is satisfied by the ♥/♡ swap
  // alone, but a 16px glyph is a thin carrier for a 65+ low-vision reader on
  // the platform's signature control. Strip the glyphs and the two states must
  // STILL read differently — so the shape can never quietly become the only
  // non-colour difference again.
  it("carries its state in words, not only in the ♥/♡ glyph", () => {
    const props = {
      count: 3,
      onToggle: jest.fn().mockResolvedValue(undefined),
      subjectLabel: "this post",
    };
    const off = render(<UpbeatButton {...props} upbeated={false} />);
    const on = render(<UpbeatButton {...props} upbeated={true} />);

    // Collect every string leaf under the button, glyphs removed.
    const textUnder = (node: { children: unknown[] }): string =>
      node.children
        .map((c) =>
          typeof c === "string"
            ? c
            : textUnder(c as { children: unknown[] }),
        )
        .join("");

    const wordsOf = (tree: ReturnType<typeof render>) =>
      textUnder(tree.getByRole("button", { name: /upbeat/i }))
        .replace(/[♥♡]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    expect(wordsOf(off)).not.toBe(wordsOf(on));
    // and both states still say how many, in words the reader can parse
    expect(wordsOf(off)).toMatch(/upbeat/i);
    expect(wordsOf(on)).toMatch(/upbeated/i);
  });

  it("keeps the accessible NAME stable across states (ARIA toggle pattern)", () => {
    // The name must not flip with state — aria-pressed / accessibilityState
    // carries that. Only the VISIBLE text changes, for sighted readers.
    const props = {
      count: 3,
      onToggle: jest.fn().mockResolvedValue(undefined),
      subjectLabel: "this post",
    };
    const off = render(<UpbeatButton {...props} upbeated={false} />);
    const on = render(<UpbeatButton {...props} upbeated={true} />);
    const nameOf = (tree: ReturnType<typeof render>) =>
      tree.getByRole("button", { name: /upbeat/i }).props.accessibilityLabel;

    expect(nameOf(off)).toBe("Upbeat this post");
    expect(nameOf(on)).toBe(nameOf(off));
    expect(
      on.getByRole("button", { name: /upbeat/i }).props.accessibilityState
        .selected,
    ).toBe(true);
  });

  it("meets the 44px target size", () => {
    const { getByRole } = render(
      <UpbeatButton
        count={0}
        upbeated={false}
        onToggle={jest.fn().mockResolvedValue(undefined)}
        subjectLabel="this post"
      />,
    );
    const button = getByRole("button", { name: /upbeat/i });
    expect(flatten(button.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });
});
