// Moderation invariants that live outside the database (plan §6; ADR 0019,
// ADR 0021). Committed failing before any moderation migration or code, per
// ADR 0013 and CLAUDE.md's test-first rule.
//
//   T4  — every member-linked moderation table joins MEMBER_OWNED_TABLES, so
//         the export and the deletion-cascade cross-check cover it.
//   T8  — honest copy: no string in app/ or src/ promises a reviewer, a
//         panel, a reply or a time while the gates are unmet. Proven against
//         a deliberate violation below.
//   T11 — triage is lists only: the triage function makes no network call and
//         never logs post text, a matched term or a "crisis matched" signal.
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { MEMBER_OWNED_TABLES } from "../../src/lib/rights/export";

const ROOT = join(__dirname, "..", "..");

function walk(dir: string, exts: RegExp): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.test(name)) out.push(p);
  }
  return out;
}

describe("T4: member-linked moderation tables join the export", () => {
  it.each([
    "reports",
    "member_blocks",
    "member_bans",
    "appeals",
    "second_look_requests",
    "floor_reexamination_requests",
    "removed_content",
    "moderator_grants",
    "moderator_pseudonyms",
  ])("%s is in MEMBER_OWNED_TABLES", (table) => {
    expect(MEMBER_OWNED_TABLES as readonly string[]).toContain(table);
  });

  it("has no muted_terms table to export (Q6: device only)", () => {
    expect(MEMBER_OWNED_TABLES as readonly string[]).not.toContain("muted_terms");
  });
});

// ---------------------------------------------------------------------------
// T8 — honest copy.
// ---------------------------------------------------------------------------

/** Promises the gates do not let us make yet (plan §4.5, §4.7; ADR 0021). */
export const UNMET_GATE_PROMISES: RegExp[] = [
  /\ba reviewer will\b/i,
  /\bwe(?:'ll| will) (?:review|reply|respond|get back|contact you)\b/i,
  /\bsomeone will (?:review|reply|respond|contact|get back)\b/i,
  /\b(?:our|the) (?:team|panel|moderators?) will (?:review|reply|respond|decide|contact)\b/i,
  /\bwithin \d+ (?:minutes?|hours?|days?)\b/i,
  /\b24\/7\b/,
];

function promisesIn(text: string): string[] {
  return UNMET_GATE_PROMISES.filter((re) => re.test(text)).map(String);
}

describe("T8: no copy promises a reviewer, panel, reply or time", () => {
  it("catches a deliberate violation (ADR 0013)", () => {
    expect(promisesIn("Thanks. A reviewer will contact you within 24 hours.")).not.toEqual([]);
    expect(promisesIn("Our panel will decide soon.")).not.toEqual([]);
  });

  it("allows the honest gate-unmet copy (plan §4.5)", () => {
    expect(
      promisesIn(
        "You can ask us to look at this again. We haven't set up our review " +
          "panel yet, so we can't say when. Your request is saved. You'll see " +
          "the answer in Settings.",
      ),
    ).toEqual([]);
  });

  it("finds no such promise anywhere in app/ or src/", () => {
    const files = [
      ...walk(join(ROOT, "app"), /\.(ts|tsx)$/),
      ...walk(join(ROOT, "src"), /\.(ts|tsx)$/),
    ];
    const hits = files.flatMap((f) =>
      promisesIn(readFileSync(f, "utf8")).map((re) => `${f}: ${re}`),
    );
    expect(hits).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// T11 — triage is lists only.
// ---------------------------------------------------------------------------

function triageSources(): string[] {
  const migrations = walk(join(ROOT, "supabase", "migrations"), /\.sql$/)
    .map((f) => readFileSync(f, "utf8"))
    .filter((sql) => /create (or replace )?function public\.triage_content\b/i.test(sql));
  return migrations;
}

describe("T11: triage is published lists only", () => {
  it("a triage function exists in the migrations", () => {
    expect(triageSources().length).toBeGreaterThan(0);
  });

  it("makes no network call", () => {
    for (const sql of triageSources()) {
      expect(sql).not.toMatch(/\b(net\.http_|http_get|http_post|extensions\.http|pg_net)\b/i);
    }
  });

  it("never logs post text, a matched term or a crisis signal", () => {
    for (const sql of triageSources()) {
      expect(sql).not.toMatch(/raise\s+(notice|log|info|debug|warning)[^;]*(new\.|body|term|crisis)/i);
    }
  });

  it("stores the category, never the matched term", () => {
    for (const sql of triageSources()) {
      expect(sql).not.toMatch(/matched_term|term_matched/i);
    }
  });
});
