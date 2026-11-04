#!/usr/bin/env node
// Copy the brand assets the WEB build needs into public/.
//
// Expo copies public/ to the root of the web export (its EXPO_PUBLIC_FOLDER
// default), which is where the favicon links, the manifest, and the ABSOLUTE
// og:image URLs in public/index.html all point. Those files therefore have to
// exist at the site root — but assets/brand/svg/1r-mark.svg stays the single
// source of truth for the mark (assets/brand/README.md: regenerate rasters,
// never edit them). So public/ holds copies, and this script makes them.
//
// Run it after regenerating any brand raster:
//   npm run sync:brand
//
// tests/unit/brand-public-sync.test.ts reads the same manifest and fails the
// build if a copy has drifted from its source, so a regenerated icon that
// never reached public/ breaks the suite instead of quietly serving last
// month's mark in every social preview.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(__dirname, "brand-public-assets.json");

const assets = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

let copied = 0;
let unchanged = 0;

for (const { from, to } of assets) {
  const source = path.join(ROOT, from);
  const dest = path.join(ROOT, to);

  if (!fs.existsSync(source)) {
    console.error(`MISSING SOURCE: ${from}`);
    process.exitCode = 1;
    continue;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  if (
    fs.existsSync(dest) &&
    fs.readFileSync(dest).equals(fs.readFileSync(source))
  ) {
    unchanged += 1;
    continue;
  }

  fs.copyFileSync(source, dest);
  copied += 1;
  console.log(`copied  ${from} -> ${to}`);
}

console.log(
  `brand assets: ${copied} copied, ${unchanged} already up to date, ` +
    `${assets.length} total.`,
);
