/**
 * @jest-environment node
 *
 * Build step 4: the member-flow client functions (src/lib/moderation/api.ts)
 * against the real local stack. Written failing first.
 */
import { createTestUser, signInAs, deleteTestUser, admin, type TestUser } from "./helpers";

function api() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("../../src/lib/moderation/api");
  } catch {
    throw new Error("Not built yet (build step 4): src/lib/moderation/api");
  }
}

describe("moderation member flows (client functions)", () => {
  let author: TestUser;
  let reader: TestUser;
  let postId: string;

  beforeAll(async () => {
    author = await createTestUser();
    reader = await createTestUser();
    const { data: community } = await admin.from("communities").select("id").limit(1).single();
    const authorClient = await signInAs(author.email, author.password);
    await authorClient.from("memberships").insert({ member_id: author.id, community_id: community!.id });
    const { data: post, error } = await authorClient
      .from("posts")
      .insert({ author_id: author.id, community_id: community!.id, title: "A post", body: "Body text" })
      .select("id")
      .single();
    if (error) throw error;
    postId = post!.id;
  });

  afterAll(async () => {
    await deleteTestUser(author.id);
    await deleteTestUser(reader.id);
  });

  it("reportContent files a report the reporter can see, and only they", async () => {
    const readerClient = await signInAs(reader.email, reader.password);
    await api().reportContent(readerClient, { postId, reason: "off_topic", note: "Off topic here." });
    const { data: mine } = await readerClient.from("reports").select("post_id, reason");
    expect(mine).toEqual([{ post_id: postId, reason: "off_topic" }]);
    const authorClient = await signInAs(author.email, author.password);
    const { data: theirs } = await authorClient.from("reports").select("id");
    expect(theirs).toEqual([]);
  });

  it("blockMember hides the blocked member's posts from the blocker", async () => {
    const readerClient = await signInAs(reader.email, reader.password);
    const before = await readerClient.from("posts").select("id").eq("id", postId);
    expect(before.data).toHaveLength(1);
    await api().blockMember(readerClient, author.id);
    const after = await readerClient.from("posts").select("id").eq("id", postId);
    expect(after.data).toHaveLength(0);
  });

  it("getGates reads G1, G2 and G3 as unmet (nothing is defined yet)", async () => {
    const readerClient = await signInAs(reader.email, reader.password);
    expect(await api().getGates(readerClient)).toEqual({ G1: "unmet", G2: "unmet", G3: "unmet" });
  });
});
