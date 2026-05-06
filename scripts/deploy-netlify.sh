#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo -e "\n${GREEN}=== NEXA NETLIFY DEPLOY ===${NC}\n"

if ! command -v netlify >/dev/null 2>&1; then
  echo -e "${RED}Netlify CLI not found.${NC} Install: npm install -g netlify-cli"
  exit 1
fi

if ! netlify status >/dev/null 2>&1; then
  echo -e "${YELLOW}Starting Netlify login…${NC}"
  netlify login
fi

if [[ ! -f .netlify/state.json ]] && [[ ! -f .netlify/netlify.toml ]]; then
  echo -e "${YELLOW}No linked site in .netlify/. Run: netlify init${NC} then re-run."
  exit 1
fi

echo "--- Local UAT (must pass) ---"
bash scripts/run-local-uat.sh

echo "--- Production build ---"
npm run build

echo ""
bash scripts/export-env-for-netlify.sh

read -r -p "Have you set all required environment variables in Netlify? [y/N] " reply
if [[ ! "${reply,,}" =~ ^y ]]; then
  echo -e "${YELLOW}Configure variables in Netlify → Site → Environment variables, then re-run.${NC}"
  exit 1
fi

echo -e "\n${GREEN}netlify deploy --prod${NC}\n"
DEPLOY_LOG="$(mktemp)"
if netlify deploy --prod 2>&1 | tee "$DEPLOY_LOG"; then
  :
else
  echo -e "${RED}Deploy failed.${NC}"
  exit 1
fi

LIVE_URL="$(grep -Eo 'https://[^ ]+\.netlify\.app[^ ]*' "$DEPLOY_LOG" | head -1 || true)"
if [[ -n "$LIVE_URL" ]]; then
  echo -e "\n${GREEN}Live URL:${NC} $LIVE_URL"
  if [[ "${SKIP_PROD_PLAYWRIGHT:-}" == "1" ]]; then
    echo -e "${YELLOW}SKIP_PROD_PLAYWRIGHT=1 — skipping remote Playwright.${NC}"
  else
    echo "--- Playwright (production; fails if MFA blocks TC session) ---"
    export PLAYWRIGHT_BASE_URL="$LIVE_URL"
    export NEXT_PUBLIC_APP_URL="$LIVE_URL"
    if npx playwright test; then
      echo -e "${GREEN}Playwright passed against production.${NC}"
    else
      echo -e "${YELLOW}Playwright failed on production (often MFA / cold start). Re-run locally with PLAYWRIGHT_BASE_URL or set SKIP_PROD_PLAYWRIGHT=1.${NC}"
    fi
  fi
else
  echo -e "${YELLOW}Could not parse deploy URL from CLI output; skip remote Playwright.${NC}"
fi

echo -e "\n${GREEN}Done.${NC}\n"
