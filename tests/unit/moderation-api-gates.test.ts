// getGate fails loudly, not as "unmet", so the console route never tells a
// real moderator "No moderators are appointed yet" because a read failed
// (governance review round 1, step 5). Copy elsewhere still fails closed.
import { getGate } from "../../src/lib/moderation/api";

function client(result: { data: unknown; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve(result),
  };
  return { from: () => chain } as never;
}

describe("getGate", () => {
  it("reads met and unmet", async () => {
    await expect(getGate(client({ data: { status: "met" }, error: null }), "G4")).resolves.toBe("met");
    await expect(getGate(client({ data: { status: "unmet" }, error: null }), "G4")).resolves.toBe("unmet");
    await expect(getGate(client({ data: null, error: null }), "G4")).resolves.toBe("unmet");
  });

  it("throws on a read error instead of saying unmet", async () => {
    await expect(getGate(client({ data: null, error: { message: "offline" } }), "G4")).rejects.toThrow();
  });
});
