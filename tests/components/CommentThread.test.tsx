import React from "react";
import { render } from "@testing-library/react-native";
import { CommentThread } from "../../src/components/CommentThread";
import type { CommentTreeNode } from "../../src/lib/social";

function flatten(style: unknown) {
  return Array.isArray(style)
    ? Object.assign({}, ...(style as object[]).filter(Boolean))
    : (style as object) || {};
}

function node(
  id: string,
  authorName: string,
  children: CommentTreeNode[] = [],
  role: "patient" | "professional" = "patient",
): CommentTreeNode {
  return {
    id,
    post_id: "p1",
    parent_comment_id: null,
    body: `Comment ${id}`,
    created_at: new Date().toISOString(),
    author: { display_name: authorName, role },
    upbeat_count: 2,
    children,
  };
}

// c1 (Rosa)
//  └ c2 (Marcus)
//     └ c3 (Dr. Lee, professional)
//        └ c4 └ c5 └ c6   (deep chain past the visual cap)
const tree: CommentTreeNode[] = [
  node("c1", "Rosa", [
    node("c2", "Marcus", [
      node(
        "c3",
        "Dr. Lee",
        [node("c4", "Ana", [node("c5", "Ben", [node("c6", "Cal")])])],
        "professional",
      ),
    ]),
  ]),
];

function renderThread() {
  return render(
    <CommentThread
      nodes={tree}
      myUpbeatedIds={[]}
      onToggleUpbeat={jest.fn().mockResolvedValue(undefined)}
      onReply={jest.fn()}
    />,
  );
}

describe("CommentThread — nesting on a narrow canvas", () => {
  it("a reply renders nested under its parent (depth indent)", () => {
    const { getByTestId } = renderThread();
    expect(flatten(getByTestId("comment-c1").props.style).marginLeft).toBe(0);
    expect(flatten(getByTestId("comment-c2").props.style).marginLeft).toBe(12);
  });

  it("a reply-to-reply renders at depth 2", () => {
    const { getByTestId } = renderThread();
    expect(flatten(getByTestId("comment-c3").props.style).marginLeft).toBe(24);
  });

  it("indent caps at depth 4; deeper replies say who they answer instead", () => {
    const { getByTestId, getByText } = renderThread();
    // depth 4 = the cap
    expect(flatten(getByTestId("comment-c5").props.style).marginLeft).toBe(48);
    // depth 5 stays at the cap and names its parent in plain words
    expect(flatten(getByTestId("comment-c6").props.style).marginLeft).toBe(48);
    expect(getByText(/Replying to Ben/)).toBeTruthy();
  });

  it("a professional comment wears the Verified label and the disclaimer band", () => {
    const { getAllByTestId, getByText } = renderThread();
    expect(getByText(/verified/i)).toBeTruthy();
    expect(getAllByTestId("disclaimer-band").length).toBeGreaterThanOrEqual(1);
  });

  it("every comment has its own upbeat control and an accessible reply action", () => {
    const { getAllByRole, getByRole } = renderThread();
    const upbeats = getAllByRole("button", { name: /upbeat/i });
    expect(upbeats).toHaveLength(6);
    expect(getByRole("button", { name: /reply to rosa/i })).toBeTruthy();
  });
});
