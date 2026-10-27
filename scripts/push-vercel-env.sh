#!/usr/bin/env bash
# Copies app env vars from .env.local into the linked Vercel project without printing them.
# Prereq: `npm i -g vercel && vercel login && vercel link` (project name: colo-nyc). Run: `bash scripts/push-vercel-env.sh`
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.local; set +a
add() { # name, value, environments...
  local name="$1" value="$2"; shift 2
  for env in "$@"; do
    # Value goes through stdin (never argv). --yes/--force: non-interactive and overwrite. Vercel never echoes values.
    # NEXT_PUBLIC_* ship to the browser by design (anon key is RLS-guarded, Maps key is referrer-locked): store as config.
    local kind="--sensitive"; [[ "$name" == NEXT_PUBLIC_* ]] && kind="--no-sensitive"
    if out=$(printf '%s' "$value" | vercel env add "$name" "$env" $kind --yes --force 2>&1); then
      echo "set $name ($env)"
    else
      echo "FAILED $name ($env): $(echo "$out" | grep -iE 'error|warn' | head -2)"
    fi
  done
}
# Map key + Map ID: production only (the browser key allows only colo-nyc.vercel.app; previews run map-less by design).
add NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY "$NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY" production
add NEXT_PUBLIC_GOOGLE_MAP_ID "$NEXT_PUBLIC_GOOGLE_MAP_ID" production
for env in production preview; do
  add NEXT_PUBLIC_SUPABASE_URL "$NEXT_PUBLIC_SUPABASE_URL" "$env"
  add NEXT_PUBLIC_SUPABASE_ANON_KEY "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "$env"
  add SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" "$env"
  add ADMIN_EMAILS "$ADMIN_EMAILS" "$env"
  add IP_HASH_SALT "$IP_HASH_SALT" "$env"
done
add NEXT_PUBLIC_SITE_URL "https://colo-nyc.vercel.app" production
