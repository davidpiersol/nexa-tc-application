#!/usr/bin/env bash
# One-shot: Docker Supabase (when URL is local), migrations reset, UAT seed, verify, Next :3000, login smoke.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

get_env() {
  local key="$1"
  local line
  line=$(grep -E "^[[:space:]]*${key}[[:space:]]*=" .env.local 2>/dev/null | tail -1 || true)
  [[ -z "$line" ]] && return 0
  local val="${line#*=}"
  val="${val%%#*}"
  val="${val#"${val%%[![:space:]]*}"}"
  val="${val%"${val##*[![:space:]]}"}"
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  printf '%s' "$val"
}

if [[ ! -f .env.local ]]; then
  echo "[ready] missing .env.local"
  exit 1
fi

SUPABASE_URL="$(get_env NEXT_PUBLIC_SUPABASE_URL)"
SERVICE_ROLE="$(get_env SUPABASE_SERVICE_ROLE_KEY)"
if [[ -z "$SUPABASE_URL" || -z "$SERVICE_ROLE" ]]; then
  echo "[ready] NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local"
  exit 1
fi

LOCAL_SB=0
case "$SUPABASE_URL" in
  *127.0.0.1:54321* | *localhost:54321*) LOCAL_SB=1 ;;
esac

echo "[ready] supabase start"
supabase start --yes

if [[ "$LOCAL_SB" -eq 1 ]]; then
  echo "[ready] db reset (local)"
  supabase db reset --yes
else
  echo "[ready] remote NEXT_PUBLIC_SUPABASE_URL — skipping db reset"
fi

echo "[ready] seed"
ALLOW_UAT_SEED=1 npx tsx --env-file=.env.local scripts/seed.ts

echo "[ready] npm verify"
npm run verify

PORT="${PORT:-3000}"
if pids=$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null); then
  echo "[ready] stopping :$PORT ($pids)"
  kill $pids 2>/dev/null || true
  sleep 1
  kill -9 $pids 2>/dev/null || true
fi

rm -rf .next

LOG=/tmp/nexa-ready-dev.log
echo "[ready] next dev :$PORT → $LOG"
NEXT_PUBLIC_APP_URL="http://localhost:${PORT}" NEXA_SKIP_MFA=1 npx next dev -p "$PORT" >"$LOG" 2>&1 &
DEV_PID=$!
echo "$DEV_PID" >"$ROOT/.nexa-ready-dev.pid"

READY=""
for _ in $(seq 1 120); do
  if curl -sf "http://localhost:${PORT}/login" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [[ -z "$READY" ]]; then
  echo "[ready] dev failed"
  tail -60 "$LOG" || true
  kill "$DEV_PID" 2>/dev/null || true
  exit 1
fi

echo "[ready] smoke login"
NEXT_PUBLIC_APP_URL="http://localhost:${PORT}" npx tsx scripts/smoke-login-local.ts || {
  tail -40 "$LOG" || true
  kill "$DEV_PID" 2>/dev/null || true
  exit 1
}

echo "[ready] http://localhost:${PORT}/login (pid $DEV_PID)"
