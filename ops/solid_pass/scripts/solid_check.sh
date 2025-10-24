#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load env
if [ -f "$ROOT/.env" ]; then
  set -o allexport; source "$ROOT/.env"; set +o allexport
else
  echo "ℹ️  Using defaults. Copy .env.example to .env to customize."
fi

# Python venv hint
if [ ! -d "$ROOT/.venv" ]; then
  echo "⚠️  No virtualenv found. Run: bash install.sh"
fi

echo "== Running SOLID PASS =="
PY_BIN="${PY_BIN:-python3}"
if ! command -v "$PY_BIN" >/dev/null 2>&1; then
  PY_BIN="python"
fi
"$PY_BIN" "$SCRIPT_DIR/solid_runner.py" || EXIT=$? || true
EXIT=${EXIT:-0}

echo
echo "== DB snapshot =="
bash "$SCRIPT_DIR/db_run_sql.sh" || true

echo
echo "Reports generated in $ROOT/reports/"
exit $EXIT
