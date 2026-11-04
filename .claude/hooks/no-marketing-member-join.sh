#!/usr/bin/env bash
# GUARD #8 (ADR 0011): marketing data may never be correlated with member data.
#
# updates_subscribers holds ordinary marketing contacts. A member's email is
# bound to opt-in health self-ID through the consent ledger, which makes it
# consumer health data (Amendment 1 §8.x). Joining the two would manufacture
# exactly the health-adjacent record neither person consented to — and the
# easiest way for that to happen is not a conspiracy, it is one innocent-looking
# helper that reaches for both tables to answer "is this subscriber a member?".
#
# So: no file in src/, app/ or scripts/ may name the updates list AND a member
# table. scripts/ is included because the Google Sheet mirror lives there, and
# an export is a join waiting to be written in a spreadsheet. The database enforces its half (no FK, no grant, no policy — pgTAP
# suite 04); this enforces the source half at commit time. The same scan runs
# over the whole tree in tests/unit/no-join-path.test.ts.
#
# EXEMPTION: src/lib/database.types.ts is generated from the schema and declares
# every table, so it necessarily names both. A type declaration cannot execute a
# query. Any other file naming both is a real finding.
set -euo pipefail

files=$(git diff ${GUARD_DIFF:---cached} --name-only --diff-filter=ACM \
  | grep -E '^(src|app|scripts)/.*\.(ts|tsx|js|jsx)$' \
  | grep -v '^src/lib/database\.types\.ts$' || true)
[ -z "$files" ] && exit 0

bad=0
for f in $files; do
  content=$(git show ":$f")
  if printf '%s' "$content" | grep -q 'updates_subscribers' \
    && printf '%s' "$content" | grep -Eq '\bprofiles\b|auth\.users|health_self_ids|consent_records'; then
    echo "BLOCKED: $f references the updates list AND a member table (ADR 0011)."
    printf '%s' "$content" | grep -nE 'updates_subscribers|\bprofiles\b|auth\.users|health_self_ids|consent_records' \
      | head -10 | sed 's/^/    /'
    bad=1
  fi
done

if [ "$bad" -ne 0 ]; then
  echo
  echo "Marketing contacts and member data are separate systems of record and"
  echo "must stay that way. The same address in both places is a coincidence"
  echo "this codebase must never resolve — no join, no view, no dedupe, no"
  echo "'is this subscriber a member?' lookup. See docs/adr/0011."
  exit 1
fi
exit 0
