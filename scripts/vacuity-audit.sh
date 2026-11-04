#!/usr/bin/env bash
# Vacuity audit harness (ADR 0013).
#
# A test only counts as a guarantee if it FAILS when the thing it guards is
# deliberately broken. This applies one mutation, runs one target, restores the
# file, and reports whether the mutation was caught.
#
# Usage:
#   scripts/vacuity-audit.sh <label> <file> <perl-expr> <runner> [runner-arg...]
#
# <perl-expr> is applied with `perl -0pi -e` so it can match across lines.
# <runner> is either:
#   jest <testPathPattern>   — expects RED (non-zero) after mutation
#   guard <path/to/guard.sh> — expects the guard to BLOCK (non-zero)
#   cmd  <command...>        — expects non-zero
#
# Exit 0 means the mutation WAS caught (good). Exit 1 means it slipped through
# (the test is vacuous — that is the finding).
set -uo pipefail

label=$1; file=$2; expr=$3; runner=$4; shift 4

[ -f "$file" ] || { printf 'MISSING  %-52s (%s)\n' "$label" "$file"; exit 1; }

backup=$(mktemp)
cp "$file" "$backup"
restore() { cp "$backup" "$file"; rm -f "$backup"; }
trap restore EXIT

perl -0pi -e "$expr" "$file"

if cmp -s "$file" "$backup"; then
  printf 'NO-OP    %-52s mutation did not change the file\n' "$label"
  exit 1
fi

case "$runner" in
  jest)  npx jest --testPathPattern "$1" >/dev/null 2>&1 ;;
  guard) "$1" >/dev/null 2>&1 ;;
  cmd)   "$@" >/dev/null 2>&1 ;;
  *)     printf 'BADRUN   %s\n' "$label"; exit 1 ;;
esac
rc=$?

if [ $rc -ne 0 ]; then
  printf 'CAUGHT   %-52s (violation detected)\n' "$label"
  exit 0
else
  printf 'VACUOUS  %-52s (violation NOT detected)\n' "$label"
  exit 1
fi
