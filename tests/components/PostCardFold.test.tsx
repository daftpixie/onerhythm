// A folded card in the feed (a11y review B2 on build step 4; plan §4.8, Q8).
// A post that matches the reader's muted words, or the published crisis list,
// shows neither its title nor its preview in the feed: the card says why it is
// folded, and opening it leads to the same fold on the post's page. Nothing is
// hidden silently. Written failing first.
import React from "react";
import { render } from "@testing-library/react-native";
import { PostCard } from "../../src/components/PostCard";
import type { PostListItem } from "../../src/lib/social";

const post: PostListItem = {
  id: "p1",
  title: "ZZ-TITLE ablation",
  body: "ZZ-BODY",
  created_at: new Date().toISOString(),
  author: { display_name: "Marcus", role: "patient" },
  community: { id: "c1", name: "AFib", slug: "afib" },
  upbeat_count: 1,
  comment_count: 0,
};

describe("PostCard folding", () => {
  it("a muted post shows the word, not the title or preview", () => {
    const view = render(<PostCard post={post} onPress={jest.fn()} fold={{ kind: "muted", word: "ablation" }} />);
    expect(view.queryByText(/ZZ-TITLE/)).toBeNull();
    expect(view.queryByText(/ZZ-BODY/)).toBeNull();
    expect(view.getByText("Folded away because of the word 'ablation'. Open to see it.")).toBeTruthy();
    const button = view.getByRole("button");
    expect(button.props.accessibilityLabel ?? "").not.toMatch(/ZZ-TITLE/);
  });

  it("a crisis-matched post shows the gentle line, not the title or preview", () => {
    const view = render(<PostCard post={post} onPress={jest.fn()} fold={{ kind: "crisis" }} />);
    expect(view.queryByText(/ZZ-TITLE/)).toBeNull();
    expect(view.getByText("This post talks about very hard feelings. Open to see it.")).toBeTruthy();
  });
});
