/**
 * @jest-environment node
 *
 * Phase 1D: the feed is the union of JOINED communities (recency order), and
 * membership is self-managed, exactly-once. Signed-out visitors see community
 * names but no posts (the approved anon surface; RLS returns zero rows).
 */
import { anonClient, createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  listCommunities,
  joinCommunity,
  leaveCommunity,
  getFeed,
  createPost,
} from "../../src/lib/social";

describe("signed-out (anon) surface", () => {
  it("shows community names but no posts and an empty feed", async () => {
    const anon = anonClient();

    const communities = await listCommunities(anon);
    expect(communities.length).toBeGreaterThan(0);
    expect(communities.some((c) => c.slug === "arvc")).toBe(true);

    // the feed is empty rather than an error
    await expect(getFeed(anon)).resolves.toEqual([]);

    // and the posts table yields zero rows (grant open, RLS closes rows)
    const { data, error } = await anon.from("posts").select("id").limit(5);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });
});

describe("feed = joined communities; membership exactly-once", () => {
  it("join → post appears; duplicate join is handled; leave → post gone", async () => {
    const author = await createTestUser();
    const reader = await createTestUser();
    try {
      const authorClient = await signInAs(author.email, author.password);
      const readerClient = await signInAs(reader.email, reader.password);

      const communities = await listCommunities(authorClient);
      const arvc = communities.find((c) => c.slug === "arvc")!;
      expect(arvc).toBeTruthy();

      await joinCommunity(authorClient, arvc.id);
      const post = await createPost(authorClient, {
        communityId: arvc.id,
        title: "Feed membership test post",
        body: "Only members of ARVC should see this in their feed.",
      });

      // the author (joined) sees their post in the feed, newest ordering
      const authorFeed = await getFeed(authorClient);
      expect(authorFeed.some((p) => p.id === post.id)).toBe(true);

      // a member with no memberships has an empty feed
      await expect(getFeed(readerClient)).resolves.toEqual([]);

      // joining brings the community's posts into the feed
      await joinCommunity(readerClient, arvc.id);
      const joinedFeed = await getFeed(readerClient);
      expect(joinedFeed.some((p) => p.id === post.id)).toBe(true);

      // a duplicate join is a handled no-op, and the row count stays exactly 1
      await expect(
        joinCommunity(readerClient, arvc.id),
      ).resolves.toBeUndefined();
      const { count: afterDup } = await readerClient
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .match({ member_id: reader.id, community_id: arvc.id });
      expect(afterDup).toBe(1);

      // leaving removes the membership and the posts from the feed
      await leaveCommunity(readerClient, arvc.id);
      const { count: afterLeave } = await readerClient
        .from("memberships")
        .select("*", { count: "exact", head: true })
        .match({ member_id: reader.id, community_id: arvc.id });
      expect(afterLeave).toBe(0);
      const leftFeed = await getFeed(readerClient);
      expect(leftFeed.every((p) => p.id !== post.id)).toBe(true);
    } finally {
      await deleteTestUser(author.id);
      await deleteTestUser(reader.id);
    }
  });
});
