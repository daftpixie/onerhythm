// The pre-launch updates list, proven against the LIVE local stack.
//
// These tests deliberately use UNTYPED clients. The point is the wire
// behaviour an anonymous visitor actually gets — status codes, silence on
// duplicates, refusal on select — not what our generated types claim.
//
// This file touches public.updates_subscribers and NOTHING ELSE. It creates no
// auth user and reads no member table, because a test that queried both would
// be the first join path in the repo.
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

// A unique local-part per run keeps parallel/repeated runs independent.
const stamp = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const addr = (label: string) => `updates_${label}_${stamp}@example.com`;

interface SubscriberRow {
  id: string;
  email: string;
  created_at: string;
  source: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  confirm_token: string;
  unsubscribe_token: string;
}

async function rowsFor(email: string): Promise<SubscriberRow[]> {
  const { data, error } = await admin
    .from("updates_subscribers")
    .select("*")
    .eq("email", email);
  if (error) throw error;
  return (data ?? []) as SubscriberRow[];
}

afterAll(async () => {
  await admin
    .from("updates_subscribers")
    .delete()
    .like("email", `updates_%_${stamp}@example.com`);
});

describe("updates list — signup", () => {
  it("writes exactly one row, storing the email and nothing else about the person", async () => {
    const email = addr("happy");
    const { error } = await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });
    expect(error).toBeNull();

    const rows = await rowsFor(email);
    expect(rows).toHaveLength(1);

    const row = rows[0];
    expect(row.email).toBe(email);
    expect(row.source).toBe("landing");

    // Data minimization, asserted as a closed set: the row carries an id, the
    // address, when it arrived, which surface it came from, the two lifecycle
    // timestamps, and the two tokens. If a column is ever added that says
    // something about the person, this fails and someone has to justify it.
    expect(Object.keys(row).sort()).toEqual(
      [
        "confirm_token",
        "confirmed_at",
        "created_at",
        "email",
        "id",
        "source",
        "unsubscribe_token",
        "unsubscribed_at",
      ].sort(),
    );
  });

  it("normalizes case and surrounding whitespace", async () => {
    const email = addr("normalize");
    const { error } = await anon.rpc("subscribe_to_updates", {
      p_email: `  ${email.toUpperCase()}  `,
      p_source: "landing",
    });
    expect(error).toBeNull();

    const rows = await rowsFor(email);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe(email);
  });

  it("absorbs a duplicate silently — no error to the caller, no second row", async () => {
    const email = addr("dupe");
    const first = await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });
    expect(first.error).toBeNull();
    const before = await rowsFor(email);
    expect(before).toHaveLength(1);

    // The enumeration oracle this design exists to remove: a second signup for
    // a known address must be indistinguishable from the first.
    const second = await anon.rpc("subscribe_to_updates", {
      p_email: email.toUpperCase(),
      p_source: "landing",
    });
    expect(second.error).toBeNull();

    const after = await rowsFor(email);
    expect(after).toHaveLength(1);
    expect(after[0].created_at).toBe(before[0].created_at);
    expect(after[0].id).toBe(before[0].id);
  });

  it("rejects a malformed address (which reveals nothing about the list)", async () => {
    const { error } = await anon.rpc("subscribe_to_updates", {
      p_email: "not-an-email",
      p_source: "landing",
    });
    expect(error).not.toBeNull();
  });

  it("gives every new row two distinct 64-character tokens", async () => {
    const email = addr("tokens");
    await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });
    const [row] = await rowsFor(email);
    expect(row.confirm_token).toHaveLength(64);
    expect(row.unsubscribe_token).toHaveLength(64);
    expect(row.confirm_token).not.toBe(row.unsubscribe_token);
  });
});

describe("updates list — double opt-in", () => {
  it("a new row is NOT subscribed: confirmed_at is null", async () => {
    const email = addr("unconfirmed");
    await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });
    const [row] = await rowsFor(email);
    expect(row.confirmed_at).toBeNull();
  });

  it("confirming by token sets confirmed_at, and is idempotent", async () => {
    const email = addr("confirm");
    await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });
    const [before] = await rowsFor(email);

    const first = await anon.rpc("confirm_updates_subscription", {
      p_token: before.confirm_token,
    });
    expect(first.error).toBeNull();
    expect(first.data).toBe("confirmed");

    const [afterFirst] = await rowsFor(email);
    expect(afterFirst.confirmed_at).not.toBeNull();

    const second = await anon.rpc("confirm_updates_subscription", {
      p_token: before.confirm_token,
    });
    expect(second.error).toBeNull();
    expect(second.data).toBe("already_confirmed");

    const [afterSecond] = await rowsFor(email);
    expect(afterSecond.confirmed_at).toBe(afterFirst.confirmed_at);
  });

  it("an unknown confirm token changes nothing and does not error", async () => {
    const { data, error } = await anon.rpc("confirm_updates_subscription", {
      p_token: "f".repeat(64),
    });
    expect(error).toBeNull();
    expect(data).toBe("invalid");
  });
});

describe("updates list — unsubscribe (CAN-SPAM, no login)", () => {
  it("unsubscribing by token sets unsubscribed_at, and is idempotent", async () => {
    const email = addr("unsub");
    await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });
    const [before] = await rowsFor(email);

    const first = await anon.rpc("unsubscribe_from_updates", {
      p_token: before.unsubscribe_token,
    });
    expect(first.error).toBeNull();
    expect(first.data).toBe("unsubscribed");

    const [afterFirst] = await rowsFor(email);
    expect(afterFirst.unsubscribed_at).not.toBeNull();

    const second = await anon.rpc("unsubscribe_from_updates", {
      p_token: before.unsubscribe_token,
    });
    expect(second.error).toBeNull();
    expect(second.data).toBe("already_unsubscribed");

    const [afterSecond] = await rowsFor(email);
    expect(afterSecond.unsubscribed_at).toBe(afterFirst.unsubscribed_at);
  });

  it("an unknown unsubscribe token changes nothing and does not error", async () => {
    const { data, error } = await anon.rpc("unsubscribe_from_updates", {
      p_token: "0".repeat(64),
    });
    expect(error).toBeNull();
    expect(data).toBe("invalid");
  });
});

describe("updates list — the enumeration guard", () => {
  it("anon cannot SELECT the subscriber table at the wire", async () => {
    const { data, error } = await anon.from("updates_subscribers").select("*");
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("anon cannot SELECT even a single column, or filter by a known address", async () => {
    const email = addr("probe");
    await anon.rpc("subscribe_to_updates", {
      p_email: email,
      p_source: "landing",
    });

    const { data, error } = await anon
      .from("updates_subscribers")
      .select("email")
      .eq("email", email);
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("anon cannot write to the table directly, bypassing the function", async () => {
    const { error } = await anon
      .from("updates_subscribers")
      .insert({ email: addr("direct"), unsubscribe_token: "x".repeat(64) });
    expect(error).not.toBeNull();
  });
});
