#!/usr/bin/env bash
# Block any downvote/dislike mechanic from entering code. Scans staged source
# files only (docs may discuss "no downvote" freely). Conservative + tunable.
set -euo pipefail
files=$(git diff ${GUARD_DIFF:---cached} --name-only --diff-filter=ACM \
  | grep -E '\.(ts|tsx|js|jsx|sql)$' \
  | grep -vE '^(docs/|\.claude/)' || true)
[ -z "$files" ] && exit 0
hits=$(grep -nEi 'down[_-]?vote|dislike|thumbs?[_-]?down' $files \
  | grep -viE '\bno[ _-]?downvote\b|never .*downvote' || true)
if [ -n "$hits" ]; then
  echo "BLOCKED: possible downvote mechanic (upbeats-only is a non-negotiable):"
  echo "$hits"
  exit 1
fi
exit 0
