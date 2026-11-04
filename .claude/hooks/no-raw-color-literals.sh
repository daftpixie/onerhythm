#!/usr/bin/env bash
# Guard #7 — the design-token guard.
#
# Colour literals may live in exactly ONE place: src/theme/tokens.ts. Everything
# in src/ and app/ imports from there.
#
# Why this is a guard and not a lint rule: Brand v3 retires a whole palette
# (ADR 0010). A retired colour that survives in one component is invisible in
# review — it renders fine, it just renders the OLD brand. Worse, the contrast
# suite computes from tokens.ts, so a hex literal in a component is a value the
# contrast tests CANNOT see. This guard is what makes those tests a real
# guarantee rather than a check on a file nobody reads.
#
# Scans staged source under src/ and app/ only. Docs, tests, config, and the
# brand asset SVGs are free to name colours.
set -euo pipefail

files=$(git diff ${GUARD_DIFF:---cached} --name-only --diff-filter=ACM \
  | grep -E '^(src|app)/.*\.(ts|tsx)$' \
  | grep -vE '^src/theme/tokens\.ts$' \
  | grep -vE '^src/lib/database\.types\.ts$' || true)
[ -z "$files" ] && exit 0

# Only look at files that still exist (a staged rename can leave a stale path).
existing=""
for f in $files; do [ -f "$f" ] && existing="$existing $f"; done
[ -z "$existing" ] && exit 0

# 3/4/6/8-digit hex, plus functional colour notation.
hits=$(grep -nEi \
  '#[0-9a-f]{3,4}\b|#[0-9a-f]{6}([0-9a-f]{2})?\b|\brgba?\s*\(|\bhsla?\s*\(' \
  $existing || true)

if [ -n "$hits" ]; then
  echo "BLOCKED: raw colour literal outside src/theme/tokens.ts"
  echo
  echo "$hits"
  echo
  echo "Brand v3 (ADR 0010) keeps every colour in src/theme/tokens.ts so that"
  echo "tests/unit/contrast.test.ts can prove the palette meets WCAG 2.2 AA."
  echo "A literal here is a colour the contrast suite cannot check."
  echo
  echo "  import { tokens } from '<path>/theme/tokens';"
  echo "  color: tokens.inkSecondary,"
  exit 1
fi
exit 0
