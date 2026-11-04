/**
 * @jest-environment node
 *
 * Privacy floor: consent state is health data (.claude/rules/privacy.md). The
 * helper has_current_health_consent(p_member) is SECURITY DEFINER, so it reads
 * consent_records past RLS. If a client can call it with SOMEONE ELSE's id it
 * becomes an oracle: "does this member have current health self-ID consent?"
 *
 * Only the RLS policies on health_self_ids should use it, always with
 * auth.uid(). So: anon cannot call it at all, and an authenticated member
 * learns nothing about another member through it.
 */
import { anonClient, createTestUser, signInAs, deleteTestUser, type TestUser } from "./helpers";
import { grantHealthSelfIdConsent } from "../../src/lib/consent";

describe("has_current_health_consent is not a consent-state oracle", () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    alice = await createTestUser();
    bob = await createTestUser();
    const aliceClient = await signInAs(alice.email, alice.password);
    const { data: tags } = await aliceClient
      .from("self_id_tags")
      .select("id")
      .eq("tag_type", "diagnosis")
      .limit(1);
    await grantHealthSelfIdConsent(aliceClient, tags!.map((t) => t.id));
  });

  afterAll(async () => {
    await deleteTestUser(alice.id);
    await deleteTestUser(bob.id);
  });

  it("Alice's own check is still true (the gate the policies rely on works)", async () => {
    const aliceClient = await signInAs(alice.email, alice.password);
    const { data, error } = await aliceClient.rpc("has_current_health_consent", {
      p_member: alice.id,
    });
    expect(error).toBeNull();
    expect(data).toBe(true);
  });

  it("anon cannot call it", async () => {
    const { data, error } = await anonClient().rpc("has_current_health_consent", {
      p_member: alice.id,
    });
    expect(error).not.toBeNull();
    // 42501 = insufficient_privilege: refused for lack of EXECUTE, not for
    // some unrelated reason that would make this pass vacuously.
    expect(error!.code).toBe("42501");
    expect(data).toBeNull();
  });

  it("another member learns nothing about Alice through it", async () => {
    const bobClient = await signInAs(bob.email, bob.password);
    const { data, error } = await bobClient.rpc("has_current_health_consent", {
      p_member: alice.id,
    });
    // Bob may call it (the RLS policies need authenticated EXECUTE), but it
    // answers only for the caller: false, the same as "no consent".
    expect(error).toBeNull();
    expect(data).toBe(false);
  });
});
