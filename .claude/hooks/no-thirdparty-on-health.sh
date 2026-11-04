#!/usr/bin/env bash
# Block third-party trackers/pixels anywhere in the app source AND in Edge
# Functions. No ad/tracking pixels on health or authenticated pages (FTC HBNR).
#
# ADR 0017 (Consequences, item 5): server code is scanned too, and AI-provider
# API hosts may appear ONLY inside the AI gateway module — never in client code
# (app/, src/) and never in any other Edge Function. A tracker is blocked
# everywhere, the gateway included. Caption and video-provider hosts join the
# AI list, allowed only from the Hub module, once the Hub ADR names vendors.
# Pinned by tests/unit/guards-ai-provider.test.ts. Conservative + tunable.
set -euo pipefail
files=$(git diff ${GUARD_DIFF:---cached} --name-only --diff-filter=ACM \
  | grep -E '\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|html)$' | grep -E '^(app/|src/|supabase/functions/)' || true)
[ -z "$files" ] && exit 0

trackers='googletagmanager|google-analytics|gtag\(|fbevents|connect\.facebook|facebook\.net|fbq\(|segment\.(io|com)|cdn\.mxpnl|mixpanel|hotjar|fullstory|clarity\.ms|cloudflareinsights'
hits=$(grep -nEi "$trackers" $files || true)
if [ -n "$hits" ]; then
  echo "BLOCKED: third-party tracker/pixel reference in app or Edge Function source:"
  echo "$hits"
  exit 1
fi

# AI-provider API hosts and SDK packages. Only the gateway module may name them.
ai_hosts='api\.anthropic\.com|api\.openai\.com|openai\.azure\.com|generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com|bedrock-runtime\.[a-z0-9-]+\.amazonaws\.com|api\.mistral\.ai|api\.cohere\.(com|ai)|api\.groq\.com|openrouter\.ai|["'"'"'](npm:)?(@anthropic-ai/sdk|openai|@google/(generative-ai|genai)|@mistralai/[a-z-]+|cohere-ai|groq-sdk)["'"'"'/@]'
outside_gateway=$(printf '%s\n' $files | grep -vE '^supabase/functions/ai-gateway/' || true)
if [ -n "$outside_gateway" ]; then
  ai_hits=$(grep -nEi "$ai_hosts" $outside_gateway || true)
  if [ -n "$ai_hits" ]; then
    echo "BLOCKED: AI-provider host outside supabase/functions/ai-gateway/ (ADR 0017):"
    echo "$ai_hits"
    exit 1
  fi
fi
exit 0
