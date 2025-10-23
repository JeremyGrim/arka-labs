#!/usr/bin/env bash
set -euo pipefail

# Resolve directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CI_DIR="${SCRIPT_DIR}/ci"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# Defaults (override with env)
export ARKA_ROUTING_PORT="${ARKA_ROUTING_PORT:-8087}"
export ARKA_APP_PORT="${ARKA_APP_PORT:-8080}"
export POSTGRES_USER="${POSTGRES_USER:-arka}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-arka}"
export POSTGRES_DB="${POSTGRES_DB:-arka}"
export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"

cd "${REPO_ROOT}"

echo "== Step 4.2 :: Routing health =="
python3 "${CI_DIR}/routing_health.py"

echo "== Step 4.2 :: Schema check =="
python3 "${CI_DIR}/schema_check.py"

echo "== Step 4.2 :: Anti-mock/stub =="
python3 "${CI_DIR}/no_mocks_stubs.py" .

echo "== Step 4.2 :: E2E monolith =="
python3 "${CI_DIR}/e2e_monolith.py"

echo "All green."
