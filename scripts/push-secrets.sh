#!/usr/bin/env bash
# Copies the needed values from .env.local into GitHub Actions secrets without printing them.
# Run it yourself: `bash scripts/push-secrets.sh`
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.local; set +a
for k in GOOGLE_PLACES_SERVER_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  v="${!k:-}"
  if [ -z "$v" ]; then echo "skip $k (empty)"; continue; fi
  printf '%s' "$v" | gh secret set "$k" --body - >/dev/null && echo "set $k"
done
if [ -n "${VERCEL_DEPLOY_HOOK_URL:-}" ]; then printf '%s' "$VERCEL_DEPLOY_HOOK_URL" | gh secret set VERCEL_DEPLOY_HOOK_URL --body - >/dev/null && echo "set VERCEL_DEPLOY_HOOK_URL"; fi
