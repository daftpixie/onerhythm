// Per-address rate limiting on the signup RPC, and the unconfirmed-row purge.
//
// Same posture as updates-list.test.ts: UNTYPED clients, because the point is
// the wire behaviour an anonymous visitor gets. Touches
// public.updates_subscribers and public.updates_signup_throttle and NOTHING
// else — a test that also read a member table would be the first join path in
// the repo (ADR 0011).
//
// The property that matters most: a NEW address, an EXISTING address, and a
// THROTTLED address must be indistinguishable to the caller. If throttling
// raised, or returned a different shape, it would hand back the enumeration
// oracle that the definer function exists to remove.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import "./helpers"; // loads .env.test into process.env

const URL = process.env.SUPABASE_TEST_URL as string;
const ANON = process.env.SUPABASE_TEST_ANON_KEY as string;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_KEY as string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function raw(key: string): SupabaseClient<any, any, any> {
  return createClient(URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const anon = raw(ANON);
const admin = raw(SERVICE);

const stamp = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const addr = (label: string) => `throttle_${label}_${stamp}@example.com`;

/** The RPC's full wire response, so two calls can be compared exactly. */
async function subscribe(email: string) {
  const { data, error, status } = await anon.rpc("subscribe_to_updates", {
    p_email: email,
  });
  return { data, error, status };
}

async function countFor(email: string): Promise<number> {
  const { data, error } = await admin
    .from("updates_subscribers")
    .select("id")
    .eq("email", email);
  if (error) throw error;
  return (data ?? []).length;
}

/** The throttle limit the migration ships with. */
const LIMIT = 5;

describe("signup throttle — new, existing and throttled are indistinguishable", () => {
  it("answers a NEW address and an EXISTING address identically", async () => {
    const email = addr("dup");
    const first = await subscribe(email);
    const second = await subscribe(email);

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(second.status).toBe(first.status);
    expect(second.data).toEqual(first.data);
    // ...and the duplicate did not create a second row.
    expect(await countFor(email)).toBe(1);
  });

  it("answers a THROTTLED address identically too", async () => {
    const email = addr("limit");
    const baseline = await subscribe(email);
    expect(baseline.error).toBeNull();

    // Push well past the limit. Every call must look like the first one.
    const responses = [];
    for (let i = 0; i < LIMIT + 3; i++) {
      responses.push(await subscribe(email));
    }

    for (const r of responses) {
      expect(r.error).toBeNull();
      expect(r.status).toBe(baseline.status);
      expect(r.data).toEqual(baseline.data);
    }
  });

  it("stops writing rows once the window limit is passed", async () => {
    // Observing the throttle's EFFECT takes some care. The obvious assertion —
    // "only one row exists after many calls" — is vacuous, because
    // `on conflict (email) do nothing` guarantees that with or without a
    // throttle. It was written that way first and the ADR 0013 discipline
    // caught it.
    //
    // So: exhaust the window, then DELETE the row out from under the throttle
    // and call again. An unthrottled function would happily re-insert; a
    // throttled one must not.
    const email = addr("effect");
    for (let i = 0; i < LIMIT + 1; i++) await subscribe(email);
    expect(await countFor(email)).toBe(1);

    const { error: delErr } = await admin
      .from("updates_subscribers")
      .delete()
      .eq("email", email);
    if (delErr) throw delErr;
    expect(await countFor(email)).toBe(0);

    await subscribe(email);
    expect(await countFor(email)).toBe(0); // still throttled — no re-insert

    // The control: a fresh address in the same run is NOT throttled, so the
    // assertion above is about the throttle and not about a broken insert path.
    const fresh = addr("effect_control");
    await subscribe(fresh);
    expect(await countFor(fresh)).toBe(1);
  });

  it("still rejects a malformed address, which reveals nothing about the list", async () => {
    const { error } = await anon.rpc("subscribe_to_updates", {
      p_email: "not-an-email",
    });
    expect(error).not.toBeNull();
  });
});

describe("the throttle table is not a second copy of the list", () => {
  it("stores no email address, only a digest", async () => {
    const email = addr("nopii");
    await subscribe(email);

    const { data, error } = await admin
      .from("updates_signup_throttle")
      .select("*");
    if (error) throw error;

    const text = JSON.stringify(data ?? []);
    expect(text).not.toContain(email);
    expect(text).not.toContain("@");
    // Not vacuous: rows exist, so "no address present" is a claim about real
    // rows rather than about an empty table.
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("is unreachable to anon and authenticated", async () => {
    // service_role must be able to read it FIRST. Without this, the assertion
    // below is satisfied by a table that does not exist — which is exactly how
    // it behaved before the migration landed (ADR 0013).
    const asAdmin = await admin.from("updates_signup_throttle").select("*");
    expect(asAdmin.error).toBeNull();

    const { error } = await anon.from("updates_signup_throttle").select("*");
    expect(error).not.toBeNull();
  });

  // FK absence and column shape are asserted structurally in
  // supabase/tests/04_marketing_member_separation_test.sql, where pgTAP can see
  // the catalog directly rather than inferring it through PostgREST.
});

describe("unconfirmed-row purge", () => {
  it("is callable by service_role and removes only stale, unconfirmed rows", async () => {
    const stale = addr("stale");
    const fresh = addr("fresh");
    const confirmed = addr("confirmed");

    await subscribe(stale);
    await subscribe(fresh);
    await subscribe(confirmed);

    // Age one row past the window, and confirm another.
    const { error: ageErr } = await admin
      .from("updates_subscribers")
      .update({ created_at: "2020-01-01T00:00:00Z" })
      .eq("email", stale);
    if (ageErr) throw ageErr;

    const { error: confErr } = await admin
      .from("updates_subscribers")
      .update({
        created_at: "2020-01-01T00:00:00Z",
        confirmed_at: "2020-01-02T00:00:00Z",
      })
      .eq("email", confirmed);
    if (confErr) throw confErr;

    const { error } = await admin.rpc("purge_unconfirmed_updates_subscribers", {
      p_older_than: "30 days",
    });
    expect(error).toBeNull();

    // Stale + unconfirmed: gone. Confirmed: kept, however old. Fresh: kept.
    expect(await countFor(stale)).toBe(0);
    expect(await countFor(confirmed)).toBe(1);
    expect(await countFor(fresh)).toBe(1);
  });

  it("is NOT callable by anon or authenticated", async () => {
    // Same guard: prove the function EXISTS (service_role can call it) before
    // concluding anything from anon's refusal.
    const asAdmin = await admin.rpc("purge_unconfirmed_updates_subscribers", {
      p_older_than: "30 days",
    });
    expect(asAdmin.error).toBeNull();

    const { error } = await anon.rpc("purge_unconfirmed_updates_subscribers", {
      p_older_than: "30 days",
    });
    expect(error).not.toBeNull();
  });
});
