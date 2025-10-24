#!/usr/bin/env bash
set -euo pipefail
# loads .env one directory up
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
if [ -f "$ROOT/.env" ]; then
  set -o allexport; source "$ROOT/.env"; set +o allexport
fi
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"
COMPOSE_FILE="${COMPOSE:-$REPO_ROOT/ARKA-DOCKER/docker-compose.yml}"
ENVFILE="${ENVFILE:-$REPO_ROOT/ARKA-DOCKER/.env}"
if command -v psql >/dev/null 2>&1; then
  psql "host=${DB_HOST:-localhost} port=${DB_PORT:-5432} dbname=${DB_NAME:-arka} user=${DB_USER:-arka} password=${DB_PASSWORD:-arka}" -f "$SCRIPT_DIR/db_sanity.sql"
else
  docker compose -f "$COMPOSE_FILE" --env-file "$ENVFILE" exec -T postgres sh -lc \
    "PGPASSWORD='${DB_PASSWORD:-arka}' psql -U ${DB_USER:-arka} -d ${DB_NAME:-arka} -f -" < "$SCRIPT_DIR/db_sanity.sql"
fi
