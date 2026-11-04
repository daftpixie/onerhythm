// Exactly one `main` landmark per screen, provided by AppShell (a11y follow-up
// 1 from the step 4 review; founder decision 2026-10-30). Written FAILING
// first: four screens declared their own `main` while AppShell declared none.
//
// AppShell wraps every route (app/_layout.tsx), so a screen that declares
// `main` too gives the page two. This scans app/ and src/ for any other
// declaration. tests/web/a11y-followups.test.tsx checks the rendered result.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(__dirname, "..", "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

const code = (file: string) =>
  readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

const MAIN = /role=["{]\s*["']?main["']?|accessibilityRole=["{]\s*["']?main|<main\b|role:\s*["']main["']/;

describe("one main landmark, from AppShell", () => {
  it("AppShell declares it", () => {
    expect(code(join(ROOT, "src", "components", "AppShell.tsx"))).toMatch(MAIN);
  });

  it("no screen or component declares another", () => {
    const offenders = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "src"))]
      .filter((f) => !f.endsWith(join("components", "AppShell.tsx")))
      .filter((f) => MAIN.test(code(f)))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("the root layout clears the status region on navigation", () => {
    expect(code(join(ROOT, "app", "_layout.tsx"))).toMatch(/<StatusRegionProvider\s+resetKey=\{/);
  });
});
