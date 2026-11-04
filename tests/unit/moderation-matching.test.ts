// Muted words and the "Show" gate's crisis match (plan §4.8, Q6 and Q8;
// ADR 0019 §8; ADR 0022). Both match on the reader's own device.
//
// Muted words (Q6, decided 2026-10-29): device only. Nothing is stored on the
// server and no consent purpose exists for them, because the terms can reveal
// health ("ICD", "ablation"). The crisis gate (Q8): the reader's device matches
// a post against the published crisis list; nothing is stored, logged or sent.
//
// Written failing first.
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

function load(path: string): Record<string, unknown> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`../../${path}`);
  } catch {
    throw new Error(`Not built yet (build step 4): ${path}`);
  }
}

describe("phrase matching (shared by muted words and the crisis gate)", () => {
  const match = () => load("src/lib/moderation/match").firstMatch as (text: string, terms: string[]) => string | null;

  it("matches whole words and phrases, ignoring case", () => {
    expect(match()("I had an Ablation last week", ["ablation"])).toBe("ablation");
    expect(match()("feeling very hard today", ["very hard"])).toBe("very hard");
  });

  it("never matches inside another word", () => {
    expect(match()("an icder-like thing", ["icd"])).toBeNull();
    expect(match()("ICD", ["icd"])).toBe("icd");
  });

  it("normalises spacing and punctuation, so 'very   hard!' matches 'very hard'", () => {
    expect(match()("so very   hard!", ["very hard"])).toBe("very hard");
  });

  it("returns null for no terms or empty terms", () => {
    expect(match()("anything", [])).toBeNull();
    expect(match()("anything", ["", "   "])).toBeNull();
  });
});

describe("muted words stay on the device (Q6)", () => {
  const SRC = "src/lib/moderation/mutedWords.ts";

  it("the module never talks to the server or the network", () => {
    load("src/lib/moderation/mutedWords");
    const code = readFileSync(join(ROOT, SRC), "utf8");
    expect(code).not.toMatch(/supabase|fetch\(|XMLHttpRequest|\.rpc\(|from\(["']/);
  });

  it("adds, lists and removes words, trimmed and de-duplicated, at most 60 characters", async () => {
    const m = load("src/lib/moderation/mutedWords") as {
      addMutedWord: (w: string) => Promise<string[]>;
      removeMutedWord: (w: string) => Promise<string[]>;
      listMutedWords: () => Promise<string[]>;
      clearMutedWords: () => Promise<void>;
    };
    await m.clearMutedWords();
    expect(await m.addMutedWord("  ICD ")).toEqual(["icd"]);
    expect(await m.addMutedWord("icd")).toEqual(["icd"]);
    expect(await m.addMutedWord("x".repeat(80))).toEqual(["icd", "x".repeat(60)]);
    expect(await m.removeMutedWord("icd")).toEqual(["x".repeat(60)]);
    expect(await m.listMutedWords()).toEqual(["x".repeat(60)]);
    await m.clearMutedWords();
    expect(await m.listMutedWords()).toEqual([]);
  });
});
