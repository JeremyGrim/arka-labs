#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

COMPOSE="${COMPOSE:-${ROOT_DIR}/../../ARKA-DOCKER/docker-compose.yml}"
ENVFILE="${ENVFILE:-${ROOT_DIR}/../../ARKA-DOCKER/.env}"

source "$ENVFILE" 2>/dev/null || true
PGUSER="${POSTGRES_USER:-arka}"
PGPASS="${POSTGRES_PASSWORD:-arka}"
PGDB="${POSTGRES_DB:-arka}"

f="${ROOT_DIR}/migrations/070_runtime_sessions.sql"
if [ -f "$f" ]; then
  echo ">> Applying ${f}"
  docker compose -f "$COMPOSE" exec -T postgres \
    sh -lc "PGPASSWORD='$PGPASS' psql -U $PGUSER -d $PGDB -f - " < "$f"
else
  echo "Migration 070_runtime_sessions.sql introuvable" >&2
  exit 1
fi
