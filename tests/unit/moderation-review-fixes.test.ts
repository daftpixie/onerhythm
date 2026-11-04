// Review round 1 on build step 4, pinned before the fixes.
//
// Privacy: muted words are kept per signed-in member on a shared device, and
// cleared when the account is deleted. Governance: the appeal screen derives
// the tier from the member's own notice, never from the URL, and fails closed
// to the Tier 3 path (never a vote) when it cannot tell.
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

describe("muted words are kept per member on a shared device", () => {
  it("one member's words are not another's", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require("../../src/lib/moderation/mutedWords");
    expect(typeof m.setMutedWordsOwner).toBe("function");
    m.setMutedWordsOwner("member-a");
    await m.clearMutedWords();
    await m.addMutedWord("ablation");
    m.setMutedWordsOwner("member-b");
    await m.clearMutedWords();
    expect(await m.listMutedWords()).toEqual([]);
    m.setMutedWordsOwner("member-a");
    expect(await m.listMutedWords()).toEqual(["ablation"]);
    m.setMutedWordsOwner(null);
    expect(await m.listMutedWords()).toEqual([]);
  });

  it("account deletion clears this device's muted words", () => {
    const code = readFileSync(join(ROOT, "src/lib/rights/delete-account.ts"), "utf8");
    expect(code).toMatch(/clearMutedWords\(/);
  });
});

describe("the appeal tier comes from the member's own notice", () => {
  it("floor item → Tier 3; Tier 1 rule → Tier 1; unknown → Tier 3 (never a vote)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { tierOfNotice } = require("../../src/lib/moderation/api");
    expect(tierOfNotice({ floor: "safety", tier1_rule: null })).toBe(3);
    expect(tierOfNotice({ floor: null, tier1_rule: "off_topic" })).toBe(1);
    expect(tierOfNotice(undefined)).toBe(3);
  });

  it("the appeal screen does not read the tier from the URL", () => {
    const code = readFileSync(join(ROOT, "app/appeal/[actionId].tsx"), "utf8");
    expect(code).not.toMatch(/tier\s*===\s*"3"/);
    expect(code).toMatch(/tierOfNotice/);
  });
});
