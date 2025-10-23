#!/usr/bin/env bash
set -euo pipefail
COMPOSE="${COMPOSE:-ARKA-DOCKER/docker-compose.yml}"
ENVFILE="${ENVFILE:-ARKA-DOCKER/.env}"
source "$ENVFILE" 2>/dev/null || true
PGUSER="${POSTGRES_USER:-arka}"
PGPASS="${POSTGRES_PASSWORD:-arka}"
PGDB="${POSTGRES_DB:-arka}"

for f in db/migrations/*.sql; do
  echo ">> Applying $f"
  docker compose -f "$COMPOSE" exec -T postgres     sh -lc "PGPASSWORD='$PGPASS' psql -U $PGUSER -d $PGDB -f - " < "$f"
done
