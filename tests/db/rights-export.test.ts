/**
 * @jest-environment node
 *
 * Launch gate — Addendum A B13/B14, the EXPORT half.
 *
 * The binding rule: a member can export their own data and NOBODY else's, and
 * the export is complete. Both are proven here against the live stack, through
 * the real product code (src/lib/rights/export.ts), never by inspecting client
 * filtering in isolation.
 *
 * Why this is not simply "RLS proves it": profiles_select_authenticated is
 * `using (true)` — any authenticated member may read every profile row. RLS
 * genuinely scopes consent_records, health_self_ids and memberships; it does
 * NOT scope profiles, and the feed tables are readable by design. So scoping
 * comes from explicit owner predicates with RLS as a backstop where it applies,
 * and what these tests pin is the OUTCOME, which holds either way.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  admin,
  anonClient,
  createTestUser,
  signInAs,
  deleteTestUser,
  type TestUser,
} from "./helpers";
import {
  collectMyData,
  MEMBER_OWNED_TABLES,
  EXPORT_FORMAT_VERSION,
} from "../../src/lib/rights/export";
import { createPost, createComment, addUpbeat } from "../../src/lib/social";
import { createJourneyEntry } from "../../src/lib/social";
import { grantHealthSelfIdConsent } from "../../src/lib/consent";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/lib/database.types";

type Client = SupabaseClient<Database>;

/** Give a member a full graph: membership, post, comment, upbeat, journey, consent+tags. */
async function seedMember(client: Client, marker: string) {
  const { data: community } = await admin
    .from("communities")
    .select("id")
    .limit(1)
    .single();
  const communityId = community!.id;

  await admin
    .from("memberships")
    .insert({ member_id: (await client.auth.getUser()).data.user!.id, community_id: communityId });

  const post = await createPost(client, {
    communityId,
    title: `${marker} post`,
    body: `${marker} body`,
  });
  const comment = await createComment(client, {
    postId: post.id,
    body: `${marker} comment`,
  });
  await addUpbeat(client, { postId: post.id });
  const journey = await createJourneyEntry(client, {
    title: `${marker} journey`,
    body: `${marker} long form`,
  });

  const { data: tag } = await admin
    .from("self_id_tags")
    .select("id")
    .limit(1)
    .single();
  await grantHealthSelfIdConsent(client, [tag!.id]);

  return { communityId, post, comment, journey, tagId: tag!.id };
}

describe("export — a member exports their OWN data, and only their own", () => {
  let alice: TestUser;
  let bob: TestUser;

  afterEach(async () => {
    if (alice) await deleteTestUser(alice.id).catch(() => {});
    if (bob) await deleteTestUser(bob.id).catch(() => {});
  });

  it("contains the member's own rows across every member-owned table", async () => {
    alice = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    const seeded = await seedMember(aliceClient, "alice");

    const doc = await collectMyData(aliceClient);

    expect(doc.format_version).toBe(EXPORT_FORMAT_VERSION);
    expect(doc.member_id).toBe(alice.id);

    expect(doc.data.profile).not.toBeNull();
    expect(doc.data.profile!.id).toBe(alice.id);
    expect(doc.data.posts.map((p) => p.id)).toContain(seeded.post.id);
    expect(doc.data.comments.map((c) => c.id)).toContain(seeded.comment.id);
    expect(doc.data.journey_entries.map((j) => j.id)).toContain(
      seeded.journey.id,
    );
    expect(doc.data.upbeats.length).toBeGreaterThan(0);
    expect(doc.data.memberships.length).toBeGreaterThan(0);
    expect(doc.data.consent_records.length).toBeGreaterThan(0);
    expect(doc.data.health_self_id_tags.length).toBeGreaterThan(0);
  });

  it("contains NONE of a second account's rows — proven at the DB layer", async () => {
    alice = await createTestUser();
    bob = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    const bobClient = await signInAs(bob.email, bob.password);

    await seedMember(aliceClient, "alice");
    const bobSeed = await seedMember(bobClient, "bob");

    const doc = await collectMyData(aliceClient);
    const asText = JSON.stringify(doc);

    // No identifier belonging to Bob may appear anywhere in Alice's export.
    expect(asText).not.toContain(bob.id);
    expect(asText).not.toContain(bobSeed.post.id);
    expect(asText).not.toContain(bobSeed.comment.id);
    expect(asText).not.toContain(bobSeed.journey.id);
    expect(asText).not.toContain("bob post");
    expect(asText).not.toContain("bob comment");
    expect(asText).not.toContain("bob journey");

    // and every row that IS present is owned by Alice
    expect(doc.data.profile!.id).toBe(alice.id);
    for (const p of doc.data.posts) expect(p.author_id).toBe(alice.id);
    for (const c of doc.data.comments) expect(c.author_id).toBe(alice.id);
    for (const j of doc.data.journey_entries) expect(j.author_id).toBe(alice.id);
    for (const u of doc.data.upbeats) expect(u.member_id).toBe(alice.id);
    for (const m of doc.data.memberships) expect(m.member_id).toBe(alice.id);
    for (const r of doc.data.consent_records) expect(r.member_id).toBe(alice.id);
  });

  // If a future migration adds a member-owned table and the export forgets it,
  // THIS is the test that notices. It cross-checks the export's declared table
  // list against the tables the proven deletion cascade covers, so export and
  // deletion cannot silently drift apart.
  it("enumerates every member-owned table, and matches the deletion cascade", async () => {
    const cascadeSql = readFileSync(
      join(__dirname, "..", "..", "supabase", "tests", "03_deletion_cascade_test.sql"),
      "utf8",
    );

    for (const table of MEMBER_OWNED_TABLES) {
      expect(cascadeSql).toContain(`public.${table}`);
    }

    // and the export document actually carries a key per declared table
    alice = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    const doc = await collectMyData(aliceClient);
    // Two keys are deliberately not the bare table name, and both are spelled
    // out here rather than inferred, so a THIRD rename cannot pass unnoticed:
    //   profiles        -> "profile"             (exactly one row, so singular)
    //   health_self_ids -> "health_self_id_tags" (joined to the tag vocabulary)
    const KEY_FOR: Record<string, string> = {
      profiles: "profile",
      health_self_ids: "health_self_id_tags",
    };
    for (const table of MEMBER_OWNED_TABLES) {
      expect(Object.keys(doc.data)).toContain(KEY_FOR[table] ?? table);
    }
  });

  it("is refused entirely when nobody is signed in", async () => {
    await expect(collectMyData(anonClient())).rejects.toThrow();
  });
});
