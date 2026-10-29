#!/usr/bin/env bash
# KOSA RLS harness — one command, no root, no Docker, no Supabase project.
#
#   ./run.sh            # download the portable PostgreSQL on first run, then test
#   KEEP_DB=1 ./run.sh  # keep the temporary data directory for inspection
#
# Exits 0 only when every assertion passes.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node 22+ is required (node not found on PATH)." >&2
  exit 1
fi

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 22 ]; then
  echo "Node 22+ is required (found $(node -v))." >&2
  exit 1
fi

if [ ! -d node_modules/embedded-postgres ] || [ ! -d node_modules/pg ]; then
  echo "Installing harness dependencies (embedded-postgres, pg)…"
  npm install --no-audit --no-fund
fi

exec node run.js
