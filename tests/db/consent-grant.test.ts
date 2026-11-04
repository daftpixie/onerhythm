/**
 * @jest-environment node
 *
 * Phase 1C invariant: OPTING IN writes EXACTLY ONE current consent_records row
 * (purpose=health_self_id) plus the selected health_self_ids, through the gated
 * path (consent first, tags second).
 */
import { createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  grantHealthSelfIdConsent,
  CONSENT_POLICY_VERSION,
} from "../../src/lib/consent";

describe("consent grant (opt-in)", () => {
  it("writes one current consent row + the selected self-ID tags", async () => {
    const user = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);

      const { data: tags } = await client
        .from("self_id_tags")
        .select("id")
        .eq("tag_type", "diagnosis")
        .limit(2);
      const tagIds = tags!.map((t) => t.id);
      expect(tagIds.length).toBe(2);

      await grantHealthSelfIdConsent(client, tagIds);

      const { data: consents } = await client
        .from("consent_records")
        .select("purpose, policy_version, withdrawn_at")
        .eq("member_id", user.id)
        .is("withdrawn_at", null);
      expect(consents).toHaveLength(1);
      expect(consents![0].purpose).toBe("health_self_id");
      expect(consents![0].policy_version).toBe(CONSENT_POLICY_VERSION);

      const { data: selfIds } = await client.from("health_self_ids").select("id");
      expect(selfIds).toHaveLength(tagIds.length);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
