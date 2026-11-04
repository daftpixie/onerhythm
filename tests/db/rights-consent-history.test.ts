/**
 * @jest-environment node
 *
 * Launch gate — Addendum A B14, consent management.
 *
 * 1C shipped status + a bare turn-off. This completes it: the member can see
 * the FULL versioned history — including records they have withdrawn, with the
 * policy version they originally agreed to. That history is the reason
 * withdrawal writes `withdrawn_at` instead of deleting the row, and it is the
 * versioned-consent requirement made visible.
 */
import {
  createTestUser,
  signInAs,
  deleteTestUser,
  admin,
  type TestUser,
} from "./helpers";
import { listMyConsentHistory } from "../../src/lib/rights/consent-history";
import {
  grantHealthSelfIdConsent,
  withdrawHealthSelfIdConsent,
  CONSENT_POLICY_VERSION,
} from "../../src/lib/consent";

describe("consent history — withdrawal is honoured AND remains visible", () => {
  let alice: TestUser;
  let bob: TestUser;

  afterEach(async () => {
    if (alice) await deleteTestUser(alice.id).catch(() => {});
    if (bob) await deleteTestUser(bob.id).catch(() => {});
  });

  it("withdrawal purges the tags but keeps the record, with its policy version", async () => {
    alice = await createTestUser();
    const client = await signInAs(alice.email, alice.password);
    const { data: tag } = await admin
      .from("self_id_tags")
      .select("id")
      .limit(1)
      .single();

    await grantHealthSelfIdConsent(client, [tag!.id]);

    const granted = await listMyConsentHistory(client);
    expect(granted).toHaveLength(1);
    expect(granted[0].purpose).toBe("health_self_id");
    expect(granted[0].policy_version).toBe(CONSENT_POLICY_VERSION);
    expect(granted[0].withdrawn_at).toBeNull();

    await withdrawHealthSelfIdConsent(client);

    // the 1B trigger purged the tags — verified with the service key, so this
    // is real deletion and not merely an RLS read being closed off
    const { count } = await admin
      .from("health_self_ids")
      .select("*", { count: "exact", head: true })
      .eq("member_id", alice.id);
    expect(count).toBe(0);

    // ...and the history still shows what was agreed to, and when it ended
    const after = await listMyConsentHistory(client);
    expect(after).toHaveLength(1);
    expect(after[0].policy_version).toBe(CONSENT_POLICY_VERSION);
    expect(after[0].withdrawn_at).not.toBeNull();
  });

  it("shows me only MY consent history", async () => {
    alice = await createTestUser();
    bob = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    const bobClient = await signInAs(bob.email, bob.password);
    const { data: tag } = await admin
      .from("self_id_tags")
      .select("id")
      .limit(1)
      .single();

    await grantHealthSelfIdConsent(aliceClient, [tag!.id]);
    await grantHealthSelfIdConsent(bobClient, [tag!.id]);

    const mine = await listMyConsentHistory(aliceClient);
    expect(mine).toHaveLength(1);
    for (const r of mine) expect(r.member_id).toBe(alice.id);
    expect(JSON.stringify(mine)).not.toContain(bob.id);
  });
});
