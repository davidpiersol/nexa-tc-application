#!/usr/bin/env bash
# Single healthy dev server on :3000 — avoids two Next instances (.next churn + broken CSS).
# If webpack logs PackFileCacheStrategy / hasStartTime errors persist, retry with:
#   NEXA_WEBPACK_DEV_MEMORY_CACHE=true npm run dev
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

for port in "${NEXA_DEV_PORT:-3000}"; do
  if [[ -z "${port:-}" ]]; then continue; fi
  if pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null); then
    if [[ -n "$pids" ]]; then
      echo "[dev-fresh] freeing port $port (stopping PID(s): $pids)"
      kill $pids 2>/dev/null || true
      sleep 1
      kill -9 $pids 2>/dev/null || true
    fi
  fi
done

echo "[dev-fresh] rm -rf .next (drop webpack pack + build cache)"
rm -rf .next

PORT="${NEXA_DEV_PORT:-3000}"
echo "[dev-fresh] starting next dev on http://localhost:$PORT"
exec npx next dev -p "$PORT"
