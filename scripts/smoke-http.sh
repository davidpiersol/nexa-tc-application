#!/usr/bin/env bash
# HTTP smoke — run while `npm run dev` is up (default http://localhost:3000).
set -euo pipefail
BASE="${1:-http://localhost:3000}"
echo "Smoke against $BASE"
fail=0
check() {
  local path="$1"
  local want="$2"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE$path" || echo "000")
  if [[ "$code" != "$want" ]]; then
    echo "FAIL $path -> $code (expected $want)"
    fail=1
  else
    echo "OK   $path -> $code"
  fi
}

check "/" "200"
check "/login" "200"
check "/signup" "200"
check "/auth/mfa" "200"
check "/api/csrf" "200"
# Unauthenticated dashboard: middleware redirects to login
code_tc=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE/tc" || echo "000")
if [[ "$code_tc" != "307" && "$code_tc" != "302" ]]; then
  echo "FAIL /tc -> $code_tc (expected 302 or 307 redirect)"
  fail=1
else
  echo "OK   /tc -> $code_tc (redirect to login)"
fi

exit "$fail"
