// Static checks on the moderation surfaces (ADR 0022, Proposed; plan §5):
//
//   - the focus ring is the v3 one (2px solid Ink from tokens.ts), and no
//     component removes an outline without it;
//   - nothing animates (ADR 0022: panels have no animation at all, so reduced
//     motion is honoured by construction).
//
// A source scan, because neither jsdom nor the rn renderer can show a :focus
// style. Written FAILING before anything is built; build step 4 makes it pass.
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { moderationUi as M } from "../shared/contracts/moderation-ui";

const ROOT = join(__dirname, "..", "..");
const DIR = join(ROOT, "src", "components", "moderation");

/** Every file the moderation surfaces are made of, shared helpers included. */
function files(): string[] {
  if (!existsSync(DIR)) throw new Error("Not built yet (build step 4, ADR 0022): src/components/moderation/");
  const own = readdirSync(DIR).filter((f) => /\.tsx?$/.test(f)).map((f) => join(DIR, f));
  const shared = ["ContactLink.tsx", "StatusRegion.tsx"].map((f) => join(ROOT, "src", "components", f));
  for (const f of shared) if (!existsSync(f)) throw new Error(`Not built yet (build step 4, ADR 0022): ${f}`);
  return [...own, ...shared];
}

/** Code only: comments are stripped, so a commented-out style cannot pass or fail a check. */
function code(file: string): string {
  return readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("moderation surfaces, all files", () => {
  it("define or import the v3 focus ring (2px solid Ink from tokens.ts)", () => {
    const all = files().map(code).join("\n");
    expect(all).toMatch(/outlineWidth:\s*focus\.width/);
    expect(all).toMatch(/outlineColor:\s*tokens\.ink/);
    expect(all).toMatch(/outlineStyle:\s*"solid"/);
  });

  it.each(["reportControl", "blockControl", "removalNotice", "appealForm", "crisisShowGate",
    "postSubmitCrisisPanel", "moderationQueue", "moderatorConsole"] as const)(
    "%s applies a focus style to its controls",
    (module) => {
      const file = join(ROOT, `${M.modules[module]}.tsx`);
      if (!existsSync(file)) throw new Error(`Not built yet (build step 4, ADR 0022): ${M.modules[module]}`);
      expect(code(file)).toMatch(/focused\s*&&/);
    },
  );

  it("never remove an outline", () => {
    for (const f of files()) {
      expect([f, code(f)]).not.toEqual([f, expect.stringMatching(/outline(Style)?:\s*["']none["']|outlineWidth:\s*0\b/)]);
    }
  });

  it("have no animation or transition", () => {
    for (const f of files()) {
      expect([f, code(f)]).not.toEqual([
        f,
        expect.stringMatching(/\bAnimated\b|LayoutAnimation|animationType|transition(Property|Duration)|animation(Name|Duration)|react-native-reanimated|useReducedMotion/),
      ]);
    }
  });

  it("are never modal (ADR 0022)", () => {
    for (const f of files()) {
      expect([f, code(f)]).not.toEqual([f, expect.stringMatching(/<Modal\b|\bModal\b[^;]*from\s+"react-native"|aria-modal|accessibilityViewIsModal/)]);
    }
  });
});
