/**
 * @jest-environment node
 *
 * Launch gate — Addendum A B13, the DELETION half.
 *
 * pgTAP 03 already proves the cascade fires when auth.users loses a row. What
 * it cannot prove is that a MEMBER can invoke that cascade for themselves and
 * for nobody else — which is the whole point of the privacy-rights UI. That is
 * what these tests pin, through the real product code, against the live stack.
 *
 * The function takes NO argument by deliberate design: there is no uid to forge.
 * The "cannot delete another user" test therefore attacks it two ways — by
 * trying to pass a uid at all, and by proving that Alice calling it leaves Bob
 * completely intact.
 */
import {
  admin,
  anonClient,
  createTestUser,
  signInAs,
  deleteTestUser,
  type TestUser,
} from "./helpers";
import { deleteMyAccount } from "../../src/lib/rights/delete-account";
import { createPost, createComment, addUpbeat } from "../../src/lib/social";
import { createJourneyEntry } from "../../src/lib/social";
import { grantHealthSelfIdConsent } from "../../src/lib/consent";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

type Client = SupabaseClient<Database>;

/** Every member-owned table, with the column that points at the member. */
const OWNED: Array<[string, string]> = [
  ["profiles", "id"],
  ["consent_records", "member_id"],
  ["health_self_ids", "member_id"],
  ["memberships", "member_id"],
  ["posts", "author_id"],
  ["comments", "author_id"],
  ["upbeats", "member_id"],
  ["journey_entries", "author_id"],
];

async function countRowsFor(memberId: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const [table, col] of OWNED) {
    // service key: bypasses RLS, so this counts what is REALLY there — not what
    // the member is permitted to see. Deletion must be real, not just invisible.
    const { count, error } = await admin
      .from(table as never)
      .select("*", { count: "exact", head: true })
      .eq(col, memberId);
    if (error) throw error;
    out[table] = count ?? 0;
  }
  return out;
}

async function seed(client: Client, marker: string) {
  const { data: community } = await admin
    .from("communities")
    .select("id")
    .limit(1)
    .single();
  const memberId = (await client.auth.getUser()).data.user!.id;
  await admin
    .from("memberships")
    .insert({ member_id: memberId, community_id: community!.id });
  const post = await createPost(client, {
    communityId: community!.id,
    title: `${marker} post`,
    body: `${marker} body`,
  });
  await createComment(client, { postId: post.id, body: `${marker} comment` });
  await addUpbeat(client, { postId: post.id });
  await createJourneyEntry(client, {
    title: `${marker} journey`,
    body: `${marker} body`,
  });
  const { data: tag } = await admin
    .from("self_id_tags")
    .select("id")
    .limit(1)
    .single();
  await grantHealthSelfIdConsent(client, [tag!.id]);
}

describe("delete my account — removes everything of mine, nothing of anyone else's", () => {
  let alice: TestUser;
  let bob: TestUser;

  afterEach(async () => {
    if (alice) await deleteTestUser(alice.id).catch(() => {});
    if (bob) await deleteTestUser(bob.id).catch(() => {});
  });

  it("removes the member's rows from EVERY member-owned table, and the auth user", async () => {
    alice = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    await seed(aliceClient, "alice");

    const before = await countRowsFor(alice.id);
    for (const [table] of OWNED) {
      expect(before[table]).toBeGreaterThan(0);
    }

    await deleteMyAccount(aliceClient);

    const after = await countRowsFor(alice.id);
    for (const [table] of OWNED) {
      expect(after[table]).toBe(0);
    }

    // the sign-in identity itself is gone — not merely orphaned
    const { data } = await admin.auth.admin.getUserById(alice.id);
    expect(data.user).toBeNull();
  });

  it("CANNOT delete another member — Alice's call leaves Bob completely intact", async () => {
    alice = await createTestUser();
    bob = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    const bobClient = await signInAs(bob.email, bob.password);
    await seed(aliceClient, "alice");
    await seed(bobClient, "bob");

    const bobBefore = await countRowsFor(bob.id);

    await deleteMyAccount(aliceClient);

    const bobAfter = await countRowsFor(bob.id);
    expect(bobAfter).toEqual(bobBefore);
    const { data } = await admin.auth.admin.getUserById(bob.id);
    expect(data.user).not.toBeNull();
  });

  it("refuses a forged target: the RPC accepts no uid argument at all", async () => {
    alice = await createTestUser();
    bob = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);

    // Attempt to aim the function at Bob by every argument name a caller might
    // guess. PostgREST resolves overloads by argument name, so a function that
    // takes no arguments cannot be reached with any of these.
    for (const args of [
      { p_member: bob.id },
      { member_id: bob.id },
      { uid: bob.id },
      { p_uid: bob.id },
      { id: bob.id },
    ]) {
      const { error } = await aliceClient.rpc(
        "delete_my_account" as never,
        args as never,
      );
      expect(error).not.toBeNull();
    }

    // Bob survived every attempt.
    const { data } = await admin.auth.admin.getUserById(bob.id);
    expect(data.user).not.toBeNull();
  });

  it("refuses an unauthenticated caller", async () => {
    await expect(deleteMyAccount(anonClient())).rejects.toThrow();
  });

  it("ends the session — the member is signed out afterwards", async () => {
    alice = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    await deleteMyAccount(aliceClient);

    const { data } = await aliceClient.auth.getSession();
    expect(data.session).toBeNull();
  });
});
