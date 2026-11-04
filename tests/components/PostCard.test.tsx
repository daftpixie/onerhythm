import React from "react";
import { render } from "@testing-library/react-native";
import { PostCard } from "../../src/components/PostCard";
import type { PostListItem } from "../../src/lib/social";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

function makePost(overrides: Partial<PostListItem> = {}): PostListItem {
  return {
    id: "p1",
    title: "First week with my new pacemaker",
    body: "What I wish I'd known going in.",
    created_at: new Date().toISOString(),
    author: { display_name: "Marcus", role: "patient" },
    community: { id: "c1", name: "AFib", slug: "afib" },
    upbeat_count: 34,
    comment_count: 12,
    ...overrides,
  };
}

describe("PostCard", () => {
  it("shows community, author, title, and counts", () => {
    const { getByText } = render(
      <PostCard post={makePost()} onPress={jest.fn()} />,
    );
    expect(getByText(/AFib/)).toBeTruthy();
    expect(getByText(/Marcus/)).toBeTruthy();
    expect(getByText("First week with my new pacemaker")).toBeTruthy();
    expect(getByText(/34/)).toBeTruthy();
    expect(getByText(/12/)).toBeTruthy();
  });

  it("a professional author renders the Verified label AND the disclaimer band", () => {
    const { getByText, getByTestId } = render(
      <PostCard
        post={makePost({
          author: { display_name: "Dr. Lee", role: "professional" },
        })}
        onPress={jest.fn()}
      />,
    );
    expect(getByText(/verified/i)).toBeTruthy();
    expect(getByTestId("disclaimer-band")).toBeTruthy();
  });

  it("a patient author renders neither the badge nor the band", () => {
    const { queryByText, queryByTestId } = render(
      <PostCard post={makePost()} onPress={jest.fn()} />,
    );
    expect(queryByText(/verified/i)).toBeNull();
    expect(queryByTestId("disclaimer-band")).toBeNull();
  });

  it("is an accessible button named by the post title, ≥44px target", () => {
    const { getByRole } = render(
      <PostCard post={makePost()} onPress={jest.fn()} />,
    );
    const card = getByRole("button", {
      name: /first week with my new pacemaker/i,
    });
    expect(flatten(card.props.style).minHeight).toBeGreaterThanOrEqual(44);
  });

  it("has no report flag this slice (a flag that goes nowhere is worse than none)", () => {
    const { queryByText, queryByLabelText } = render(
      <PostCard post={makePost()} onPress={jest.fn()} />,
    );
    expect(queryByText(/⚑|report/i)).toBeNull();
    expect(queryByLabelText(/report/i)).toBeNull();
  });
});
