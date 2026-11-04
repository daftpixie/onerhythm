#!/usr/bin/env bash
# Transparency ledger tamper guard (Phase 1T; ADR 0008). The open books are
# append-only: a CLOSED support month (any month before the current calendar
# month) is never modified or deleted, and cost entries are never deleted.
# Corrections are NEW entries with a note — the mistake and the fix both stay
# visible. Conservative + tunable, like the other guards.
set -euo pipefail
current_month=$(date +%Y-%m)
bad=0

# 1. Closed support months: no modify, no delete. (Adding new files is fine;
#    the current, still-open month may be edited until it closes.)
while IFS=$'\t' read -r status file; do
  [ -z "${file:-}" ] && continue
  month=$(basename "$file" .yml)
  if [[ "$month" < "$current_month" ]]; then
    echo "BLOCKED: $file is a CLOSED month (before $current_month) and was ${status}."
    bad=1
  fi
done < <(git diff ${GUARD_DIFF:---cached} --name-status --diff-filter=MDR \
          | grep -E $'\t''transparency/support/[0-9]{4}-[0-9]{2}\.yml' \
          | awk -F'\t' '{print $1 "\t" $2}' || true)

# 2. costs.yml: entries may be added or updated, never deleted.
if git diff ${GUARD_DIFF:---cached} --name-only | grep -qx "transparency/costs.yml"; then
  removed=$(git diff ${GUARD_DIFF:---cached} -U0 -- transparency/costs.yml \
    | grep -E '^-[^-]' | grep -E '^\-\s*- name:' || true)
  if [ -n "$removed" ]; then
    echo "BLOCKED: entry deletion(s) staged in transparency/costs.yml:"
    echo "$removed"
    bad=1
  fi
fi

if [ "$bad" -ne 0 ]; then
  echo "The transparency ledger is append-only. Closed months and existing"
  echo "cost entries never change; corrections go in as NEW entries with a"
  echo "note (see transparency/README.md)."
  exit 1
fi
exit 0
