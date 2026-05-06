#!/usr/bin/env bash
# Creates .env.local from .env.example only if .env.local does not exist (never overwrites secrets).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/.env.local"
SOURCE="$ROOT/.env.example"
if [[ -f "$TARGET" ]]; then
  echo "✓ .env.local already exists — leaving it untouched."
  exit 0
fi
cp "$SOURCE" "$TARGET"
echo "✓ Created .env.local from .env.example — add your secrets (never commit this file)."
