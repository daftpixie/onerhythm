/**
 * @jest-environment node
 *
 * Phase 1D invariant: the upbeat is a PRESENCE/ABSENCE row. Add then remove
 * works; a duplicate is impossible at the DB (23505) and the toggle helper
 * resolves it as a handled state, never a crash; the score is exactly the
 * count of presence rows. Same contract for post and comment subjects.
 */
import { createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  listCommunities,
  createPost,
  createComment,
  addUpbeat,
  removeUpbeat,
  listMyUpbeats,
} from "../../src/lib/social";

async function upbeatCount(
  client: Awaited<ReturnType<typeof signInAs>>,
  subject: { post_id: string } | { comment_id: string },
): Promise<number> {
  const { count, error } = await client
    .from("upbeats")
    .select("*", { count: "exact", head: true })
    .match(subject);
  expect(error).toBeNull();
  return count ?? 0;
}

describe("upbeat toggle (presence/absence only)", () => {
  it("adds, refuses duplicates as a handled state, and removes — for a post", async () => {
    const user = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);
      const communities = await listCommunities(client);
      const svt = communities.find((c) => c.slug === "svt")!;
      expect(svt).toBeTruthy();

      const post = await createPost(client, {
        communityId: svt.id,
        title: "Upbeat toggle test post",
        body: "Presence/absence only.",
      });

      // add
      await expect(addUpbeat(client, { postId: post.id })).resolves.toBe(
        "added",
      );
      expect(await upbeatCount(client, { post_id: post.id })).toBe(1);

      // a raw duplicate hits the unique constraint (the DB is the arbiter)
      const { error: dup } = await client
        .from("upbeats")
        .insert({ member_id: user.id, post_id: post.id });
      expect(dup?.code).toBe("23505");

      // …and the helper resolves the same race as "already", not a throw
      await expect(addUpbeat(client, { postId: post.id })).resolves.toBe(
        "already",
      );
      expect(await upbeatCount(client, { post_id: post.id })).toBe(1);

      // my-upbeats reflects presence
      const mine = await listMyUpbeats(client, { postIds: [post.id] });
      expect(mine.postIds).toContain(post.id);

      // remove is idempotent row deletion
      await removeUpbeat(client, { postId: post.id });
      expect(await upbeatCount(client, { post_id: post.id })).toBe(0);
      await expect(
        removeUpbeat(client, { postId: post.id }),
      ).resolves.toBeUndefined();

      const gone = await listMyUpbeats(client, { postIds: [post.id] });
      expect(gone.postIds).not.toContain(post.id);
    } finally {
      await deleteTestUser(user.id);
    }
  });

  it("runs the same presence cycle on a comment", async () => {
    const user = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);
      const communities = await listCommunities(client);
      const svt = communities.find((c) => c.slug === "svt")!;

      const post = await createPost(client, {
        communityId: svt.id,
        title: "Comment upbeat test post",
        body: "Body.",
      });
      const comment = await createComment(client, {
        postId: post.id,
        body: "A comment worth an upbeat.",
      });

      await expect(addUpbeat(client, { commentId: comment.id })).resolves.toBe(
        "added",
      );
      expect(await upbeatCount(client, { comment_id: comment.id })).toBe(1);

      await expect(addUpbeat(client, { commentId: comment.id })).resolves.toBe(
        "already",
      );
      expect(await upbeatCount(client, { comment_id: comment.id })).toBe(1);

      const mine = await listMyUpbeats(client, { commentIds: [comment.id] });
      expect(mine.commentIds).toContain(comment.id);

      await removeUpbeat(client, { commentId: comment.id });
      expect(await upbeatCount(client, { comment_id: comment.id })).toBe(0);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
