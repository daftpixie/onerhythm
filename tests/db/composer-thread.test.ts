/**
 * @jest-environment node
 *
 * Phase 1D: the composer creates a post in the CHOSEN community with the
 * SESSION user as author (spoofing another author is refused by RLS WITH
 * CHECK), and comments thread by parent: a reply nests under its parent and a
 * reply-to-reply sits at depth 2 in the built tree.
 */
import { createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  listCommunities,
  createPost,
  getPost,
  createComment,
  listComments,
  buildCommentTree,
} from "../../src/lib/social";

describe("post composer (db contract)", () => {
  it("creates the post in the chosen community, authored by the session user", async () => {
    const user = await createTestUser();
    const other = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);
      const communities = await listCommunities(client);
      const longQt = communities.find((c) => c.slug === "long-qt")!;
      expect(longQt).toBeTruthy();

      const created = await createPost(client, {
        communityId: longQt.id,
        title: "Composer contract test",
        body: "Written through the composer path.",
      });

      const post = await getPost(client, created.id);
      expect(post).not.toBeNull();
      expect(post!.community?.id).toBe(longQt.id);
      expect(post!.title).toBe("Composer contract test");

      // author is the session user, verified at the row level
      const { data: raw } = await client
        .from("posts")
        .select("author_id")
        .eq("id", created.id)
        .single();
      expect(raw?.author_id).toBe(user.id);

      // spoofing another member as author is refused (RLS WITH CHECK)
      const { error: spoof } = await client.from("posts").insert({
        author_id: other.id,
        community_id: longQt.id,
        title: "spoofed",
        body: "not mine to claim",
      });
      expect(spoof?.code).toBe("42501");
    } finally {
      await deleteTestUser(user.id);
      await deleteTestUser(other.id);
    }
  });
});

describe("comment threading (db contract)", () => {
  it("a reply nests under its parent; a reply-to-reply lands at depth 2", async () => {
    const user = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);
      const communities = await listCommunities(client);
      const longQt = communities.find((c) => c.slug === "long-qt")!;

      const post = await createPost(client, {
        communityId: longQt.id,
        title: "Threading contract test",
        body: "Root post.",
      });

      const root = await createComment(client, {
        postId: post.id,
        body: "Top-level comment.",
      });
      const reply = await createComment(client, {
        postId: post.id,
        parentCommentId: root.id,
        body: "A reply to the top-level comment.",
      });
      const replyToReply = await createComment(client, {
        postId: post.id,
        parentCommentId: reply.id,
        body: "A reply to the reply.",
      });

      const rows = await listComments(client, post.id);
      expect(rows).toHaveLength(3);

      const tree = buildCommentTree(rows);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(root.id);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].id).toBe(reply.id);
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].id).toBe(replyToReply.id);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
