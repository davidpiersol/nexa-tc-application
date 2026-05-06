#!/usr/bin/env bash
# Prints `netlify env:set` lines from .env.local for manual paste into Netlify CLI or Dashboard.
# Secrets with SECRET or KEY in the name are masked in stdout.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Usage: bash scripts/export-env-for-netlify.sh [path-to-env]"
  echo "Default: .env.local (missing)"
  exit 1
fi

REQUIRED=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "NEXT_PUBLIC_APP_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
)

OPTIONAL=(
  "SUPABASE_ATTACHMENTS_BUCKET"
  "API_INTEGRATIONS_ENCRYPTION_KEY"
  "INVITE_JWT_SECRET"
  "ANTHROPIC_API_KEY"
  "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN"
  "INNGEST_EVENT_KEY"
  "INNGEST_SIGNING_KEY"
  "POSTMARK_SERVER_TOKEN"
  "EMAIL_FROM"
  "NEXA_SKIP_MFA"
)

mask_value() {
  local key="$1"
  local val="$2"
  if [[ "$key" == *SECRET* || "$key" == *KEY* || "$key" == *TOKEN* || "$key" == *PASS* ]]; then
    echo "*******"
  else
    printf '%s' "$val"
  fi
}

echo ""
echo "# --- REQUIRED (minimum for app + UAT deploy smoke) ---"
for k in "${REQUIRED[@]}"; do
  echo "# $k"
done
echo ""
echo "# --- OPTIONAL (integrations / email / jobs) ---"
for k in "${OPTIONAL[@]}"; do
  echo "# $k"
done
echo ""

while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    val="${val%\"}"
    val="${val#\"}"
    val="${val%\'}"
    val="${val#\'}"
    masked=$(mask_value "$key" "$val")
    echo "netlify env:set $key \"$masked\""
    if [[ "$masked" == "*******" ]]; then
      echo "# ↑ masked — set real value in Netlify Dashboard or CLI from your local .env.local"
    fi
  fi
done < "$ENV_FILE"

echo ""
echo "Run the above after: netlify login"
echo "Or paste variables in: Netlify Dashboard → Site → Environment variables"
echo "Never commit .env.local. Review each line before running netlify env:set in CI."
echo ""
