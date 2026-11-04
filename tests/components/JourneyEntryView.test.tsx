import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { JourneyEntryView } from "../../src/components/JourneyEntryView";
import type { JourneyEntry } from "../../src/lib/social";
import { tokens } from "../../src/theme/tokens";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

function makeEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: "j1",
    author_id: "u1",
    title: "What my ICD taught me about fear",
    body: "The first months were the hardest. I kept waiting for the shock.",
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: { display_name: "Marcus", role: "patient" },
    upbeat_count: 156,
    ...overrides,
  };
}

function renderView(props: Partial<React.ComponentProps<typeof JourneyEntryView>> = {}) {
  return render(
    <JourneyEntryView
      entry={makeEntry()}
      isOwner={false}
      upbeated={false}
      onToggleUpbeat={jest.fn().mockResolvedValue(undefined)}
      onEdit={jest.fn()}
      onTogglePublish={jest.fn()}
      onDelete={jest.fn()}
      {...props}
    />,
  );
}

describe("JourneyEntryView — long-form reading (Brand v2 §3)", () => {
  it("body reads at 18px with ≥1.6 line-height in Atkinson Hyperlegible", () => {
    const { getByTestId } = renderView();
    const body = flatten(getByTestId("journey-body").props.style);
    expect(body.fontSize).toBe(18);
    expect(body.lineHeight).toBeGreaterThanOrEqual(28.8);
    expect(body.fontFamily).toBe("AtkinsonHyperlegible_400Regular");
  });

  it("reading measure is capped (~70ch)", () => {
    const { getByTestId } = renderView();
    const measure = flatten(getByTestId("journey-measure").props.style);
    expect(measure.maxWidth).toBeLessThanOrEqual(680);
  });

  it("has an upbeat control and NO disclaimer band (decision b pinned)", () => {
    const { getByRole, queryByTestId } = renderView();
    expect(getByRole("button", { name: /upbeat/i })).toBeTruthy();
    expect(queryByTestId("disclaimer-band")).toBeNull();
  });

  it("non-owners get no edit/publish/delete controls", () => {
    const { queryByRole } = renderView({ isOwner: false });
    expect(queryByRole("button", { name: /delete/i })).toBeNull();
    expect(queryByRole("button", { name: /edit/i })).toBeNull();
    expect(queryByRole("button", { name: /publish/i })).toBeNull();
  });
});

describe("JourneyEntryView — owner controls and the destructive pattern", () => {
  it("owner of a draft sees Edit and Publish", () => {
    const onTogglePublish = jest.fn();
    const { getByRole } = renderView({
      isOwner: true,
      entry: makeEntry({ is_published: false }),
      onTogglePublish,
    });
    expect(getByRole("button", { name: /edit/i })).toBeTruthy();
    fireEvent.press(getByRole("button", { name: /^publish$/i }));
    expect(onTogglePublish).toHaveBeenCalledTimes(1);
  });

  it("owner of a published entry sees Unpublish", () => {
    const { getByRole } = renderView({
      isOwner: true,
      entry: makeEntry({ is_published: true }),
    });
    expect(getByRole("button", { name: /unpublish/i })).toBeTruthy();
  });

  it("delete NEVER fires on first press — a confirmation step is required", () => {
    const onDelete = jest.fn();
    const { getByRole, getByText } = renderView({ isOwner: true, onDelete });
    fireEvent.press(getByRole("button", { name: /delete this entry/i }));
    expect(onDelete).not.toHaveBeenCalled();
    // the confirmation says what happens, in words
    expect(getByText(/deletes the entry for good/i)).toBeTruthy();
    expect(getByText(/no undo/i)).toBeTruthy();
    fireEvent.press(getByRole("button", { name: /yes, delete it/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("Keep it cancels the confirmation without deleting", () => {
    const onDelete = jest.fn();
    const { getByRole, queryByText } = renderView({ isOwner: true, onDelete });
    fireEvent.press(getByRole("button", { name: /delete this entry/i }));
    fireEvent.press(getByRole("button", { name: /keep it/i }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(queryByText(/deletes the entry for good/i)).toBeNull();
  });

  it("the confirm button wears the v3 destructive treatment (Paper fill, Pulse Red border)", () => {
    const { getByRole } = renderView({ isOwner: true });
    fireEvent.press(getByRole("button", { name: /delete this entry/i }));
    const confirm = getByRole("button", { name: /yes, delete it/i });
    const style = flatten(confirm.props.style);
    expect(style.backgroundColor).toBe(tokens.paper);
    expect(style.borderColor).toBe(tokens.pulse);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
  });
});
