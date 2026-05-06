#!/usr/bin/env bash
set -euo pipefail

VERIFY_ONLY=0
if [[ "${1:-}" == "--verify-only" ]]; then
  VERIFY_ONLY=1
fi

if pids=$(lsof -t -iTCP:3000 -sTCP:LISTEN 2>/dev/null); then
  if [[ -n "$pids" ]]; then
    echo "[verify:with-clean-dev] stopping listeners on :3000 -> $pids"
    kill $pids || true
    sleep 1
  fi
fi

echo "[verify:with-clean-dev] clearing .next cache"
rm -rf .next

echo "[verify:with-clean-dev] running full verify"
npm run verify

if [[ "$VERIFY_ONLY" -eq 1 ]]; then
  echo "[verify:with-clean-dev] verify-only mode complete"
  exit 0
fi

echo "[verify:with-clean-dev] starting clean dev server"
npm run dev:clean
