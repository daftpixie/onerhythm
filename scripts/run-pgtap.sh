#!/usr/bin/env bash
# Run every pgTAP file in supabase/tests against the LOCAL Supabase stack and
# fail on anything short of a clean pass.
#
# Same mechanism as CONTRIBUTING.md (docker exec + psql, not `supabase test
# db`, which has reset people's local stacks). Each file must:
#   - run without a SQL error (ON_ERROR_STOP),
#   - print a plan line 1..N,
#   - print exactly N "ok" lines and no "not ok" line.
# A file that errors halfway, or stops early, therefore fails instead of
# passing on the assertions it happened to reach (ADR 0013).
#
# Usage: scripts/run-pgtap.sh [container]   (default: supabase_db_onerhythm)
set -uo pipefail
cd "$(dirname "$0")/.."

container=${1:-supabase_db_onerhythm}
total_files=0
total_ok=0
failed=0

for f in supabase/tests/*.sql; do
  total_files=$((total_files + 1))
  out=$(docker exec -i "$container" \
    psql -U postgres -d postgres -X -q -t -A -v ON_ERROR_STOP=1 -f - < "$f" 2>&1)
  status=$?
  plan=$(printf '%s\n' "$out" | sed -n 's/^1\.\.\([0-9][0-9]*\)$/\1/p' | head -1)
  ok=$(printf '%s\n' "$out" | grep -cE '^ok [0-9]+' || true)
  notok=$(printf '%s\n' "$out" | grep -cE '^not ok [0-9]+' || true)

  if [ "$status" -ne 0 ] || [ -z "$plan" ] || [ "$notok" -ne 0 ] || [ "$ok" -ne "$plan" ]; then
    printf '  FAIL  %s  (plan %s, ok %s, not ok %s, psql exit %s)\n' \
      "$f" "${plan:-none}" "$ok" "$notok" "$status"
    printf '%s\n' "$out" | grep -E '^not ok|^#|ERROR|FATAL' | sed 's/^/          /'
    failed=1
  else
    printf '  ok    %s  (%s assertions)\n' "$f" "$ok"
  fi
  total_ok=$((total_ok + ok))
done

echo
echo "pgTAP: $total_ok assertions passed across $total_files files."
if [ "$failed" -ne 0 ]; then
  echo "One or more pgTAP files failed."
  exit 1
fi
