// The files a member, visitor, email recipient or security researcher reads.
//
// Shared by the wording tests (tests/unit/entity-wording.test.ts and
// tests/unit/license.test.ts) so they scan one agreed scope. Historical
// decision records (docs/adr, .claude/plans) are excluded on purpose: they
// record what was believed at the time and carry status notes.
import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

export const ROOT = join(__dirname, "..", "..");

export const SCANNED_DIRS = ["app", "src", "supabase/functions", "public"];
export const SCANNED_FILES = ["README.md", "SECURITY.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md"];
const EXTENSIONS = /\.(tsx?|jsx?|html|md|json|txt)$/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXTENSIONS.test(name)) out.push(p);
  }
  return out;
}

/** Absolute paths of every public-copy file, plus any extra repo-relative files that exist. */
export function publicFiles(extra: string[] = []): string[] {
  return [
    ...SCANNED_DIRS.flatMap((d) => walk(join(ROOT, d))),
    ...[...SCANNED_FILES, ...extra].map((f) => join(ROOT, f)).filter((p) => existsSync(p)),
  ];
}

// JSX wraps prose across lines; collapse whitespace so a phrase split over two
// lines is still caught.
export const flat = (s: string) => s.replace(/\s+/g, " ");
