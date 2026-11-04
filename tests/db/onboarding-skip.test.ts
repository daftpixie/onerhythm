/**
 * @jest-environment node
 *
 * Phase 1C invariant: SKIPPING onboarding writes NO consent row and NO self-ID
 * tags, and the member can still fully participate.
 */
import { createTestUser, signInAs, deleteTestUser } from "./helpers";

describe("onboarding skip path", () => {
  it("writes no consent and no self-ID, and the member can still participate", async () => {
    const user = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);

      // Skip => the app performs no consent/self-ID writes. Assert none exist.
      const { count: consentCount } = await client
        .from("consent_records")
        .select("*", { count: "exact", head: true })
        .eq("member_id", user.id);
      expect(consentCount).toBe(0);

      const { count: selfIdCount } = await client
        .from("health_self_ids")
        .select("*", { count: "exact", head: true });
      expect(selfIdCount).toBe(0);

      // Participation is not gated on disclosure: the member can join a community.
      const { data: comms } = await client
        .from("communities")
        .select("id")
        .limit(1);
      expect(comms!.length).toBeGreaterThan(0);

      const { error: joinErr } = await client
        .from("memberships")
        .insert({ member_id: user.id, community_id: comms![0].id });
      expect(joinErr).toBeNull();
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
