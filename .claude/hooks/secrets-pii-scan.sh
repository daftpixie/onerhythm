#!/usr/bin/env bash
# Block obvious secrets/keys from being committed.
set -euo pipefail
files=$(git diff ${GUARD_DIFF:---cached} --name-only --diff-filter=ACM || true)
[ -z "$files" ] && exit 0
# Real .env files must never be staged. Placeholder templates (*.example) are OK.
env_files=$(echo "$files" | grep -E '(^|/)\.env([._-][^/]*)?$' | grep -vE '\.example$' || true)
if [ -n "$env_files" ]; then
  echo "BLOCKED: an environment file is staged — never commit env secrets:"; echo "$env_files"; exit 1
fi
# Service-account key files must never be staged, whatever they are named.
# The updates-list Google Sheet mirror (ADR 0011) authenticates with one of
# these; it lives at a gitignored path referenced by env, server/local only.
sa_files=$(echo "$files" | grep -Ei '(^|/)(service[-_]?account|gcp[-_]?key|google[-_]?credentials)[^/]*\.json$' || true)
if [ -n "$sa_files" ]; then
  echo "BLOCKED: a service-account key file is staged:"; echo "$sa_files"; exit 1
fi

# Content patterns. sb_secret_ = new-format Supabase secret (service) key; the
# legacy service_role JWT pattern is kept. AI-provider keys (Anthropic `sk-ant-…`,
# OpenAI project keys `sk-proj-…` and legacy `sk-…`, Google AI `AIza…`) were added for ADR 0017 Consequence 5 and are
# pinned by tests/unit/guards-ai-provider.test.ts. The sb_publishable_ key is PUBLIC and
# is deliberately NOT matched. The Google service-account patterns are matched
# on the JSON's own shape as well as the PEM header, so a file whose key has
# been rotated or redacted is still caught by what it obviously is.
hits=$(git diff ${GUARD_DIFF:---cached} -U0 \
  | grep -E '^\+' \
  | grep -nEi 'sk_live_[0-9a-zA-Z]+|sk-ant-[A-Za-z0-9_-]{20,}|sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{40,}|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|service_role.*ey[A-Za-z0-9_-]+\.|sb_secret_[A-Za-z0-9_-]{8,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|"type"[[:space:]]*:[[:space:]]*"service_account"|[a-z0-9-]+@[a-z0-9-]+\.iam\.gserviceaccount\.com' \
  || true)
if [ -n "$hits" ]; then
  echo "BLOCKED: possible secret/key in staged changes:"
  echo "$hits"
  exit 1
fi

# ---------------------------------------------------------------------------
# Transactional-mail provider credentials (ADR 0015).
#
# Added because the audit found the patterns above caught neither a Resend-class
# API key nor a plain SMTP password. The confirmation-email Edge Function needs
# one of these, and its whole safety property is that the key lives ONLY in a
# Supabase Edge Function secret — never in the client bundle, never in an
# EXPO_PUBLIC_* var, never in git.
#
# Token shapes: Resend `re_…`, SendGrid `SG.<id>.<secret>`, Mailgun `key-<32 hex>`,
# Postmark server tokens are bare UUIDs and are deliberately NOT matched — the
# shape is too generic to distinguish from any other UUID in the tree.
# ---------------------------------------------------------------------------

# Placeholders in *.example templates are the normal, correct way to document
# the contract, so they must not trip this. Filtered by VALUE rather than by
# filename, because the point is to catch a real key wherever it lands — and a
# real key does not contain the word "example" or an angle bracket.
placeholderish='(example|your[-_]?|changeme|placeholder|redacted|xxxx|<|\$\{|…|\.\.\.)'

mail_hits=$(git diff ${GUARD_DIFF:---cached} -U0 \
  | grep -E '^\+' \
  | grep -nE 're_[A-Za-z0-9_]{16,}|SG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}|key-[0-9a-f]{32}' \
  | grep -viE "$placeholderish" \
  || true)

# A value that is ONLY an env(NAME) reference is how supabase/config.toml names
# a key without holding it (the stock OpenAI key line uses one).
# The whole value must be the reference, so `env(X)` followed by a real value
# still blocks. Pinned by tests/unit/guards-ai-provider.test.ts.
env_ref_only='[:=][[:space:]]*["'"'"']?env\([A-Za-z0-9_]+\)["'"'"']?[[:space:]]*(#.*)?$'

# A password ASSIGNMENT with a real-looking value.
pw_hits=$(git diff ${GUARD_DIFF:---cached} -U0 \
  | grep -E '^\+' \
  | grep -nEi '(SMTP_PASS(WORD)?|MAIL_PASS(WORD)?|RESEND_API_KEY|SENDGRID_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY)[[:space:]]*[:=][[:space:]]*.{8,}' \
  | grep -viE "$placeholderish" \
  | grep -vE "$env_ref_only" \
  || true)

if [ -n "$mail_hits" ] || [ -n "$pw_hits" ]; then
  echo "BLOCKED: possible mail- or AI-provider credential in staged changes:"
  [ -n "$mail_hits" ] && echo "$mail_hits"
  [ -n "$pw_hits" ] && echo "$pw_hits"
  echo "The mail key belongs in a Supabase Edge Function secret only:"
  echo "  npx supabase secrets set RESEND_API_KEY=…"
  echo "See supabase/functions/send-confirmation-email/README.md."
  exit 1
fi
exit 0
