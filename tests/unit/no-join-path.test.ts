// GUARD: marketing data and member data cannot be correlated by this codebase.
//
// The database side is proven in supabase/tests/04 (no FK, no grant, no policy,
// no member reference inside the definer functions). This is the source side:
// no file in the shipped product may reach for the updates list and a member
// table together, because a single file holding both is the shortest path to a
// join that no reviewer would notice six months from now.
//
// The same scan runs as a pre-commit guard (#8,
// .claude/hooks/no-marketing-member-join.sh) against staged files. This test
// covers the whole tree, including files a commit did not touch.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(__dirname, "..", "..");
// scripts/ is scanned too: the Google Sheet mirror lives there, and an
// export is a join waiting to be written in a spreadsheet (ADR 0011).
const SCANNED_DIRS = ["src", "app", "scripts"];

const MARKETING = /updates_subscribers/;
const MEMBER = /\bprofiles\b|auth\.users|health_self_ids|consent_records/;

// The ONE exemption, and the reason it is safe: database.types.ts is generated
// from the schema and declares every table in the database, so it necessarily
// names both. A type declaration cannot execute a query — there is no join to
// hide in it. Any *other* file naming both is a real finding.
const EXEMPT = new Set(["src/lib/database.types.ts"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function shippedFiles(): string[] {
  return SCANNED_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

describe("no join path between marketing data and member data", () => {
  it("no shipped or operational file references the updates list and a member table together", () => {
    const offenders = shippedFiles()
      .map((f) => ({ path: relative(ROOT, f), text: readFileSync(f, "utf8") }))
      .filter(({ path }) => !EXEMPT.has(path))
      .filter(({ text }) => MARKETING.test(text) && MEMBER.test(text))
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });

  it("the updates module names no member table at all", () => {
    const text = readFileSync(
      join(ROOT, "src", "lib", "updates", "subscribe.ts"),
      "utf8",
    );
    // The header comment explains the rule, so match code-shaped references
    // rather than the words: a table name used in a query is quoted or
    // dot-accessed, never prose.
    expect(text).not.toMatch(/["'`]profiles["'`]/);
    expect(text).not.toMatch(/["'`]auth\.users["'`]/);
    expect(text).not.toMatch(/["'`]health_self_ids["'`]/);
    expect(text).not.toMatch(/["'`]consent_records["'`]/);
  });

  it("no shipped file tries to look up whether a subscriber is a member", () => {
    // Dedupe across the boundary is the specific violation worth naming: the
    // same address in both places must stay two unrelated facts.
    const offenders = shippedFiles()
      .map((f) => ({ path: relative(ROOT, f), text: readFileSync(f, "utf8") }))
      .filter(({ path }) => !EXEMPT.has(path))
      .filter(({ text }) =>
        /updates_subscribers[\s\S]{0,400}(\.eq\(\s*["']email|from\(\s*["']profiles)/.test(
          text,
        ),
      )
      .map(({ path }) => path);

    expect(offenders).toEqual([]);
  });
});
