#!/usr/bin/env bash
# ADR 0005 tripwire: block anon/public-scoped RLS policies on sensitive tables.
# The standing anon SELECT grants (explicit-grants migration) mean a
# `create policy ... to anon` on profiles, consent_records, health_self_ids,
# or self_id_tags would go live INSTANTLY — anon row access on those tables is
# a deliberate privacy posture and may only change with an ADR + human review.
# Scans staged migration content statement-by-statement. Conservative + tunable.
set -euo pipefail
files=$(git diff ${GUARD_DIFF:---cached} --name-only --diff-filter=ACM \
  | grep -E '^supabase/migrations/.*\.sql$' || true)
[ -z "$files" ] && exit 0
bad=0
for f in $files; do
  # Staged content, lowercased, whitespace collapsed, split on ';' so the
  # policy's table and role list are checked within ONE statement.
  while IFS= read -r -d';' stmt; do
    s=$(printf '%s' "$stmt" | tr '[:upper:]' '[:lower:]' | tr -s '[:space:]' ' ')
    if printf '%s' "$s" | grep -Eq 'create +policy' \
      && printf '%s' "$s" | grep -Eq \
        ' on +(public\.)?(profiles|consent_records|health_self_ids|self_id_tags)([ (]|$)' \
      && printf '%s' "$s" | grep -Eq ' to +([^;]*[ ,])?(anon|public)([ ,]|$)'; then
      echo "BLOCKED: anon/public-scoped policy on a sensitive table in $f (ADR 0005 tripwire):"
      printf '  %s\n' "${s:0:200}"
      bad=1
    fi
  done < <(git show ":$f"; printf ';')
done
if [ "$bad" -ne 0 ]; then
  echo "anon may not gain row access to profiles/consent_records/health_self_ids/"
  echo "self_id_tags without a new ADR and human review (see docs/adr/0005)."
  exit 1
fi
exit 0
