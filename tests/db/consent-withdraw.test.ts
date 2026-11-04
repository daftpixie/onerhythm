/**
 * @jest-environment node
 *
 * Phase 1C invariant: WITHDRAW sets withdrawn_at and the 1B trigger
 * (purge_self_id_on_consent_withdrawal) purges ALL of the member's
 * health_self_ids — none readable or present at rest.
 */
import { admin, createTestUser, signInAs, deleteTestUser } from "./helpers";
import {
  grantHealthSelfIdConsent,
  withdrawHealthSelfIdConsent,
} from "../../src/lib/consent";

describe("consent withdrawal purges self-ID", () => {
  it("sets withdrawn_at and removes all health_self_ids end-to-end", async () => {
    const user = await createTestUser();
    try {
      const client = await signInAs(user.email, user.password);

      const { data: tags } = await client
        .from("self_id_tags")
        .select("id")
        .limit(3);
      await grantHealthSelfIdConsent(
        client,
        tags!.map((t) => t.id),
      );

      // sanity: tags exist before withdrawal
      const { data: before } = await client.from("health_self_ids").select("id");
      expect(before!.length).toBe(3);

      await withdrawHealthSelfIdConsent(client);

      // consent row is withdrawn
      const { data: consents } = await client
        .from("consent_records")
        .select("withdrawn_at")
        .eq("member_id", user.id);
      expect(consents!.length).toBeGreaterThan(0);
      expect(consents!.every((c) => c.withdrawn_at !== null)).toBe(true);

      // not readable via the member's own (now consent-less) client
      const { data: afterMember } = await client
        .from("health_self_ids")
        .select("id");
      expect(afterMember).toHaveLength(0);

      // and gone at rest (admin bypasses RLS — proves the purge, not just the gate)
      const { count } = await admin
        .from("health_self_ids")
        .select("*", { count: "exact", head: true })
        .eq("member_id", user.id);
      expect(count).toBe(0);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
