import React from "react";
import { render } from "@testing-library/react-native";
import { JourneyEntryCard } from "../../src/components/JourneyEntryCard";
import type { JourneyEntry } from "../../src/lib/social";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

function makeEntry(overrides: Partial<JourneyEntry> = {}): JourneyEntry {
  return {
    id: "j1",
    author_id: "u1",
    title: "Five years, three ablations, one steady heart",
    body: "When I was first diagnosed I thought my life was over. It wasn't.",
    is_published: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    author: { display_name: "Marcus", role: "patient" },
    upbeat_count: 210,
    ...overrides,
  };
}

describe("JourneyEntryCard", () => {
  it("shows title and a body preview", () => {
    const { getByText } = render(
      <JourneyEntryCard entry={makeEntry()} showStatus onPress={jest.fn()} />,
    );
    expect(
      getByText("Five years, three ablations, one steady heart"),
    ).toBeTruthy();
    expect(getByText(/first diagnosed/)).toBeTruthy();
  });

  it("status is TEXT, never color alone: Draft for drafts", () => {
    const { getByText } = render(
      <JourneyEntryCard entry={makeEntry()} showStatus onPress={jest.fn()} />,
    );
    expect(getByText("Draft")).toBeTruthy();
  });

  it("status shows Published for published entries", () => {
    const { getByText, queryByText } = render(
      <JourneyEntryCard
        entry={makeEntry({ is_published: true })}
        showStatus
        onPress={jest.fn()}
      />,
    );
    expect(getByText(/Published/)).toBeTruthy();
    expect(queryByText("Draft")).toBeNull();
  });

  it("shows the upbeat count as text", () => {
    const { getByText } = render(
      <JourneyEntryCard
        entry={makeEntry({ is_published: true })}
        onPress={jest.fn()}
      />,
    );
    expect(getByText(/210/)).toBeTruthy();
  });

  it("is an accessible button named by the title, ≥44px", () => {
    const { getByRole } = render(
      <JourneyEntryCard entry={makeEntry()} showStatus onPress={jest.fn()} />,
    );
    const card = getByRole("button", { name: /one steady heart/i });
    expect(flatten(card.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("carries NO disclaimer band — journey pages are lived stories, not education", () => {
    const { queryByTestId } = render(
      <JourneyEntryCard
        entry={makeEntry({
          author: { display_name: "Dr. Lee", role: "professional" },
        })}
        showStatus
        onPress={jest.fn()}
      />,
    );
    expect(queryByTestId("disclaimer-band")).toBeNull();
  });
});
