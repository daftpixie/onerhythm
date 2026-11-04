#!/usr/bin/env bash
# Run the seven commit guards over a RANGE of commits rather than the index.
#
# Why this exists. Every guard reads `git diff --cached`, which is exactly right
# in .githooks/pre-commit and completely useless in CI: a fresh checkout has an
# empty index, so all seven exit 0 without inspecting a single line. Adding them
# to a workflow unchanged would have produced seven green checkmarks that prove
# nothing — the ADR 0013 failure mode, in the one place everybody looks.
#
# So the guards now honour a GUARD_DIFF override (default `--cached`), and this
# script works out the right range for wherever it is running.
#
# Usage:
#   scripts/run-guards.sh                 # auto-detect (CI env, else HEAD~1..HEAD)
#   scripts/run-guards.sh origin/main...HEAD
#   GUARD_DIFF=--cached scripts/run-guards.sh   # index, i.e. pre-commit behaviour
set -uo pipefail
cd "$(dirname "$0")/.."

range=${1:-}

if [ -z "$range" ]; then
  if [ -n "${GITHUB_BASE_REF:-}" ]; then
    # Pull request: everything this branch adds on top of the base.
    git fetch --quiet --no-tags origin "$GITHUB_BASE_REF" 2>/dev/null || true
    range="origin/${GITHUB_BASE_REF}...HEAD"
  elif [ -n "${GITHUB_EVENT_BEFORE:-}" ] &&
       [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ] &&
       git cat-file -e "${GITHUB_EVENT_BEFORE}^{commit}" 2>/dev/null; then
    # Push: the commits actually pushed.
    range="${GITHUB_EVENT_BEFORE}..HEAD"
  elif git rev-parse --verify --quiet HEAD~1 >/dev/null; then
    range="HEAD~1..HEAD"
  else
    # Root commit — nothing to compare against. Scan the whole tree by diffing
    # against the empty tree, so a first commit is not a free pass.
    range="$(git hash-object -t tree /dev/null)..HEAD"
  fi
fi

export GUARD_DIFF="$range"
echo "Running guards over: $range"
echo

failed=0
for guard in .claude/hooks/*.sh; do
  name=$(basename "$guard")
  if output=$("$guard" 2>&1); then
    printf '  ok    %s\n' "$name"
  else
    printf '  FAIL  %s\n' "$name"
    printf '%s\n' "$output" | sed 's/^/          /'
    failed=1
  fi
done

echo
if [ "$failed" -ne 0 ]; then
  echo "One or more guards blocked this change. These are the project's"
  echo "non-negotiables (CLAUDE.md); please do not work around them."
  exit 1
fi
echo "All guards passed."
