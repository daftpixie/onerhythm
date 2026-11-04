#!/usr/bin/env bash
# Build the public release commit from a ref of this (private) repository,
# then check it. ADR 0024; the founder's runbook is docs/RELEASE_FRESH_HISTORY.md.
#
#   scripts/release/export.sh <source-ref> <target-dir>
#
# What it does:
#   1. Exports the tree at <source-ref> (tracked files only, no .git) into an
#      empty <target-dir>, minus the paths in scripts/release/EXCLUDE as
#      committed at that ref. Writes a fresh docs/SESSION_LOG.md.
#   2. Fails if any Markdown link points at an excluded path.
#   3. git init -b main, and ONE signed-off commit by the founder.
#   4. Tags it (annotated, default v0.1.0). Nothing is pushed.
#   5. Runs the checks inside the export.
#   6. Prints the commit, the file count, the check summary, and the push
#      command for the founder to run. This script never pushes.
#
# It can be re-run against whatever main is at release time; nothing here
# names a commit. Needs: git >= 2.28, node 22+, npm, gitleaks, and network
# access for npm ci. The pgTAP suite needs a database and is not run here.
#
# Environment overrides (optional):
#   RELEASE_TAG      default v0.1.0
#   RELEASE_REMOTE   default git@github.com:daftpixie/onerhythm.git (printed only)
#   SKIP_NPM=1       skip npm ci and every check that needs node_modules
#                    (for a quick dry run; the summary says so)
set -euo pipefail

usage() { echo "usage: $0 <source-ref> <target-dir>" >&2; exit 2; }
[ $# -eq 2 ] || usage

SRC_REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
REF=$1
TARGET=$2
TAG=${RELEASE_TAG:-v0.1.0}
REMOTE=${RELEASE_REMOTE:-git@github.com:daftpixie/onerhythm.git}

AUTHOR_NAME="Matthew J Adams"
AUTHOR_EMAIL="matthew@vt-infinite.com"

SHA=$(git -C "$SRC_REPO" rev-parse --verify --quiet "${REF}^{commit}") || {
  echo "error: '$REF' is not a commit in $SRC_REPO" >&2; exit 2; }
SHORT=${SHA:0:7}

if [ -e "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
  echo "error: $TARGET exists and is not empty. Use an empty or new directory." >&2
  exit 2
fi
mkdir -p "$TARGET"
TARGET=$(cd "$TARGET" && pwd)
case "$TARGET/" in
  "$SRC_REPO"/*) echo "error: the target must be outside the source repository." >&2; exit 2 ;;
esac

section() { printf '\n==== %s ====\n' "$*"; }

# Each check records a line; the run fails if any check fails.
RESULTS=()
FAILED=0
record() { # record <ok|FAIL|SKIP|NOTE> <name> [detail]
  RESULTS+=("$(printf '%-5s %s%s' "$1" "$2" "${3:+  ($3)}")")
  [ "$1" = FAIL ] && FAILED=1
  return 0
}
run_check() { # run_check <name> <command...>
  local name=$1; shift
  section "$name"
  if "$@"; then record ok "$name"; else record FAIL "$name"; fi
}

# ---------------------------------------------------------------------------
section "1. Export $REF ($SHA) into $TARGET"

EXCLUDE_TEXT=$(git -C "$SRC_REPO" show "$SHA:scripts/release/EXCLUDE") || {
  echo "error: scripts/release/EXCLUDE does not exist at $REF" >&2; exit 2; }
EXCLUDE_FILE=$(mktemp)
trap 'rm -f "$EXCLUDE_FILE"' EXIT
printf '%s\n' "$EXCLUDE_TEXT" > "$EXCLUDE_FILE"
EXCLUDED=()   # (no mapfile: macOS ships bash 3.2)
while IFS= read -r line; do
  if [ -n "$line" ]; then EXCLUDED+=("$line"); fi
done < <(sed -e 's/#.*$//' -e 's/[[:space:]]*$//' -e 's/^[[:space:]]*//' "$EXCLUDE_FILE")
[ "${#EXCLUDED[@]}" -gt 0 ] || { echo "error: EXCLUDE lists no paths" >&2; exit 2; }

git -C "$SRC_REPO" archive --format=tar "$SHA" | tar -x -C "$TARGET"

for p in "${EXCLUDED[@]}"; do
  case "$p" in /*|*..*) echo "error: EXCLUDE path must be relative and inside the tree: $p" >&2; exit 2 ;; esac
  if [ -e "$TARGET/${p%/}" ]; then
    rm -rf "${TARGET:?}/${p%/}"
    echo "  excluded  $p"
  else
    echo "  absent    $p"
  fi
done

RELEASE_DATE=$(date -u +%Y-%m-%d)
mkdir -p "$TARGET/docs"
cat > "$TARGET/docs/SESSION_LOG.md" <<EOF
# OneRhythm — Session log

Each working session adds an entry here: what changed, the key decisions,
and the next step.

## $RELEASE_DATE — First public release ($TAG)

OneRhythm's first public release, under the Apache License 2.0
([ADR 0024](adr/0024-apache-2-and-fresh-history-release.md)). Built by
\`scripts/release/export.sh\` from commit \`$SHORT\` of the private
repository. Earlier working history is kept privately by VT Infinite, Inc.

- **What this is:** an open-source peer-support platform for people living
  with cardiac arrhythmia and the people who care for them, released as a
  prototype for others to read, check and build on.
- **Not launched:** the public web build is the landing page only
  ([ADR 0023](adr/0023-railway-landing-only-web-host.md)). The member
  platform stays gated until its launch gates are met
  ([ADR 0021](adr/0021-appeals-and-launch-gates.md)).
- **Where decisions live:** [\`docs/adr/\`](adr/), and the plan for each
  phase in \`.claude/plans/\`.
- **Left out of this release,** with reasons: \`scripts/release/EXCLUDE\`.

**Next:** work continues in this repository, by pull request.
EOF
echo "  wrote     docs/SESSION_LOG.md (fresh)"

# ---------------------------------------------------------------------------
section "2. Links to excluded paths"
if node "$SRC_REPO/scripts/release/check-links.mjs" "$TARGET" "$EXCLUDE_FILE"; then
  record ok "links: none point at an excluded path"
else
  record FAIL "links: some point at an excluded path (fix them in the private repo first)"
  echo
  echo "Stopping before the commit. Fix the links above in the private repository,"
  echo "then run this again."
  printf '\n==== Summary ====\n'; printf '  %s\n' "${RESULTS[@]}"
  exit 1
fi

# ---------------------------------------------------------------------------
section "3. One commit"
cd "$TARGET"
git init -q -b main
git config user.name "$AUTHOR_NAME"
git config user.email "$AUTHOR_EMAIL"
git add -A

MSG=$(mktemp)
cat > "$MSG" <<EOF
OneRhythm: first public release

OneRhythm is an open-source peer-support platform for people living with
cardiac arrhythmia and the people who care for them. This is a prototype,
released so that others can read it, check it and build on it.

- License: Apache-2.0. The OneRhythm name and the 1R mark are not
  licensed; see NOTICE.
- Not launched. The public web build is the landing page only, and the
  member platform stays gated until its launch gates are met (ADR 0021,
  ADR 0023).
- History starts here. Earlier working history is kept privately by
  VT Infinite, Inc. (ADR 0024).
- Decisions are recorded in docs/adr/, with the options we rejected.

Co-Authored-By: Claude <noreply@anthropic.com>
Signed-off-by: $AUTHOR_NAME <$AUTHOR_EMAIL>
EOF
GIT_AUTHOR_NAME="$AUTHOR_NAME" GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" \
GIT_COMMITTER_NAME="$AUTHOR_NAME" GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
  git commit -q --no-verify -F "$MSG"
rm -f "$MSG"
# --no-verify: the export has no hooks installed; the same checks run below,
# over the finished commit, where their results can be reported.
RELEASE_SHA=$(git rev-parse HEAD)
git log -1 --format='%H%n%an <%ae> / %cn <%ce>%n%n%B'

# ---------------------------------------------------------------------------
section "4. Tag $TAG (annotated, not pushed)"
GIT_COMMITTER_NAME="$AUTHOR_NAME" GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
  git tag -a "$TAG" -m "OneRhythm $TAG: first public release"
echo "  $TAG -> $(git rev-parse "$TAG^{commit}") (tag object $(git rev-parse "$TAG"))"

# ---------------------------------------------------------------------------
section "5. Checks inside the export"

check_history() {
  [ "$(git rev-list --count HEAD)" = 1 ] &&
  [ "$(git log -1 --format='%an <%ae>')" = "$AUTHOR_NAME <$AUTHOR_EMAIL>" ] &&
  [ "$(git log -1 --format='%cn <%ce>')" = "$AUTHOR_NAME <$AUTHOR_EMAIL>" ] &&
  git log -1 --format=%B | grep -qx "Signed-off-by: $AUTHOR_NAME <$AUTHOR_EMAIL>" &&
  git log -1 --format=%B | grep -qx "Co-Authored-By: Claude <noreply@anthropic.com>" &&
  ! git log -1 --format=%B | grep -qi "Claude-Session"
}
run_check "history: one commit, founder as author and committer, signed off, no session trailer" check_history

check_excluded_absent() {
  local bad=0
  for p in "${EXCLUDED[@]}"; do
    [ "$p" = docs/SESSION_LOG.md ] && continue   # replaced by the fresh log
    if git ls-files --error-unmatch -- "${p%/}" >/dev/null 2>&1 || [ -e "${p%/}" ]; then
      echo "  present: $p"; bad=1
    fi
  done
  # The fresh log must be the only session log, and must not be the old one.
  [ "$(git show HEAD:docs/SESSION_LOG.md | grep -c '^## ')" = 1 ] || { echo "  docs/SESSION_LOG.md is not the fresh log"; bad=1; }
  return $bad
}
run_check "no excluded path exists" check_excluded_absent

if command -v gitleaks >/dev/null; then
  run_check "gitleaks dir (the tree, before npm ci)" gitleaks dir . --no-banner --redact
  run_check "gitleaks git (the one-commit history)" gitleaks git . --no-banner --redact
else
  record FAIL "gitleaks" "not installed; install it and re-run"
fi

run_check "guards (all seven, the whole tree as the diff)" \
  env -u GITHUB_BASE_REF -u GITHUB_EVENT_BEFORE scripts/run-guards.sh

if [ "${SKIP_NPM:-0}" = 1 ]; then
  record SKIP "npm ci, typecheck, lint, jest" "SKIP_NPM=1"
else
  run_check "npm ci" npm ci --legacy-peer-deps --no-audit --no-fund
  run_check "typecheck" npm run typecheck
  run_check "lint" npm run lint -- --max-warnings 5
  run_check "jest rn + web" npx jest --selectProjects rn web --ci
  run_check "jest rn + web, landing mode (as CI)" \
    env EXPO_PUBLIC_SITE_MODE=landing npx jest --selectProjects rn web --ci \
      --testNamePattern '^(?!.*offers the updates form).*$'
  run_check "entity-wording, license and contact tests" \
    npx jest tests/unit/entity-wording.test.ts tests/unit/license.test.ts \
      tests/unit/contact-address.test.ts --selectProjects rn --ci
fi

section "pgTAP"
echo "  Not run: pgTAP needs a running database. CI on the public repository"
echo "  runs it (the db job)."
record NOTE "pgTAP" "needs a database; covered by the public repo's CI db job"

# Report-only greps, except where a hit is in public copy (what a visitor or
# member reads: app/, src/, public/, supabase/functions/*.ts).
section "Greps: session links, ccr- branch names, TODO(founder)"
PUBLIC_COPY='^(app|src|public)/|^supabase/functions/.*\.ts$'
grep_report() { # grep_report <label> <regex>
  local label=$1 re=$2 hits copy
  hits=$(git grep -nIE "$re" -- . ':!scripts/release/export.sh' || true)
  if [ -z "$hits" ]; then
    echo "  $label: no hits"; record ok "grep $label" "0 hits"; return
  fi
  echo "  $label: $(printf '%s\n' "$hits" | wc -l) hit(s)"
  printf '%s\n' "$hits" | sed 's/^/    /' | cut -c1-200
  copy=$(printf '%s\n' "$hits" | grep -E "$PUBLIC_COPY" || true)
  if [ -n "$copy" ]; then
    record FAIL "grep $label" "$(printf '%s\n' "$copy" | wc -l) in public copy"
  else
    record NOTE "grep $label" "$(printf '%s\n' "$hits" | wc -l) in docs or tooling; reported, not failed"
  fi
}
grep_report "claude.ai/code/session" 'claude\.ai/code/session'
grep_report "ccr- branch names" '\bccr-[a-z0-9]{6,}'
grep_report "TODO(founder)" 'TODO\(founder\)'

# ---------------------------------------------------------------------------
section "6. Result"
FILES=$(git ls-files | wc -l | tr -d ' ')
echo "  source        $REF = $SHA"
echo "  export        $TARGET"
echo "  commit        $RELEASE_SHA"
echo "  tag           $TAG"
echo "  files         $FILES"
echo
echo "  Checks:"
printf '    %s\n' "${RESULTS[@]}"
echo
SKIPPED=0
for r in "${RESULTS[@]}"; do case "$r" in SKIP*) SKIPPED=1 ;; esac; done
if [ "$FAILED" -eq 0 ] && [ "$SKIPPED" -ne 0 ]; then
  echo "  No check failed, but some were SKIPPED. This is a dry run: do not push it."
  echo "  Run again without SKIP_NPM before releasing."
  exit 0
fi
if [ "$FAILED" -ne 0 ]; then
  echo "  One or more checks FAILED. Do not push this export. Fix the cause in the"
  echo "  private repository, merge, and run this script again."
  exit 1
fi
cat <<EOF
  All checks passed. When you are ready (docs/RELEASE_FRESH_HISTORY.md, step 5),
  the founder runs, from a machine signed in to GitHub:

    cd "$TARGET"
    git remote add origin $REMOTE
    git push -u origin main
    git push origin $TAG

  This script has not pushed anything.
EOF
