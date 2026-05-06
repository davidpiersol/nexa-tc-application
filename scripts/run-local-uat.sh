#!/usr/bin/env bash
# NEXA — full local UAT: typecheck, build, seed, dev server, ts UAT, Playwright.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

log_pass() { echo -e "${GREEN}PASS${NC} $*"; PASS=$((PASS + 1)); }
log_fail() { echo -e "${RED}FAIL${NC} $*"; FAIL=$((FAIL + 1)); }
warn() { echo -e "${YELLOW}WARN${NC} $*"; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo -e "\n${GREEN}=== NEXA LOCAL UAT ===${NC}\n"

if ! node -e "const v=parseInt(process.version.slice(1),10); process.exit(v>=18?0:1)" 2>/dev/null; then
  log_fail "Node.js 18+ required"
  exit 1
fi
log_pass "Node $(node -v)"

if [[ ! -f .env.local ]]; then
  echo -e "${RED}Missing .env.local${NC}. Copy: cp .env.example .env.local  then set Supabase keys and NEXT_PUBLIC_APP_URL."
  exit 1
fi
log_pass ".env.local present"

if [[ ! -d node_modules ]]; then
  warn "Installing dependencies…"
  npm ci || npm install
fi
log_pass "node_modules"

export NEXA_SKIP_MFA="${NEXA_SKIP_MFA:-1}"
export ALLOW_UAT_SEED="${ALLOW_UAT_SEED:-1}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "--- TypeScript ---"
if npx tsc --noEmit; then log_pass "tsc --noEmit"; else log_fail "tsc"; exit 1; fi

echo "--- next build ---"
if npm run build; then log_pass "next build"; else log_fail "next build"; exit 1; fi

echo "--- seed ---"
if npx tsx --env-file=.env.local scripts/seed.ts; then log_pass "seed"; else log_fail "seed"; exit 1; fi

echo "--- dev server ---"
PORT="${PORT:-3000}"
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  warn "Port $PORT in use — attempting to continue"
fi

npm run dev -- -p "$PORT" >/tmp/nexa-uat-dev.log 2>&1 &
DEV_PID=$!

cleanup() {
  if kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

READY=""
for i in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${PORT}" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.5
done

if [[ -z "$READY" ]]; then
  log_fail "dev server not ready in 30s (see /tmp/nexa-uat-dev.log)"
  tail -50 /tmp/nexa-uat-dev.log || true
  exit 1
fi
log_pass "dev server ready (pid $DEV_PID)"

echo "--- scripts/uat.ts ---"
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:${PORT}"
if npx tsx --env-file=.env.local scripts/uat.ts; then log_pass "scripts/uat.ts"; else log_fail "scripts/uat.ts"; exit 1; fi

echo "--- Playwright (chromium) ---"
export PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}"
npx playwright install chromium >/dev/null 2>&1 || true
if npx playwright test; then log_pass "playwright"; else log_fail "playwright"; exit 1; fi

echo -e "\n${GREEN}=== SUMMARY ===${NC}"
echo -e "Passed: ${GREEN}${PASS}${NC}  Failed: ${RED}${FAIL}${NC}"
exit 0
