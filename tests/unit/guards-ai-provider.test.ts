// GUARDS: the two guard extensions ADR 0017 (Consequences, item 5) asks for.
//
//   1. no-thirdparty-on-health.sh also scans supabase/functions/, and AI-provider
//      API hosts and SDK packages may appear only in the AI gateway module —
//      never in app/ or src/, and never in any other Edge Function. (Caption and
//      video-vendor hosts join, allowed only in the Hub module, once the Hub ADR
//      names vendors; nothing is allowed for them yet.)
//   2. secrets-pii-scan.sh learns AI-provider key shapes.
//
// Every guard reads `git diff ${GUARD_DIFF:---cached}`, so this test runs the
// REAL hook scripts against a throwaway git repository with a staged file —
// exactly the pre-commit path — and asserts the exit code. Each case that
// expects a block is a deliberate violation (ADR 0013): if the guard stops
// catching it, this goes red.
//
// Key-shaped strings are assembled at runtime so that this file, when staged,
// cannot trip the very guard it tests.
import { execFileSync } from "child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";

const ROOT = join(__dirname, "..", "..");

function runGuard(hook: string, files: Record<string, string>): number {
  const dir = mkdtempSync(join(tmpdir(), "guard-"));
  try {
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: dir, stdio: "pipe" });
    git("init", "-q");
    for (const [path, body] of Object.entries(files)) {
      mkdirSync(join(dir, dirname(path)), { recursive: true });
      writeFileSync(join(dir, path), body);
      git("add", path);
    }
    const hookPath = join(dir, "hook.sh");
    copyFileSync(join(ROOT, ".claude", "hooks", hook), hookPath);
    try {
      execFileSync("bash", [hookPath], {
        cwd: dir,
        stdio: "pipe",
        env: { ...process.env, GUARD_DIFF: "--cached" },
      });
      return 0;
    } catch (e) {
      return (e as { status: number }).status ?? 1;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const ANTHROPIC_HOST = ["api", "anthropic", "com"].join(".");
const OPENAI_HOST = ["api", "openai", "com"].join(".");
const call = (host: string) => `await fetch("https://${host}/v1/messages");\n`;

describe("no-thirdparty-on-health: Edge Functions and AI-provider hosts", () => {
  const HOOK = "no-thirdparty-on-health.sh";

  it("still allows clean app source", () => {
    expect(runGuard(HOOK, { "src/lib/ok.ts": "export const x = 1;\n" })).toBe(0);
  });

  it("blocks a tracker inside an Edge Function", () => {
    expect(
      runGuard(HOOK, {
        "supabase/functions/send-confirmation-email/index.ts":
          'const s = "https://www.googletagmanager.com/gtag/js";\n',
      }),
    ).not.toBe(0);
  });

  it("blocks an AI-provider host in client code", () => {
    expect(runGuard(HOOK, { "src/lib/visit-prep.ts": call(ANTHROPIC_HOST) })).not.toBe(0);
    expect(runGuard(HOOK, { "app/journal.tsx": call(OPENAI_HOST) })).not.toBe(0);
  });

  it("blocks an AI-provider host in any Edge Function except the gateway", () => {
    expect(
      runGuard(HOOK, {
        "supabase/functions/send-confirmation-email/index.ts": call(ANTHROPIC_HOST),
      }),
    ).not.toBe(0);
  });

  it("blocks other hosted AI providers in client code", () => {
    for (const host of [
      ["api", "mistral", "ai"].join("."),
      ["api", "cohere", "com"].join("."),
      ["api", "groq", "com"].join("."),
      ["openrouter", "ai"].join("."),
      ["us-central1-aiplatform", "googleapis", "com"].join("."),
      ["bedrock-runtime", "us-east-1", "amazonaws", "com"].join("."),
      ["example", "openai", "azure", "com"].join("."),
    ]) {
      expect(runGuard(HOOK, { "src/lib/ai.ts": call(host) })).not.toBe(0);
    }
  });

  it("blocks an AI SDK import outside the gateway", () => {
    expect(runGuard(HOOK, { "src/lib/ai.ts": 'import Anthropic from "@anthropic-ai/sdk";\n' })).not.toBe(0);
    expect(runGuard(HOOK, { "app/x.tsx": 'import OpenAI from "openai";\n' })).not.toBe(0);
    expect(
      runGuard(HOOK, { "supabase/functions/send-confirmation-email/index.ts": 'import OpenAI from "npm:openai";\n' }),
    ).not.toBe(0);
  });

  it("scans module-style JavaScript files too", () => {
    expect(runGuard(HOOK, { "supabase/functions/x/index.mjs": call(ANTHROPIC_HOST) })).not.toBe(0);
    expect(runGuard(HOOK, { "src/lib/x.mts": call(OPENAI_HOST) })).not.toBe(0);
    expect(runGuard(HOOK, { "src/lib/x.cjs": 'const s = "https://www.googletagmanager.com/gtag/js";\n' })).not.toBe(0);
  });

  it("allows an AI SDK import inside the gateway", () => {
    expect(
      runGuard(HOOK, { "supabase/functions/ai-gateway/anthropic.ts": 'import Anthropic from "npm:@anthropic-ai/sdk";\n' }),
    ).toBe(0);
  });

  it("allows an AI-provider host inside the AI gateway module", () => {
    expect(
      runGuard(HOOK, { "supabase/functions/ai-gateway/anthropic.ts": call(ANTHROPIC_HOST) }),
    ).toBe(0);
  });

  it("never allows a tracker, even inside the gateway", () => {
    expect(
      runGuard(HOOK, {
        "supabase/functions/ai-gateway/index.ts": 'fbq("track", "x");\n',
      }),
    ).not.toBe(0);
  });
});

describe("secrets-pii-scan: AI-provider key shapes", () => {
  const HOOK = "secrets-pii-scan.sh";
  const body = "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0";
  const anthropicKey = ["sk", "ant", "api03", body].join("-");
  const openaiKey = ["sk", "proj", body].join("-");

  it("still allows a clean change", () => {
    expect(runGuard(HOOK, { "src/lib/ok.ts": "export const x = 1;\n" })).toBe(0);
  });

  it("blocks an Anthropic API key", () => {
    expect(runGuard(HOOK, { "supabase/functions/ai-gateway/k.ts": `const k = "${anthropicKey}";\n` })).not.toBe(0);
  });

  it("blocks an OpenAI project key", () => {
    expect(runGuard(HOOK, { "src/lib/k.ts": `const k = "${openaiKey}";\n` })).not.toBe(0);
  });

  it("blocks a Google AI (Gemini) API key", () => {
    const googleKey = ["AI", "za", "Sy", body.slice(0, 33)].join("");
    expect(runGuard(HOOK, { "src/lib/k.ts": `const k = "${googleKey}";\n` })).not.toBe(0);
  });

  it("blocks a legacy-format OpenAI key", () => {
    const legacy = ["sk", body + "abcdefgh"].join("-");
    expect(runGuard(HOOK, { "src/lib/k.ts": `const k = "${legacy}";\n` })).not.toBe(0);
  });

  it("blocks a real-looking Gemini key assignment", () => {
    expect(runGuard(HOOK, { "notes.txt": `GEMINI_API_KEY=${body}\n` })).not.toBe(0);
  });

  it("blocks a real-looking AI key assignment", () => {
    expect(
      runGuard(HOOK, { "notes.txt": `ANTHROPIC_API_KEY=${body}\n` }),
    ).not.toBe(0);
  });

  // The stock Supabase config names the key by env reference only. A whole-tree
  // scan (a root commit, or an adopter importing this repo fresh) must not
  // block it — but an env(...) wrapper must not become a loophole either.
  const stockKeyName = ["openai", "api", "key"].join("_");

  it("allows the stock env(...) reference in supabase/config.toml", () => {
    expect(
      runGuard(HOOK, { "supabase/config.toml": `${stockKeyName} = "env(${stockKeyName.toUpperCase()})"\n` }),
    ).toBe(0);
  });

  it("still blocks a real-shaped Anthropic key in an env assignment", () => {
    expect(
      runGuard(HOOK, { "supabase/functions/.env.local.txt": `ANTHROPIC_API_KEY=${anthropicKey}\n` }),
    ).not.toBe(0);
  });

  it("still blocks a real-shaped OpenAI project key in a quoted assignment", () => {
    expect(
      runGuard(HOOK, { "supabase/config.toml": `OPENAI_API_KEY="${openaiKey}"\n` }),
    ).not.toBe(0);
  });

  it("does not let an env(...) prefix hide a real value", () => {
    expect(
      runGuard(HOOK, { "notes.txt": `OPENAI_API_KEY=env(X)${body}\n` }),
    ).not.toBe(0);
  });

  it("allows a placeholder in an example template", () => {
    expect(
      runGuard(HOOK, { "supabase/functions/.env.example": "ANTHROPIC_API_KEY=your-key-here\n" }),
    ).toBe(0);
  });
});
