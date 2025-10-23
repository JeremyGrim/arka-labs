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

for f in "${ROOT_DIR}"/migrations/060_agent_refs.sql "${ROOT_DIR}"/migrations/061_client_agents.sql; do
  [ -f "$f" ] || continue
  echo ">> Applying ${f}"
  docker compose -f "$COMPOSE" exec -T postgres \
    sh -lc "PGPASSWORD='$PGPASS' psql -U $PGUSER -d $PGDB -f -" < "$f"
done
