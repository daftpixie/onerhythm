#!/usr/bin/env node
// Link check for a release export (scripts/release/export.sh, ADR 0024).
//
//   node scripts/release/check-links.mjs <export-dir> <exclude-file>
//
// FAIL  a Markdown link, or a link to this repository on GitHub, that points
//       at an excluded path. The fix belongs in the private repository first,
//       not in a silent rewrite of the export.
// WARN  a relative Markdown link to a file that does not exist.
// NOTE  plain-text mentions of an excluded path that is absent from the
//       export (not links; reported so a reader is not sent looking).
//
// Exits 1 if there is any FAIL, else 0.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

const [, , exportDir, excludeFile] = process.argv;
if (!exportDir || !excludeFile) {
  console.error("usage: check-links.mjs <export-dir> <exclude-file>");
  process.exit(2);
}

const REPO_URL = /https?:\/\/github\.com\/daftpixie\/onerhythm\/(?:blob|tree|raw)\/[^/\s)]+\/([^\s)"'`<>#?]+)/g;
const TEXT = /\.(md|mdx|tsx?|jsx?|mjs|cjs|json|ya?ml|sh|sql|html|txt|toml)$/i;

const excluded = readFileSync(excludeFile, "utf8")
  .split("\n")
  .map((l) => l.replace(/#.*$/, "").trim())
  .filter(Boolean);

const toPosix = (p) => p.split(sep).join("/");
const isExcluded = (rel) =>
  excluded.some((e) => (e.endsWith("/") ? rel === e.slice(0, -1) || rel.startsWith(e) : rel === e));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = walk(exportDir);
const fails = [];
const warns = [];
const notes = [];

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

for (const abs of files) {
  const rel = toPosix(relative(exportDir, abs));
  if (!TEXT.test(rel)) continue;
  const text = readFileSync(abs, "utf8");

  // Links to this repository on GitHub, in any text file.
  for (const m of text.matchAll(REPO_URL)) {
    const target = decodeURIComponent(m[1]).replace(/\/$/, "");
    if (isExcluded(target)) fails.push(`${rel}:${lineOf(text, m.index)}  ${m[0]}  -> excluded: ${target}`);
    else if (!existsSync(join(exportDir, target)))
      warns.push(`${rel}:${lineOf(text, m.index)}  ${m[0]}  -> not in the export`);
  }

  if (!/\.mdx?$/i.test(rel)) continue;

  // Markdown links, outside fenced code blocks (code is not a link).
  const prose = text.replace(/^(```|~~~)[\s\S]*?^\1/gm, (block) => block.replace(/[^\n]/g, " "));
  const inline = /\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
  const refdef = /^\s{0,3}\[[^\]]+\]:\s*<?(\S+?)>?(?:\s|$)/gm;
  for (const re of [inline, refdef]) {
    for (const m of prose.matchAll(re)) {
      const href = m[1];
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")) continue;
      const path = decodeURIComponent(href.split(/[#?]/)[0]);
      if (!path) continue;
      const target = toPosix(
        normalize(path.startsWith("/") ? path.slice(1) : join(dirname(rel), path)),
      ).replace(/\/$/, "");
      const where = `${rel}:${lineOf(text, m.index)}`;
      if (isExcluded(target)) fails.push(`${where}  (${href})  -> excluded: ${target}`);
      else if (!existsSync(join(exportDir, target))) warns.push(`${where}  (${href})  -> missing: ${target}`);
    }
  }
}

// Plain mentions of excluded paths that are absent from the export.
const absent = excluded.filter((e) => !existsSync(join(exportDir, e.replace(/\/$/, ""))));
const mentionable = absent
  .filter((e) => e.includes("/") && !e.startsWith("."))
  .map((e) => ({ e, re: new RegExp(`(?<![\\w./-])${e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) }));
for (const abs of files) {
  const rel = toPosix(relative(exportDir, abs));
  if (!TEXT.test(rel) || rel === "scripts/release/EXCLUDE") continue;
  const lines = readFileSync(abs, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { e, re } of mentionable) {
      if (re.test(line)) notes.push(`${rel}:${i + 1}  mentions ${e}`);
    }
  });
}

const print = (label, list) => {
  console.log(`${label}: ${list.length}`);
  for (const l of list) console.log(`  ${l}`);
};
print("FAIL  links to excluded paths", fails);
print("WARN  links to missing files", warns);
print("NOTE  plain mentions of excluded paths (not links)", notes);
process.exit(fails.length ? 1 : 0);
